import { useState, useMemo, Fragment, useCallback, useEffect } from 'react'
import { useApp, CATEGORY_TYPES, PRESET_CATEGORIES } from '../context/AppContext'
import { formatCurrency } from '../utils/format'

const currentMonth = '2025-02'

function formatMonthLabel(ym) {
  if (!ym) return ''
  const d = new Date(ym + '-01')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function formatMonthPossessive(ym) {
  if (!ym) return ''
  const d = new Date(ym + '-01')
  const monthName = d.toLocaleDateString('en-US', { month: 'long' })
  return monthName + "'s"
}

function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return d.toISOString().slice(0, 7)
}

function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m, 1)
  return d.toISOString().slice(0, 7)
}

const PLAN_FILTERS = [
  {
    id: 'all',
    label: 'All',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="8" height="7" rx="1.5" />
        <rect x="13" y="4" width="8" height="4" rx="1.5" />
        <rect x="13" y="10" width="8" height="7" rx="1.5" />
        <rect x="3" y="13" width="8" height="4" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'underfunded',
    label: 'Underfunded',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h16l-5 6v5l-6 3v-8z" />
      </svg>
    ),
  },
  {
    id: 'overfunded',
    label: 'Overfunded',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 17V5" />
        <path d="M5 14l3 3 3-3" />
        <path d="M16 7v12" />
        <path d="M13 10l3-3 3 3" />
      </svg>
    ),
  },
  {
    id: 'money_available',
    label: 'Money available',
    icon: (
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
]

function getCategoryById(id) {
  for (const list of Object.values(PRESET_CATEGORIES)) {
    const c = list.find((x) => x.id === id)
    if (c) return c
  }
  return null
}

export default function Plan() {
  const { state, dispatch } = useApp()
  const {
    monthlyIncome,
    categoryBudgets,
    transactions,
    planCategoryOrder,
    categoryTypeOverrides,
    snoozedCategoryIds,
  } = state
  const [detailCategory, setDetailCategory] = useState(null)
  const [expanded, setExpanded] = useState({ need: true, want: true, bills: true })
  const [planFilter, setPlanFilter] = useState('all')
  const [dragged, setDragged] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [detailPanelMonth, setDetailPanelMonth] = useState(currentMonth)

  useEffect(() => {
    if (detailCategory) {
      setDetailPanelMonth(currentMonth)
    }
  }, [detailCategory])

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

  const getCategoriesForType = useCallback(
    (typeId) => {
      const order = planCategoryOrder?.[typeId] || (PRESET_CATEGORIES[typeId] || []).map((c) => c.id)
      return order
        .map((id) => {
          const cat = getCategoryById(id)
          if (!cat) return null
          const resolvedType = categoryTypeOverrides[id] ?? cat.type
          if (resolvedType !== typeId) return null
          return cat
        })
        .filter(Boolean)
    },
    [planCategoryOrder, categoryTypeOverrides]
  )

  const totalActivityThisMonth = useMemo(
    () => Object.values(activityByCategory).reduce((sum, a) => sum + Math.abs(a || 0), 0),
    [activityByCategory]
  )
  const monthSummaryAvailable = monthlyIncome - totalActivityThisMonth

  const underfundedTotal = useMemo(() => {
    let total = 0
    CATEGORY_TYPES.forEach((type) => {
      getCategoriesForType(type.id).forEach((cat) => {
        const budget = categoryBudgets[cat.id] || 0
        const activity = activityByCategory[cat.id] || 0
        const avail = budget + activity
        if (avail < 0) total += Math.abs(avail)
      })
    })
    return total
  }, [getCategoriesForType, categoryBudgets, activityByCategory])

  const categoriesByFilter = useMemo(() => {
    const getAvail = (id) => getAvailable(id)
    const filterFn = (cat) => {
      const available = getAvail(cat.id)
      const budget = categoryBudgets[cat.id] || 0
      switch (planFilter) {
        case 'underfunded':
          return available < 0
        case 'overfunded':
          return budget > 0 && available > 0
        case 'money_available':
          return budget > 0 && available > 0
        default:
          return true
      }
    }
    const result = {}
    CATEGORY_TYPES.forEach((type) => {
      result[type.id] = getCategoriesForType(type.id).filter(filterFn)
    })
    return result
  }, [planFilter, getCategoriesForType, categoryBudgets])

  const handleDragStart = (e, cat, typeId, index) => {
    setDragged({ cat, typeId, index })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cat.id)
    e.dataTransfer.setData('application/json', JSON.stringify({ categoryId: cat.id, typeId, index }))
  }

  const handleDragOver = (e, typeId, categoryId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver({ typeId, categoryId })
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const handleDrop = (e, toTypeId, targetCategoryId) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragged) return
    const fromTypeId = dragged.typeId
    const categoryId = dragged.cat.id
    const fullList = getCategoriesForType(toTypeId)
    const toIndex = fullList.findIndex((c) => c.id === targetCategoryId)
    if (toIndex === -1) {
      setDragged(null)
      return
    }
    const fromList = getCategoriesForType(fromTypeId)
    const fromIndex = fromList.findIndex((c) => c.id === categoryId)
    if (fromTypeId === toTypeId && fromIndex === toIndex) {
      setDragged(null)
      return
    }
    dispatch({
      type: 'MOVE_PLAN_CATEGORY',
      payload: { categoryId, fromTypeId, toTypeId, toIndex },
    })
    setDragged(null)
  }

  const handleDragEnd = () => {
    setDragged(null)
    setDragOver(null)
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
    <div className="plan-page-wrap">
      <div className="plan-main">
        <h1 className="plan-title" style={{ margin: '0 0 0.75rem', fontSize: '1.35rem', fontWeight: 600 }}>Plan</h1>

        <div className="transactions-toolbar">
          <div className="transactions-toolbar-left">
            {PLAN_FILTERS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={planFilter === tab.id}
                className={`transactions-pill ${planFilter === tab.id ? 'active' : ''}`}
                onClick={() => setPlanFilter(tab.id)}
              >
                <span className="transactions-pill-icon" aria-hidden>
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card plan-table-card">
          <div className="table-wrap">
            <table className="plan-table plan-table-condensed">
              <thead>
                <tr>
                  <th aria-label="Select"></th>
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSection(type.id)
                        }
                      }}
                    >
                      <td colSpan={5}>
                        <span className="plan-group-chevron">{expanded[type.id] ? '▼' : '▶'}</span>
                        {type.label}
                      </td>
                    </tr>
                    {expanded[type.id] &&
                      categoriesByFilter[type.id].map((cat, index) => {
                        const activity = activityByCategory[cat.id] || 0
                        const budget = categoryBudgets[cat.id] || 0
                        const available = getAvailable(cat.id)
                        const spent = Math.abs(activity)
                        const pctSpent = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
                        const pctLeft = budget > 0 ? Math.max(0, 100 - pctSpent) : 0
                        const isDragOverHere =
                          dragOver?.typeId === type.id && dragOver?.categoryId === cat.id
                        const isDragging = dragged?.cat?.id === cat.id
                        return (
                          <Fragment key={cat.id}>
                            {isDragOverHere && (
                              <tr className="plan-drop-row" aria-hidden>
                                <td colSpan={5}>
                                  <div className="plan-drop-indicator">Drop here</div>
                                </td>
                              </tr>
                            )}
                            <tr
                              className={`plan-category-row ${isDragging ? 'plan-row-dragging' : ''}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, cat, type.id, index)}
                              onDragOver={(e) => handleDragOver(e, type.id, cat.id)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, type.id, cat.id)}
                              onDragEnd={handleDragEnd}
                            >
                              <td>
                                <button
                                  type="button"
                                  className="plan-check"
                                  onClick={() =>
                                    setDetailCategory(detailCategory?.id === cat.id ? null : cat)
                                  }
                                  title="View details"
                                  aria-pressed={detailCategory?.id === cat.id}
                                >
                                  {detailCategory?.id === cat.id ? '☑' : '☐'}
                                </button>
                              </td>
                              <td className="plan-cell-category">
                                <div className="plan-category-with-bar">
                                  <span className="plan-category-label plan-category-drag-handle">
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
                                <div className="plan-budget-input-wrap">
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
                                </div>
                              </td>
                              <td className="plan-cell-amount amount-spent">
                                {activity < 0
                                  ? formatCurrency(Math.abs(activity))
                                  : formatCurrency(0)}
                              </td>
                              <td
                                className={`plan-cell-amount ${available >= 0 ? 'amount-positive' : 'amount-negative'}`}
                              >
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

      <aside className="plan-sidebar">
        <div className={`plan-ready-to-assign ${remainingIncome >= 0 ? 'positive' : 'negative'}`}>
          <div className="plan-ready-to-assign-left">
            <span className="plan-ready-to-assign-amount">{formatCurrency(remainingIncome)}</span>
            <span className="plan-ready-to-assign-label">Ready to Assign</span>
          </div>
          <button type="button" className="plan-ready-to-assign-btn" aria-haspopup="listbox" aria-expanded="false">
            Assign
            <span className="plan-ready-to-assign-chevron" aria-hidden>▼</span>
          </button>
        </div>

        <div className="plan-detail-panel">
          {detailCategory && detailData ? (
            <>
          <button
            type="button"
            className="plan-detail-panel-close"
            onClick={() => setDetailCategory(null)}
            aria-label="Close"
          >
            ×
          </button>

          <div className="plan-detail-card plan-detail-card-available">
            <div className="plan-detail-card-header">
              <div className="plan-detail-card-title-row">
                <h3 className="plan-detail-card-title">Available Balance</h3>
                <span className="plan-detail-chevron" aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </span>
              </div>
              <div className={`plan-detail-available-pill ${detailData.availableBalance >= 0 ? 'positive' : 'negative'}`}>
                <span className="plan-detail-pill-icon">✓</span>
                <span className="plan-detail-pill-amount">{formatCurrency(detailData.availableBalance)}</span>
              </div>
            </div>
            <div className="plan-detail-card-rows">
              <div className="plan-detail-row">
                <span className="plan-detail-label">Cash Left Over From Last Month</span>
                <span className="plan-detail-value">{formatCurrency(detailData.cashLeftLastMonth ?? 0)}</span>
              </div>
              <div className="plan-detail-row">
                <span className="plan-detail-label">Assigned This Month</span>
                <span className="plan-detail-value amount-positive">+{formatCurrency(detailData.assignedThisMonth)}</span>
              </div>
              <div className="plan-detail-row">
                <span className="plan-detail-label">Cash Spending</span>
                <span className="plan-detail-value">{formatCurrency(detailData.spendingThisMonth)}</span>
              </div>
              <div className="plan-detail-row">
                <span className="plan-detail-label">Credit Spending</span>
                <span className="plan-detail-value">{formatCurrency(0)}</span>
              </div>
            </div>
          </div>

          <div className="plan-detail-card plan-detail-card-target">
            <div className="plan-detail-card-header plan-detail-target-header">
              <span className="plan-detail-target-check" aria-hidden>✓</span>
              <h3 className="plan-detail-card-title">Target</h3>
              <span className="plan-detail-chevron" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </span>
            </div>
            <p className="plan-detail-target-desc">Set Aside Another {formatCurrency(detailData.assignedThisMonth)} Each Month</p>
            <p className="plan-detail-target-by">By the 1st of the Month</p>
            <div className="plan-detail-divider" />
            {detailData.availableBalance >= 0 && detailData.assignedThisMonth > 0 ? (
              <>
                <div className="plan-detail-target-met">
                  <div className="plan-detail-target-met-circle">
                    <span className="plan-detail-target-met-check">✓</span>
                  </div>
                  <div className="plan-detail-target-met-banner">You've met your target!</div>
                </div>
              </>
            ) : null}
            <div className="plan-detail-card-rows">
              <div className="plan-detail-row">
                <span className="plan-detail-label">Amount to Assign This Month</span>
                <span className="plan-detail-value">{formatCurrency(detailData.assignedThisMonth)}</span>
              </div>
              <div className="plan-detail-row">
                <span className="plan-detail-label">Assigned So Far</span>
                <span className="plan-detail-value">{formatCurrency(detailData.assignedThisMonth)}</span>
              </div>
            </div>
            <div className="plan-detail-divider" />
            <div className="plan-detail-row">
              <span className="plan-detail-label">To Go</span>
              <span className="plan-detail-value">{formatCurrency(Math.max(0, detailData.assignedThisMonth - detailData.assignedThisMonth))}</span>
            </div>
            <button type="button" className="plan-detail-edit-target-btn" onClick={() => setDetailCategory(null)}>
              Edit Target
            </button>
          </div>
            </>
          ) : (
            <div className="plan-default-menu">
              <div className="plan-detail-card plan-default-summary-card">
                <div className="plan-default-card-header">
                  <h3 className="plan-detail-card-title">{formatMonthPossessive(currentMonth)} Summary</h3>
                  <span className="plan-detail-chevron" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </span>
                </div>
                <div className="plan-detail-card-rows">
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Left Over from Last Month</span>
                    <span className="plan-detail-value">{formatCurrency(0)}</span>
                  </div>
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Assigned in {formatMonthLabel(currentMonth)}</span>
                    <span className="plan-detail-value">{formatCurrency(totalBudgeted)}</span>
                  </div>
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Activity</span>
                    <span className="plan-detail-value">{formatCurrency(totalActivityThisMonth)}</span>
                  </div>
                  <div className="plan-detail-row">
                    <span className="plan-detail-label">Available</span>
                    <span className="plan-detail-value">{formatCurrency(monthSummaryAvailable)}</span>
                  </div>
                </div>
                <div className="plan-detail-divider" />
                <h4 className="plan-default-subheader">Cost to Be Me</h4>
                <div className="plan-detail-row">
                  <span className="plan-detail-label">{formatMonthPossessive(currentMonth)} Targets</span>
                  <span className="plan-detail-value">{formatCurrency(totalBudgeted)}</span>
                </div>
                <button type="button" className="plan-default-income-btn">Enter your expected income</button>
              </div>

              <div className="plan-detail-card plan-default-autoassign-card">
                <div className="plan-default-card-header">
                  <span className="plan-default-lightning" aria-hidden>⚡</span>
                  <h3 className="plan-detail-card-title">Auto-Assign</h3>
                  <span className="plan-detail-chevron" aria-hidden>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <path d="M7 10l5 5 5-5z" />
                    </svg>
                  </span>
                </div>
                <div className="plan-default-autoassign-list">
                  <button type="button" className="plan-default-autoassign-item">
                    <span className="plan-detail-label">Underfunded</span>
                    <span className="plan-detail-value">{formatCurrency(underfundedTotal)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item">
                    <span className="plan-detail-label">Assigned Last Month</span>
                    <span className="plan-detail-value">{formatCurrency(0)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item">
                    <span className="plan-detail-label">Spent Last Month</span>
                    <span className="plan-detail-value">{formatCurrency(0)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item">
                    <span className="plan-detail-label">Average Assigned</span>
                    <span className="plan-detail-value">{formatCurrency(0)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item">
                    <span className="plan-detail-label">Average Spent</span>
                    <span className="plan-detail-value">{formatCurrency(0)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item">
                    <span className="plan-detail-label">Reset Available Amounts</span>
                    <span className="plan-detail-value">{formatCurrency(0)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
