import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useApp } from '../context/AppContext'
import { ACCOUNT_TYPES } from '../context/AppContext'
import { formatCurrency } from '../utils/format'

const currentMonth = '2025-02'

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccount, setNewAccount] = useState({ name: '', type: 'checking' })

  const { monthlyIncome, categories, categoryBudgets, accounts, transactions, quote } = state

  const totalAccounts = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
    [accounts]
  )

  const netWorthChange30 = useMemo(() => {
    const past = new Date()
    past.setDate(past.getDate() - 30)
    const pastStr = past.toISOString().slice(0, 10)
    const last30Tx = transactions.filter((t) => t.date >= pastStr)
    const inflow = last30Tx.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
    const outflow = last30Tx.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
    return inflow - outflow
  }, [transactions])

  const thisMonthSpendByCategory = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date.startsWith(currentMonth) && t.amount < 0)
    const byCat = {}
    monthTx.forEach((t) => {
      if (t.categoryId) {
        byCat[t.categoryId] = (byCat[t.categoryId] || 0) + Math.abs(t.amount)
      }
    })
    return categories
      .map((c) => ({
        name: c.name,
        id: c.id,
        spent: byCat[c.id] || 0,
        budget: categoryBudgets[c.id] || 0,
        available: (categoryBudgets[c.id] || 0) - (byCat[c.id] || 0),
      }))
      .filter((r) => r.budget > 0 || r.spent > 0)
      .sort((a, b) => b.spent - a.spent)
  }, [transactions, categories, categoryBudgets])

  const totalSpent = useMemo(
    () => thisMonthSpendByCategory.reduce((s, r) => s + r.spent, 0),
    [thisMonthSpendByCategory]
  )
  const totalBudgeted = useMemo(
    () => Object.values(categoryBudgets).reduce((a, b) => a + b, 0),
    [categoryBudgets]
  )

  const spendVsBudgetPct = totalBudgeted > 0 ? Math.min(100, (totalSpent / totalBudgeted) * 100) : 0

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
      budget: monthlyIncome || 0,
    }))
  }, [transactions, monthlyIncome])

  const topVendors = useMemo(() => {
    const byPayee = {}
    transactions
      .filter((t) => t.amount < 0 && t.payee)
      .forEach((t) => {
        byPayee[t.payee] = (byPayee[t.payee] || 0) + Math.abs(t.amount)
      })
    return Object.entries(byPayee)
      .map(([payee, amount]) => ({ payee, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
  }, [transactions])

  const topIncomes = useMemo(() => {
    const byPayee = {}
    transactions
      .filter((t) => t.amount > 0 && t.payee && t.payee !== 'RRSP Contribution')
      .forEach((t) => {
        byPayee[t.payee] = (byPayee[t.payee] || 0) + t.amount
      })
    const sorted = Object.entries(byPayee)
      .map(([payee, amount]) => ({ payee, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2)
    const labels = ['Employment', 'Investment income']
    return sorted.map((item, i) => ({ ...item, label: labels[i] || 'Other' }))
  }, [transactions])

  const categorySpendAllTime = useMemo(() => {
    const byCat = {}
    transactions.filter((t) => t.amount < 0).forEach((t) => {
      const id = t.categoryId || 'uncategorized'
      byCat[id] = (byCat[id] || 0) + Math.abs(t.amount)
    })
    return categories
      .map((c) => ({
        name: c.name,
        id: c.id,
        spent: byCat[c.id] || 0,
        budget: categoryBudgets[c.id] || 0,
      }))
      .filter((r) => r.spent > 0 || r.budget > 0)
      .sort((a, b) => b.spent - a.spent)
  }, [transactions, categories, categoryBudgets])

  const pieData = thisMonthSpendByCategory
    .filter((r) => r.spent > 0)
    .map((r) => ({ name: r.name, value: r.spent }))
  const totalSpentPie = useMemo(() => pieData.reduce((s, d) => s + d.value, 0), [pieData])
  const PIE_COLORS = ['#475569', '#64748b', '#0d9488', '#059669', '#0284c7', '#2563eb', '#4f46e5', '#6d28d9', '#7c3aed', '#9d174d']

  const getAccountTypeLabel = (typeId) => ACCOUNT_TYPES.find((t) => t.id === typeId)?.label || typeId
  const getCategoryName = (categoryId) => categories.find((c) => c.id === categoryId)?.name || '—'

  const uncategorizedCount = useMemo(
    () => transactions.filter((t) => t.amount < 0 && !t.categoryId).length,
    [transactions]
  )
  const unreconciledCount = useMemo(
    () => accounts.filter((a) => !a.lastReconciledAt).length,
    [accounts]
  )

  const actionChecklist = useMemo(
    () => [
      { id: 'bank', label: 'Connect bank account', done: false, href: '/transactions' },
      { id: 'budget', label: 'Add a budget', done: totalBudgeted > 0, href: '/plan' },
      { id: 'categorize', label: uncategorizedCount > 0 ? `Categorize ${uncategorizedCount} transaction${uncategorizedCount !== 1 ? 's' : ''}` : 'Categorize transactions', done: uncategorizedCount === 0, href: '/transactions' },
      { id: 'income', label: 'Set monthly income', done: (monthlyIncome || 0) > 0, href: '/plan' },
      { id: 'reconcile', label: unreconciledCount > 0 ? `Reconcile ${unreconciledCount} account${unreconciledCount !== 1 ? 's' : ''}` : 'Reconcile accounts', done: unreconciledCount === 0, href: '/transactions' },
    ],
    [totalBudgeted, uncategorizedCount, monthlyIncome, unreconciledCount]
  )

  const recentTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [transactions]
  )

  const handleAddAccount = (e) => {
    e.preventDefault()
    if (!newAccount.name.trim()) return
    dispatch({
      type: 'ADD_ACCOUNT',
      payload: { name: newAccount.name.trim(), type: newAccount.type },
    })
    setNewAccount({ name: '', type: 'checking' })
    setShowAddAccount(false)
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 1rem', fontSize: '1.35rem', fontWeight: 600 }}>Dashboard</h1>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left: accounts, net worth, action checklist */}
        <aside style={{ width: 260, flexShrink: 0 }}>
          <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Accounts</h2>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                onClick={() => setShowAddAccount(true)}
              >
                + Add account
              </button>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {accounts.map((acc) => (
                <li key={acc.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/transactions/accounts/${acc.id}`)}
                    className="dashboard-account-row"
                  >
                    <div style={{ fontWeight: 500 }}>{acc.name}</div>
                    <div className="dashboard-account-meta">
                      <span className="dashboard-account-type">{getAccountTypeLabel(acc.type)}</span>
                      <span className={`dashboard-account-value ${(acc.balance || 0) >= 0 ? 'amount-positive' : acc.type === 'credit' ? 'amount-negative' : 'amount-spent'}`}>
                        {acc.balance >= 0 ? '' : '-'}{formatCurrency(Math.abs(acc.balance || 0))}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            {showAddAccount && (
              <form onSubmit={handleAddAccount} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <input
                  value={newAccount.name}
                  onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Account name"
                  autoFocus
                  style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                />
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount((p) => ({ ...p, type: e.target.value }))}
                  className="select-input"
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddAccount(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>

          <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Net worth</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }} className={totalAccounts >= 0 ? 'amount-positive' : 'amount-spent'}>
              {formatCurrency(totalAccounts)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {netWorthChange30 >= 0 ? 'Up' : 'Down'} {formatCurrency(Math.abs(netWorthChange30))} from last 30 days
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>Action checklist</h2>
            <ul className="dashboard-checklist">
              {actionChecklist.map((item) => (
                <li key={item.id}>
                  <Link to={item.href} className={`dashboard-checklist-item ${item.done ? 'done' : ''}`}>
                    <span className="dashboard-checklist-icon" aria-hidden>{item.done ? '✓' : '○'}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600 }}>Recent transactions</h2>
            <ul className="dashboard-recent-list">
              {recentTransactions.map((t) => (
                <li key={t.id}>
                  <div className="dashboard-recent-main">
                    <span className="dashboard-recent-payee">{t.payee || '(No payee)'}</span>
                    <span className={t.amount >= 0 ? 'amount-positive' : 'amount-spent'}>
                      {t.amount < 0 ? '-' + formatCurrency(Math.abs(t.amount)) : formatCurrency(t.amount)}
                    </span>
                  </div>
                  <div className="dashboard-recent-meta">
                    <span>{t.date}</span>
                    <span>· {getCategoryName(t.categoryId)}</span>
                  </div>
                </li>
              ))}
              {recentTransactions.length === 0 && (
                <li style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No recent transactions.</li>
              )}
            </ul>
          </div>
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="quote-block">
            <p className="quote-text">"{typeof quote === 'object' && quote?.text ? quote.text : quote}"</p>
            {typeof quote === 'object' && quote?.author && (
              <p className="quote-author">— {quote.author}</p>
            )}
          </div>

          {/* Long bar: spend out of budget */}
          <div className="card dashboard-spend-bar-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Spend out of budget this month</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                <span className="amount-spent">{formatCurrency(totalSpent)}</span>
                <span style={{ color: 'var(--text-muted)' }}> / {formatCurrency(totalBudgeted)}</span>
              </span>
            </div>
            <div className="dashboard-spend-bar">
              <div
                className="dashboard-spend-bar-fill"
                style={{ width: `${spendVsBudgetPct}%` }}
              />
            </div>
          </div>

          {/* Line chart: aggregate over time vs budget */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Spending over time vs budget</h2>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  stroke="#8c8c8c"
                  tickFormatter={(val) => {
                    const d = new Date(val + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short' })
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} stroke="#8c8c8c" />
                <Tooltip
                  formatter={(v) => [formatCurrency(v)]}
                  labelFormatter={(l) => {
                    const d = new Date(l + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  }}
                />
                <Line type="monotone" dataKey="spent" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4 }} name="Spent" />
                <Line type="monotone" dataKey="budget" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Budget" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie + Top 10 vendors */}
        <div className="dashboard-pie-vendors">
          <div className="card dashboard-pie-card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Spending by category</h2>
            {pieData.length > 0 ? (
              <div className="dashboard-pie-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={125}
                      outerRadius={180}
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
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [formatCurrency(v)]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="dashboard-pie-center">
                  <span className="dashboard-pie-center-label">Total</span>
                  <span className="dashboard-pie-center-value">{formatCurrency(totalSpentPie)}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No spending this month.</p>
            )}
          </div>
          <div className="card dashboard-vendors-card">
            <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Top 10 vendors</h2>
            {topVendors.length > 0 ? (
              <ul className="dashboard-vendor-list">
                {topVendors.map((v, i) => (
                  <li key={v.payee}>
                    <span>{i + 1}. {v.payee}</span>
                    <span className="amount-spent">{formatCurrency(v.amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No vendor data.</p>
            )}
            {topIncomes.length > 0 && (
              <>
                <h2 style={{ margin: '1.25rem 0 0.5rem', fontSize: '1rem', fontWeight: 600 }}>Top Income</h2>
                <div className="dashboard-income-section">
                  {topIncomes.map((inc) => (
                    <div key={inc.payee} className="dashboard-income-row">
                      <span>{inc.label} · {inc.payee}</span>
                      <span className="amount-positive">{formatCurrency(inc.amount)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary from reports + bars (budget, activity, available) */}
        <div className="card">
          <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Summary by category</h2>
          <div className="table-wrap">
            <table className="dashboard-summary-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="dashboard-summary-bar-th"></th>
                  <th style={{ textAlign: 'right', width: 90 }}>Budget</th>
                  <th style={{ textAlign: 'right', width: 90 }}>Activity</th>
                  <th style={{ textAlign: 'right', width: 90 }}>Available</th>
                </tr>
              </thead>
              <tbody>
                {categorySpendAllTime.slice(0, 12).map((r) => {
                  const monthSpent = thisMonthSpendByCategory.find((x) => x.id === r.id)?.spent ?? 0
                  const budget = r.budget || 0
                  const available = budget - monthSpent
                  const pctSpent = budget > 0 ? Math.min(100, (monthSpent / budget) * 100) : 0
                  const pctAvail = budget > 0 ? Math.max(0, 100 - pctSpent) : 0
                  return (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>
                        <div className="dashboard-summary-bar">
                          <div className="dashboard-summary-bar-spent" style={{ width: `${pctSpent}%` }} />
                          <div className="dashboard-summary-bar-avail" style={{ width: `${pctAvail}%` }} />
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(budget)}</td>
                      <td style={{ textAlign: 'right' }} className="amount-spent">{formatCurrency(monthSpent)}</td>
                      <td style={{ textAlign: 'right' }} className={available >= 0 ? 'amount-positive' : 'amount-negative'}>
                        {formatCurrency(available)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
