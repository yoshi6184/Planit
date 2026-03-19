import { useState, useMemo } from 'react'
import { XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line, Area, PieChart, Pie, Cell } from 'recharts'
import { useApp } from '../context/AppContext'
import { MOCK_SUBSCRIPTIONS, DEFAULT_DEBT_BY_MONTH, getCategoryEmoji } from '../data/mockData'
import { formatCurrency } from '../utils/format'
import AccountDisplayName from '../components/AccountDisplayName'
import PageHeaderRow from '../components/PageHeaderRow'

// Neutral-first palette: biggest spend categories use greys, then accents
// Match dashboard spending pie palette
const PIE_COLORS_OTHER = ['#64748b', '#0d9488', '#059669', '#0284c7', '#94a3b8', '#475569', '#0f766e', '#0369a1', '#1e40af', '#6b7280']
const getPieColor = (index) => (index === 0 ? '#5B6ADF' : PIE_COLORS_OTHER[(index - 1) % PIE_COLORS_OTHER.length])
const INCOME_BAR = '#5B6ADF'
const EXPENSE_BAR = '#94a3b8'

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
      .map((c) => ({ id: c.id, name: c.name, spent: byCat[c.id] || 0, budget: categoryBudgets[c.id] || 0 }))
      .filter((r) => r.spent > 0 || r.budget > 0)
      .sort((a, b) => b.spent - a.spent)
  }, [transactions, categories, categoryBudgets])

  const currentMonthKey = MONTHS[MONTHS.length - 1]
  const reportSpendByCategoryThisMonth = useMemo(() => {
    const byCat = {}
    transactions
      .filter((t) => t.date.startsWith(currentMonthKey) && t.amount < 0 && t.categoryId)
      .forEach((t) => {
        byCat[t.categoryId] = (byCat[t.categoryId] || 0) + Math.abs(t.amount)
      })
    return categories
      .map((c) => ({ id: c.id, name: c.name, spent: byCat[c.id] || 0 }))
      .filter((r) => r.spent > 0)
      .sort((a, b) => b.spent - a.spent)
  }, [transactions, categories, currentMonthKey])
  const reportTotalSpentThisMonth = useMemo(
    () => reportSpendByCategoryThisMonth.reduce((s, r) => s + r.spent, 0),
    [reportSpendByCategoryThisMonth]
  )

  const totalSpent = useMemo(
    () => transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions]
  )

  // Average daily spend is computed month-over-month below for the active month.

  const mostFrequentCategory = useMemo(() => {
    const counts = {}
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      const id = t.categoryId || 'uncategorized'
      counts[id] = (counts[id] || 0) + 1
    })
    let bestId = null
    let bestCount = 0
    Object.entries(counts).forEach(([id, count]) => {
      if (count > bestCount) {
        bestCount = count
        bestId = id
      }
    })
    if (!bestId) return { name: '—', count: 0 }
    if (bestId === 'uncategorized') return { name: 'Uncategorized', count: bestCount }
    const cat = categories.find((c) => c.id === bestId)
    return { name: cat ? cat.name : 'Other', count: bestCount }
  }, [transactions, categories])

  const largestOutflow = useMemo(() => {
    const spendingTx = transactions.filter((t) => t.amount < 0)
    if (spendingTx.length === 0) return { name: '—', amount: 0 }
    let minTx = spendingTx[0]
    spendingTx.forEach((t) => {
      if (t.amount < minTx.amount) minTx = t
    })
    const cat = categories.find((c) => c.id === minTx.categoryId)
    const name = cat ? cat.name : 'Uncategorized'
    return { name, amount: Math.abs(minTx.amount || 0) }
  }, [transactions, categories])

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

  const previousMonthKey = MONTHS[MONTHS.length - 2]

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

  // Month-over-month spend and daily averages
  const monthlySpendMap = useMemo(() => {
    const byMonth = {}
    transactions.forEach((t) => {
      if (t.amount >= 0 || !t.date) return
      const month = t.date.slice(0, 7)
      byMonth[month] = (byMonth[month] || 0) + Math.abs(t.amount)
    })
    return byMonth
  }, [transactions])

  const dailySpendByMonth = useMemo(() => {
    const totals = {}
    const days = {}
    transactions.forEach((t) => {
      if (t.amount >= 0 || !t.date) return
      const month = t.date.slice(0, 7)
      totals[month] = (totals[month] || 0) + Math.abs(t.amount)
      if (!days[month]) days[month] = new Set()
      days[month].add(t.date)
    })
    const out = {}
    Object.keys(totals).forEach((m) => {
      const dayCount = days[m] ? days[m].size : 1
      out[m] = {
        total: totals[m],
        averageDaily: totals[m] / dayCount,
      }
    })
    return out
  }, [transactions])

  const monthSpendCurrent = monthlySpendMap[currentMonthKey] || 0
  const monthSpendPrev = monthlySpendMap[previousMonthKey] || 0

  const averageDailyCurrent = dailySpendByMonth[currentMonthKey]?.averageDaily || 0
  const averageDailyPrev = dailySpendByMonth[previousMonthKey]?.averageDaily || 0

  const pctChange = (curr, prev) => {
    if (!prev) return null
    return ((curr - prev) / Math.abs(prev)) * 100
  }

  const avgMonthlyPct = pctChange(monthSpendCurrent, monthSpendPrev)
  const avgDailyPct = pctChange(averageDailyCurrent, averageDailyPrev)

  const averageMonthlySpend = monthSpendCurrent

  // Removed: Spending by category (stacked by month)

  const averageDailySpend = useMemo(() => averageDailyCurrent, [averageDailyCurrent])

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

  // Removed: Stacked chart visibility controls

  return (
    <div className="reports-page">
      <PageHeaderRow left={<h1 className="transactions-title" style={{ margin: 0 }}>Reports & trends</h1>} />

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
          <div className="transactions-summary-strip" style={{ marginBottom: '1.5rem' }}>
            <div className="transactions-summary-item">
              <div className="transactions-summary-label">Average monthly spending</div>
              <div className="transactions-summary-value transactions-summary-value-negative">
                {formatCurrency(averageMonthlySpend)}
              </div>
              <div className="transactions-summary-pct" style={{ color: avgMonthlyPct != null ? (avgMonthlyPct >= 0 ? 'var(--red)' : 'var(--green)') : 'var(--text-muted)' }}>
                {avgMonthlyPct != null ? `${avgMonthlyPct >= 0 ? '+' : ''}${avgMonthlyPct.toFixed(1)}%` : '—'} vs last month
              </div>
            </div>
            <div className="transactions-summary-item">
              <div className="transactions-summary-label">Average daily spending</div>
              <div className="transactions-summary-value transactions-summary-value-negative">
                {formatCurrency(averageDailySpend)}
              </div>
              <div className="transactions-summary-pct" style={{ color: avgDailyPct != null ? (avgDailyPct >= 0 ? 'var(--red)' : 'var(--green)') : 'var(--text-muted)' }}>
                {avgDailyPct != null ? `${avgDailyPct >= 0 ? '+' : ''}${avgDailyPct.toFixed(1)}%` : '—'} vs last month
              </div>
            </div>
            <div className="transactions-summary-item">
              <div className="transactions-summary-label">Most frequent category</div>
              <div className="transactions-summary-value" style={{ fontWeight: 600 }}>
                {mostFrequentCategory.name}
              </div>
              <div className="transactions-summary-pct" style={{ color: 'var(--text-muted)' }}>
                {mostFrequentCategory.count || 0} transaction{mostFrequentCategory.count === 1 ? '' : 's'}
              </div>
            </div>
            <div className="transactions-summary-item">
              <div className="transactions-summary-label">Largest outflow</div>
              <div className="transactions-summary-value" style={{ fontWeight: 600 }}>
                {largestOutflow.name}
              </div>
              <div className="transactions-summary-pct" style={{ color: 'var(--text-muted)' }}>
                {formatCurrency(largestOutflow.amount)}
              </div>
            </div>
          </div>
          <div className="reports-spending-split" style={{ marginBottom: '1.5rem' }}>
            <div className="reports-spending-pie-half">
              <div className="card reports-spending-pie-card">
                <h2 className="reports-spending-pie-title">Spending by category</h2>
                {reportSpendByCategoryThisMonth.length > 0 ? (
                  <div className="dashboard-pie-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportSpendByCategoryThisMonth.map((r) => ({ name: r.name, value: r.spent }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={135}
                          outerRadius={190}
                          paddingAngle={1}
                          dataKey="value"
                          nameKey="name"
                          strokeWidth={0}
                          label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                            const RADIAN = Math.PI / 180
                            const r = outerRadius + 12
                            const x = cx + r * Math.cos(-midAngle * RADIAN)
                            const y = cy + r * Math.sin(-midAngle * RADIAN)
                            return (
                              <text x={x} y={y} textAnchor={x >= cx ? 'start' : 'end'} dominantBaseline="central" className="dashboard-pie-label" fill="currentColor">
                                {name} {(percent * 100).toFixed(0)}%
                              </text>
                            )
                          }}
                        >
                          {reportSpendByCategoryThisMonth.map((_, i) => (
                            <Cell key={i} fill={getPieColor(i)} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [formatCurrency(v)]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="dashboard-pie-center reports-pie-center-total">
                      <span className="dashboard-pie-center-label">TOTAL</span>
                      <span className="dashboard-pie-center-value">{formatCurrency(reportTotalSpentThisMonth)}</span>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No spending this month.</p>
                )}
              </div>
            </div>
            <div className="reports-spending-list-half">
              <div className="card reports-spending-list-card">
                <div className="reports-spending-list-header">
                  <span>Categories</span>
                  <span>Total Spending</span>
                </div>
                <ul className="reports-spending-list">
                  {reportSpendByCategoryThisMonth.map((row, i) => {
                    const pct = reportTotalSpentThisMonth ? (row.spent / reportTotalSpentThisMonth) * 100 : 0
                    const barColor = getPieColor(i)
                    return (
                      <li key={row.id || row.name} className="reports-spending-list-row">
                        <div className="reports-spending-list-line1">
                          <span className="reports-spending-list-icon" aria-hidden>{getCategoryEmoji(row.id)}</span>
                          <span className="reports-spending-list-name">{row.name}</span>
                          <span className="reports-spending-list-amount">{formatCurrency(row.spent)}</span>
                        </div>
                        <div className="reports-spending-list-line2">
                          <div className="reports-spending-list-bar-container">
                            <div
                              className="reports-spending-list-bar"
                              style={{ width: `${pct}%`, background: barColor }}
                            />
                            <span className="reports-spending-list-pct">{Math.round(pct)}%</span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {reportSpendByCategoryThisMonth.length === 0 && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>No spending this month.</p>
                )}
              </div>
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
                      <td><AccountDisplayName account={acc} /></td>
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
          <div style={{ height: 320, marginBottom: '1.25rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeVsExpenseByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="35%">
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short' })
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => '$' + Math.round(v).toLocaleString('en-US')} />
                <Tooltip
                  formatter={(v) => [formatCurrency(v)]}
                  labelFormatter={(label) => {
                    const d = new Date(label + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  }}
                />
                <Bar dataKey="income" name="Income" fill={INCOME_BAR} radius={[8, 8, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill={EXPENSE_BAR} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="goals-debt-legend" style={{ marginTop: 0, marginBottom: '1rem', paddingTop: 0, borderTop: 'none' }}>
            <span className="goals-debt-legend-item" style={{ color: 'var(--text-muted)' }}>
              <span className="goals-debt-legend-swatch" style={{ background: INCOME_BAR, opacity: 0.9 }} />
              Income
            </span>
            <span className="goals-debt-legend-item" style={{ color: 'var(--text-muted)' }}>
              <span className="goals-debt-legend-swatch" style={{ background: EXPENSE_BAR, opacity: 0.9 }} />
              Expense
            </span>
          </div>
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
