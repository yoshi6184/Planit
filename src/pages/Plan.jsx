import { useState, useMemo, Fragment } from 'react'
import { useApp, CATEGORY_TYPES, PRESET_CATEGORIES } from '../context/AppContext'
import { formatCurrency } from '../utils/format'

const currentMonth = '2025-02'

export default function Plan() {
  const { state, dispatch } = useApp()
  const { monthlyIncome, categoryBudgets, transactions } = state
  const [detailCategory, setDetailCategory] = useState(null)
  const [expanded, setExpanded] = useState({ need: true, want: true, bills: true })

  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleIncomeChange = (e) => {
    const v = parseFloat(e.target.value) || 0
    dispatch({ type: 'SET_INCOME', payload: v })
  }

  const handleBudgetChange = (categoryId, value) => {
    const amount = parseFloat(value) || 0
    dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { categoryId, amount } })
  }

  const activityByCategory = useMemo(() => {
    const out = {}
    transactions
      .filter((t) => t.date.startsWith(currentMonth) && t.amount < 0 && t.categoryId)
      .forEach((t) => {
        out[t.categoryId] = (out[t.categoryId] || 0) + t.amount
      })
    return out
  }, [transactions])

  const totalBudgeted = useMemo(
    () => Object.values(categoryBudgets).reduce((a, b) => a + b, 0),
    [categoryBudgets]
  )
  const remainingIncome = monthlyIncome - totalBudgeted

  function getAvailable(catId) {
    const budget = categoryBudgets[catId] || 0
    const activity = activityByCategory[catId] || 0
    return budget + activity
  }

  const detailData = useMemo(() => {
    if (!detailCategory) return null
    const budget = categoryBudgets[detailCategory.id] || 0
    const activity = activityByCategory[detailCategory.id] || 0
    const available = budget + activity
    return {
      availableBalance: available,
      cashLeftLastMonth: null,
      assignedThisMonth: budget,
      spendingThisMonth: Math.abs(activity),
    }
  }, [detailCategory, categoryBudgets, activityByCategory])

  return (
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 600 }}>Plan</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Monthly income</span>
          <span style={{ color: 'var(--text-muted)' }}>$</span>
          <input
            type="number"
            value={monthlyIncome || ''}
            onChange={handleIncomeChange}
            min="0"
            step="100"
            className="plan-income-input"
          />
          {totalBudgeted > 0 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Left: <span className={remainingIncome >= 0 ? 'amount-positive' : 'amount-negative'}>{formatCurrency(remainingIncome)}</span>
            </span>
          )}
        </div>

        <div className="card plan-table-card">
          <div className="table-wrap">
            <table className="plan-table plan-table-condensed">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Category</th>
                  <th className="plan-col-budget">Budget</th>
                  <th className="plan-col-activity">Activity</th>
                  <th className="plan-col-available">Available</th>
                </tr>
              </thead>
              <tbody>
                {CATEGORY_TYPES.map((type) => (
                  <Fragment key={type.id}>
                    <tr
                      className="plan-group-row"
                      onClick={() => toggleSection(type.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSection(type.id) } }}
                    >
                      <td colSpan={5}>
                        <span className="plan-group-chevron">{expanded[type.id] ? '▼' : '▶'}</span>
                        {type.label}
                      </td>
                    </tr>
                    {expanded[type.id] && (PRESET_CATEGORIES[type.id] || []).map((cat) => {
                      const activity = activityByCategory[cat.id] || 0
                      const budget = categoryBudgets[cat.id] || 0
                      const available = getAvailable(cat.id)
                      const spent = Math.abs(activity)
                      const pctSpent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
                      const pctLeft = budget > 0 ? Math.max(0, 100 - pctSpent) : 0
                      return (
                        <Fragment key={cat.id}>
                          <tr className="plan-category-row">
                            <td>
                              <button
                                type="button"
                                className="plan-check"
                                onClick={() => setDetailCategory(detailCategory?.id === cat.id ? null : cat)}
                                title="View details"
                                aria-pressed={detailCategory?.id === cat.id}
                              >
                                {detailCategory?.id === cat.id ? '☑' : '☐'}
                              </button>
                            </td>
                            <td className="plan-cell-category">
                              <div className="plan-category-with-bar">
                                <span className="plan-category-label">
                                  <span className="plan-category-emoji">{cat.emoji}</span>
                                  {cat.name}
                                </span>
                                <div className="plan-stacked-bar">
                                  <div
                                    className="plan-stacked-spent"
                                    style={{ width: `${pctSpent}%` }}
                                    title={`Spent ${formatCurrency(spent)}`}
                                  />
                                  <div
                                    className="plan-stacked-left"
                                    style={{ width: `${pctLeft}%` }}
                                    title={`Left ${formatCurrency(Math.max(0, available))}`}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="plan-cell-budget">
                              <span className="plan-currency">$</span>
                              <input
                                type="number"
                                value={categoryBudgets[cat.id] ?? ''}
                                onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                                min="0"
                                step="10"
                                placeholder="0"
                                className="plan-budget-input"
                              />
                            </td>
                            <td className="plan-cell-amount amount-spent">
                              {activity < 0 ? formatCurrency(Math.abs(activity)) : formatCurrency(0)}
                            </td>
                            <td className={`plan-cell-amount ${available >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                              {formatCurrency(available)}
                            </td>
                          </tr>
                        </Fragment>
                      )
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {detailCategory && detailData && (
        <aside className="plan-detail-panel card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              <span className="plan-category-emoji">{detailCategory.emoji}</span> {detailCategory.name}
            </h3>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
              onClick={() => setDetailCategory(null)}
            >
              Close
            </button>
          </div>
          <dl className="plan-detail-list">
            <dt>Available balance</dt>
            <dd className={detailData.availableBalance >= 0 ? 'amount-positive' : 'amount-negative'}>
              {formatCurrency(detailData.availableBalance)}
            </dd>
            <dt>Cash left from last month</dt>
            <dd>{detailData.cashLeftLastMonth != null ? formatCurrency(detailData.cashLeftLastMonth) : '—'}</dd>
            <dt>Assigned this month</dt>
            <dd>{formatCurrency(detailData.assignedThisMonth)}</dd>
            <dt>Spending this month</dt>
            <dd className="amount-negative">{formatCurrency(detailData.spendingThisMonth)}</dd>
          </dl>
        </aside>
      )}
    </div>
  )
}
