import { useState, useMemo, useEffect } from 'react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, Area } from 'recharts'
import { useApp } from '../context/AppContext'
import { MOCK_SUBSCRIPTIONS, DEFAULT_DEBT_BY_MONTH } from '../data/mockData'
import { formatCurrency } from '../utils/format'

// Neutral-first palette: biggest spend categories use greys, then accents
const STACK_COLORS = [
  '#111827',
  '#4b5563',
  '#6b7280',
  '#9ca3af',
  '#d1d5db',
  '#0d9488',
  '#059669',
  '#0284c7',
  '#2563eb',
  '#4f46e5',
  '#6d28d9',
  '#7c3aed',
  '#9d174d',
  '#b45309',
  '#dc2626',
]

const MONTHS = ['2024-11', '2024-12', '2025-01', '2025-02']

const REPORT_TABS = [
  { id: 'spending', label: 'Spending Trends' },
  { id: 'networth', label: 'Net Worth' },
  { id: 'income-expense', label: 'Income vs Expense' },
  { id: 'debt', label: 'Debt over time' },
  { id: 'subscriptions', label: 'Subscription Tracker' },
]

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Reports() {
  const { state } = useApp()
  const { transactions, categories, categoryBudgets, accounts } = state
  const [activeTab, setActiveTab] = useState('spending')
  const [categoryVisibility, setCategoryVisibility] = useState(() => ({}))

  const monthlyTrend = useMemo(() => {
    const byMonth = {}
    transactions.forEach((t) => {
      if (t.amount >= 0) return
      const month = t.date.slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + Math.abs(t.amount)
    })
    return ['2024-11', '2024-12', '2025-01', '2025-02'].map((m) => ({
      month: m,
      spent: byMonth[m] || 0,
    }))
  }, [transactions])

  const incomeVsExpenseByMonth = useMemo(() => {
    const byMonth = {}
    transactions.forEach((t) => {
      const month = t.date.slice(0, 7)
      if (!byMonth[month]) byMonth[month] = { income: 0, expense: 0 }
      if (t.amount >= 0) byMonth[month].income += t.amount
      else byMonth[month].expense += Math.abs(t.amount)
    })
    return ['2024-11', '2024-12', '2025-01', '2025-02'].map((m) => ({
      month: m,
      income: byMonth[m]?.income || 0,
      expense: byMonth[m]?.expense || 0,
    }))
  }, [transactions])

  const categorySpend = useMemo(() => {
    const byCat = {}
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      const id = t.categoryId || 'uncategorized'
      byCat[id] = (byCat[id] || 0) + Math.abs(t.amount)
    })
    return categories
      .map((c) => ({ name: c.name, spent: byCat[c.id] || 0, budget: categoryBudgets[c.id] || 0 }))
      .filter((r) => r.spent > 0 || r.budget > 0)
      .sort((a, b) => b.spent - a.spent)
  }, [transactions, categories, categoryBudgets])

  const totalSpent = useMemo(
    () => transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions]
  )

  const netWorth = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
    [accounts]
  )

  const netWorthTrend = useMemo(() => {
    const netChangeByMonth = {}
    transactions.forEach((t) => {
      const month = t.date.slice(0, 7)
      if (!MONTHS.includes(month)) return
      netChangeByMonth[month] = (netChangeByMonth[month] || 0) + (t.amount || 0)
    })

    const netWorthByMonth = {}
    let running = netWorth
    for (let i = MONTHS.length - 1; i >= 0; i -= 1) {
      const m = MONTHS[i]
      netWorthByMonth[m] = running
      running -= netChangeByMonth[m] || 0
    }

    return MONTHS.map((m) => ({
      month: m,
      netWorth: netWorthByMonth[m],
    }))
  }, [transactions, netWorth])

  const totalMonthlySubscriptions = useMemo(
    () => MOCK_SUBSCRIPTIONS.reduce((sum, s) => sum + s.pricePerMonth, 0),
    []
  )
  const totalAnnualSubscriptions = useMemo(
    () => MOCK_SUBSCRIPTIONS.reduce((sum, s) => sum + s.pricePerMonth * 12, 0),
    []
  )
  const subscriptionCount = MOCK_SUBSCRIPTIONS.length
  const activeSubscriptionCount = MOCK_SUBSCRIPTIONS.filter((s) => s.active !== false).length

  const debtChartData = useMemo(() => {
    const entries = Object.entries(DEFAULT_DEBT_BY_MONTH || {}).sort(([a], [b]) => (a < b ? -1 : 1))
    return entries.map(([month, v]) => ({
      month,
      'Credit card': v.creditCard ?? 0,
      'Student loans': v.studentLoans ?? 0,
    }))
  }, [])

  const formatWholeCurrency = (n) => '$' + Math.round(n || 0).toLocaleString('en-US')

  const averageMonthlySpend = useMemo(() => {
    if (monthlyTrend.length === 0) return 0
    return monthlyTrend.reduce((s, r) => s + r.spent, 0) / monthlyTrend.length
  }, [monthlyTrend])

  const { stackedChartData, stackCategoryNames } = useMemo(() => {
    const byMonthByCat = {}
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      const month = t.date.slice(0, 7)
      const cat = categories.find((c) => c.id === t.categoryId)
      const name = cat ? cat.name : 'Uncategorized'
      if (!byMonthByCat[month]) byMonthByCat[month] = {}
      byMonthByCat[month][name] = (byMonthByCat[month][name] || 0) + Math.abs(t.amount)
    })
    const names = [...new Set(MONTHS.flatMap((m) => Object.keys(byMonthByCat[m] || {})))].sort()
    const data = MONTHS.map((m) => {
      const row = { month: m }
      names.forEach((name) => { row[name] = byMonthByCat[m]?.[name] || 0 })
      return row
    })
    return { stackedChartData: data, stackCategoryNames: names }
  }, [transactions, categories])

  const spendingCompareTable = useMemo(() => {
    return monthlyTrend.map((r) => {
      const vsAvg = r.spent - averageMonthlySpend
      const pct = averageMonthlySpend ? (vsAvg / averageMonthlySpend) * 100 : 0
      return {
        month: r.month,
        totalSpend: r.spent,
        vsAvg,
        pct,
      }
    })
  }, [monthlyTrend, averageMonthlySpend])

  const topFiveCategoryNames = useMemo(
    () => categorySpend.slice(0, 5).map((c) => c.name),
    [categorySpend]
  )

  const orderedStackNames = useMemo(() => {
    const top = stackCategoryNames.filter((name) => topFiveCategoryNames.includes(name))
    const rest = stackCategoryNames.filter((name) => !topFiveCategoryNames.includes(name))
    return [...top, ...rest]
  }, [stackCategoryNames, topFiveCategoryNames])

  useEffect(() => {
    if (!stackCategoryNames.length) return
    if (Object.keys(categoryVisibility).length > 0) return
    const initial = Object.fromEntries(
      stackCategoryNames.map((name) => [name, topFiveCategoryNames.includes(name)])
    )
    setCategoryVisibility(initial)
  }, [stackCategoryNames, topFiveCategoryNames, categoryVisibility])

  return (
    <div>
      <h1 style={{ margin: '0 0 1rem', fontSize: '1.5rem' }}>Reports & trends</h1>

      <nav className="reports-tabs" role="tablist">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`reports-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'spending' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>Average monthly spend</h2>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }} className="amount-spent">
              {formatCurrency(averageMonthlySpend)}
            </p>
          </div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Spending by category (stacked by month)</h2>
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Click a category in the legend to show or hide it.
            </p>
            <div style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stackedChartData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  barCategoryGap="70%"
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => {
                      const d = new Date(val + '-01')
                      return d.toLocaleDateString('en-US', { month: 'short' })
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v) => [formatCurrency(v)]} labelFormatter={(l) => l} />
                  {orderedStackNames.map((name, i) => {
                    const visible = categoryVisibility[name] !== false
                    return (
                      <Bar
                        key={name}
                        dataKey={name}
                        stackId="spend"
                        fill={STACK_COLORS[i % STACK_COLORS.length]}
                        name={name}
                        hide={!visible}
                      />
                    )
                  })}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="reports-category-legend">
              {orderedStackNames.map((name, i) => {
                const visible = categoryVisibility[name] !== false
                return (
                  <button
                    key={name}
                    type="button"
                    className={`reports-legend-item ${visible ? '' : 'inactive'}`}
                    onClick={() => setCategoryVisibility((prev) => ({ ...prev, [name]: !visible }))}
                  >
                    <span className="reports-legend-swatch" style={{ background: STACK_COLORS[i % STACK_COLORS.length] }} />
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Monthly spend vs average</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th style={{ textAlign: 'right' }}>Total spend</th>
                    <th style={{ textAlign: 'right' }}>Compared to average</th>
                  </tr>
                </thead>
                <tbody>
                  {spendingCompareTable.map((r) => {
                    const d = new Date(r.month + '-01')
                    const monthLabel = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    const sign = r.vsAvg >= 0 ? '+' : ''
                    const pctStr = r.pct >= 0 ? `(+${r.pct.toFixed(1)}%)` : `(${r.pct.toFixed(1)}%)`
                    return (
                      <tr key={r.month}>
                        <td>{monthLabel}</td>
                        <td style={{ textAlign: 'right' }} className="amount-spent">
                          {formatCurrency(r.totalSpend)}
                        </td>
                        <td style={{ textAlign: 'right' }} className={r.vsAvg < 0 ? 'amount-negative' : ''}>
                          {sign}{formatCurrency(r.vsAvg)} {pctStr}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'networth' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Net worth over time</h2>
            <div style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={netWorthTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="reportsNetWorthGradient" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
                      <stop offset="0%" stopColor="#BFC4FF" stopOpacity={1} />
                      <stop offset="50%" stopColor="#E0E4FF" stopOpacity={1} />
                      <stop offset="100%" stopColor="#F6F8FF" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    stroke="#8c8c8c"
                    tickFormatter={(val) => {
                      const d = new Date(val + '-01')
                      return d.toLocaleDateString('en-US', { month: 'short' })
                    }}
                  />
                  <YAxis type="number" domain={['auto', 'auto']} tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} stroke="#8c8c8c" />
                  <Tooltip
                    formatter={(v) => [formatCurrency(v)]}
                    labelFormatter={(l) => {
                      const d = new Date(l + '-01')
                      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                    }}
                  />
                  <Area type="monotone" dataKey="netWorth" fill="url(#reportsNetWorthGradient)" fillOpacity={1} stroke="none" baseValue="dataMin" />
                  <Line type="monotone" dataKey="netWorth" stroke="#7B85F7" strokeWidth={2} dot={{ r: 4 }} name="Net worth" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Net worth breakdown</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              {formatCurrency(netWorth)}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Sum of all account balances
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th style={{ textAlign: 'right' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td>{acc.name}</td>
                      <td style={{ textAlign: 'right' }} className={acc.balance >= 0 ? 'amount-positive' : 'amount-negative'}>
                        {formatCurrency(acc.balance || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'income-expense' && (
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Income vs expense by month</h2>
          <div className="table-wrap">
            <table className="reports-income-expense-table">
              <thead>
                <tr>
                  <th style={{ width: 120 }}></th>
                  {incomeVsExpenseByMonth.map((row) => (
                    <th key={row.month} style={{ textAlign: 'right' }}>
                      {(() => {
                        const d = new Date(row.month + '-01')
                        return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      })()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Income</td>
                  {incomeVsExpenseByMonth.map((row) => (
                    <td key={row.month} style={{ textAlign: 'right' }}>
                      {formatCurrency(row.income)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td>Expense</td>
                  {incomeVsExpenseByMonth.map((row) => (
                    <td key={row.month} style={{ textAlign: 'right' }}>
                      {'-' + formatCurrency(row.expense)}
                    </td>
                  ))}
                </tr>
                <tr className="reports-net-income-row">
                  <td>Net income</td>
                  {incomeVsExpenseByMonth.map((row) => {
                    const net = row.income - row.expense
                    return (
                      <td key={row.month} style={{ textAlign: 'right' }} className={net >= 0 ? 'amount-positive' : 'amount-negative'}>
                        {formatCurrency(net)}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'debt' && debtChartData.length > 0 && (
        <div className="card goals-debt-card">
          <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>Debt over time</h2>
          <p className="goals-debt-subtitle">Stacked bars by month. Hover for amounts.</p>
          <div className="goals-debt-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={debtChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatWholeCurrency(v)} />
                <Tooltip
                  formatter={(v) => [formatWholeCurrency(v)]}
                  labelFormatter={(label) => {
                    const d = new Date(label + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  }}
                />
                <Bar dataKey="Credit card" stackId="debt" fill="var(--debt-credit)" name="Credit card" />
                <Bar dataKey="Student loans" stackId="debt" fill="var(--debt-student)" name="Student loans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="goals-debt-legend">
            <span className="goals-debt-legend-item">
              <span className="goals-debt-legend-swatch" style={{ background: 'var(--debt-credit)' }} />
              Credit card
            </span>
            <span className="goals-debt-legend-item">
              <span className="goals-debt-legend-swatch" style={{ background: 'var(--debt-student)' }} />
              Student loans
            </span>
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Subscription Tracker</h2>
          <div className="reports-subscription-summary">
            <div className="reports-subscription-summary-item">
              <span className="reports-subscription-summary-label">Subscriptions tracked</span>
              <span className="reports-subscription-summary-value">{subscriptionCount}</span>
            </div>
            <div className="reports-subscription-summary-item">
              <span className="reports-subscription-summary-label">Monthly recurring</span>
              <span className="reports-subscription-summary-value">{formatCurrency(totalMonthlySubscriptions)}</span>
            </div>
            <div className="reports-subscription-summary-item">
              <span className="reports-subscription-summary-label">Annual total</span>
              <span className="reports-subscription-summary-value">{formatCurrency(totalAnnualSubscriptions)}</span>
            </div>
            <div className="reports-subscription-summary-item">
              <span className="reports-subscription-summary-label">Active</span>
              <span className="reports-subscription-summary-value">{activeSubscriptionCount} of {subscriptionCount}</span>
            </div>
          </div>
          <div className="table-wrap">
            <table className="reports-subscription-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}></th>
                  <th>Subscription</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Next billed</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_SUBSCRIPTIONS.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <span className="reports-subscription-icon" aria-hidden>
                        {sub.icon}
                      </span>
                    </td>
                    <td>
                      <span className="reports-subscription-name">{sub.name}</span>
                      <span className="reports-subscription-frequency">{sub.frequency || 'Monthly'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }} className="amount-spent">
                      {formatCurrency(sub.pricePerMonth)}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                      {formatDate(sub.nextBilled)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
