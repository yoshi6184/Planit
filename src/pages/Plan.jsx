import { useState, useMemo, Fragment, useCallback, useEffect, useRef } from 'react'
import { useApp, CATEGORY_TYPES, PRESET_CATEGORIES } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import PageHeaderRow from '../components/PageHeaderRow'
import { getAccountEmoji } from '../data/mockData'

const currentMonth = '2025-02'

function formatMonthLabel(ym) {
  if (!ym) return ''
  const d = new Date(ym + '-01')
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

/** Budget input value: no fixed decimals; only show decimals when the number has them */
function formatBudgetInputValue(val) {
  if (val == null || val === '') return ''
  const num = Number(val)
  if (Number.isNaN(num)) return ''
  return String(num)
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
]

export default function Plan() {
  const { state, dispatch } = useApp()
  const {
    monthlyIncome,
    categoryBudgets,
    transactions,
    accounts,
    creditPaymentBudgets,
    planCategoryOrder,
    categoryTypeOverrides,
    customPlanCategories,
    snoozedCategoryIds,
    categoryTargets,
  } = state
  const [detailCategory, setDetailCategory] = useState(null)
  const [expanded, setExpanded] = useState({ need: true, want: true, bills: true, credit: true, uncategorized: true })
  const [planFilter, setPlanFilter] = useState('all')
  const [dragged, setDragged] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [dragLocked, setDragLocked] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTab, setAssignTab] = useState('manual') // auto | manual
  const [assignAmount, setAssignAmount] = useState('')
  const [assignToCategoryId, setAssignToCategoryId] = useState('')
  const [assignAnchor, setAssignAnchor] = useState(null)
  const readyToAssignHeaderRef = useRef(null)
  const [detailPanelMonth, setDetailPanelMonth] = useState(currentMonth)
  const [groupHoverId, setGroupHoverId] = useState(null)
  const [newCategoryModal, setNewCategoryModal] = useState({ open: false, typeId: null })
  const [newCategoryName, setNewCategoryName] = useState('')
  const [targetEditorOpen, setTargetEditorOpen] = useState(false)
  const [targetTypeMenuOpen, setTargetTypeMenuOpen] = useState(false)
  const [targetDraft, setTargetDraft] = useState({
    cadence: 'monthly', // weekly | monthly | yearly | custom
    amount: '',
    dueOn: '1st', // monthly: day-of-month string; custom: date string
    repeat: true,
    everyCount: '1',
    everyUnit: 'Month',
    nextMonthMode: 'setAside', // setAside | refill
  })

  const getCategoryById = useCallback(
    (id) => {
      for (const list of Object.values(PRESET_CATEGORIES)) {
        const c = list.find((x) => x.id === id)
        if (c) return c
      }
      return (customPlanCategories || []).find((c) => c.id === id) || null
    },
    [customPlanCategories]
  )

  useEffect(() => {
    if (detailCategory) {
      setDetailPanelMonth(currentMonth)
    }
  }, [detailCategory])

  useEffect(() => {
    if (!dragLocked) return
    const onUp = () => setDragLocked(false)
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    window.addEventListener('dragend', onUp)
    return () => {
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
      window.removeEventListener('dragend', onUp)
    }
  }, [dragLocked])

  useEffect(() => {
    if (!assignOpen) return
    const onPointer = (e) => {
      if (e.target.closest('.plan-assign-popover') || e.target.closest('.plan-ready-to-assign-btn')) return
      setAssignOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [assignOpen])

  useEffect(() => {
    if (!detailCategory) {
      setTargetEditorOpen(false)
      setTargetTypeMenuOpen(false)
      return
    }
    const existing = (categoryTargets || {})[detailCategory.id]
    if (existing) {
      setTargetDraft({
        cadence: existing.cadence || 'monthly',
        amount: existing.amount != null ? String(existing.amount) : '',
        dueOn: existing.dueOn || '1st',
        repeat: existing.repeat !== false,
        everyCount: existing.everyCount != null ? String(existing.everyCount) : '1',
        everyUnit: existing.everyUnit || 'Month',
        nextMonthMode: existing.nextMonthMode || 'setAside',
      })
    } else {
      const fallbackAmount = categoryBudgets?.[detailCategory.id] ?? ''
      setTargetDraft({
        cadence: 'monthly',
        amount: fallbackAmount === '' ? '' : String(fallbackAmount),
        dueOn: 'Last Day of Month',
        repeat: true,
        everyCount: '1',
        everyUnit: 'Month',
        nextMonthMode: 'setAside',
      })
    }
  }, [detailCategory, categoryTargets, categoryBudgets])

  const handleTargetSave = () => {
    if (!detailCategory?.id) return
    const amt = parseFloat(targetDraft.amount)
    const num = Number.isFinite(amt) ? amt : 0
    const toMonthly = () => {
      if (targetDraft.cadence === 'weekly') return num * 4
      if (targetDraft.cadence === 'yearly') return num / 12
      if (targetDraft.cadence === 'custom') {
        const count = parseInt(targetDraft.everyCount, 10) || 1
        const unit = targetDraft.everyUnit || 'Month'
        if (unit === 'Week') return (num * 4) / count
        if (unit === 'Year') return (num / 12) / count
        return num / count // Month
      }
      return num // monthly
    }
    const monthlyBudget = Math.round(toMonthly() * 100) / 100
    dispatch({
      type: 'SET_CATEGORY_TARGET',
      payload: {
        categoryId: detailCategory.id,
        target: {
          cadence: targetDraft.cadence,
          amount: num,
          dueOn: targetDraft.dueOn,
          repeat: !!targetDraft.repeat,
          everyCount: parseInt(targetDraft.everyCount, 10) || 1,
          everyUnit: targetDraft.everyUnit,
          nextMonthMode: targetDraft.nextMonthMode,
        },
      },
    })
    dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { categoryId: detailCategory.id, amount: monthlyBudget } })
    setTargetEditorOpen(false)
    setTargetTypeMenuOpen(false)
  }

  const handleTargetDelete = () => {
    if (!detailCategory?.id) return
    dispatch({ type: 'REMOVE_CATEGORY_TARGET', payload: detailCategory.id })
    setTargetEditorOpen(false)
    setTargetTypeMenuOpen(false)
  }

  const toggleSection = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }
  const showMainGroups = planFilter === 'all' || planFilter === 'underfunded' || planFilter === 'overfunded'

  const handleIncomeChange = (e) => {
    const v = parseFloat(e.target.value) || 0
    dispatch({ type: 'SET_INCOME', payload: v })
  }

  const handleBudgetChange = (categoryId, value) => {
    const amount = parseFloat(value) || 0
    dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { categoryId, amount } })
  }
  const handleBudgetBlur = (categoryId, value) => {
    const num = parseFloat(value) || 0
    const rounded = Math.round(num * 100) / 100
    dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { categoryId, amount: rounded } })
  }
  const handleCreditPaymentBlur = (accountId, value) => {
    const num = parseFloat(value) || 0
    const rounded = Math.round(num * 100) / 100
    dispatch({ type: 'SET_CREDIT_PAYMENT_BUDGET', payload: { accountId, amount: rounded } })
  }

  const handleCreditPaymentChange = (accountId, value) => {
    const amount = parseFloat(value) || 0
    dispatch({ type: 'SET_CREDIT_PAYMENT_BUDGET', payload: { accountId, amount } })
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

  const totalBudgeted = useMemo(() => {
    const catTotal = Object.values(categoryBudgets).reduce((a, b) => a + b, 0)
    const creditTotal = Object.values(creditPaymentBudgets || {}).reduce((a, b) => a + b, 0)
    return catTotal + creditTotal
  }, [categoryBudgets, creditPaymentBudgets])
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
    [planCategoryOrder, categoryTypeOverrides, getCategoryById]
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

  const hash01 = (s) => {
    let h = 2166136261
    for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619
    return ((h >>> 0) % 1000) / 1000
  }

  const uncategorizedTransactions = useMemo(() => {
    return transactions.filter((t) => !t.categoryId && t.date)
  }, [transactions])

  const uncategorizedActivity = useMemo(() => {
    return transactions
      .filter((t) => !t.categoryId && t.date && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + (t.amount || 0), 0)
  }, [transactions])

  const creditCardRows = useMemo(() => {
    return (accounts || [])
      .filter((a) => a.type === 'credit')
      .map((acc) => {
        const activity = transactions
          .filter((t) => t.accountId === acc.id && t.date.startsWith(currentMonth))
          .reduce((s, t) => s + (t.amount || 0), 0)
        const balance = acc.balance ?? 0
        return { id: acc.id, name: acc.name, balance, activity }
      })
  }, [accounts, transactions])

  const creditCardGroupTotal = useMemo(() => {
    const assigned = creditCardRows.reduce((s, r) => s + (creditPaymentBudgets[r.id] || 0), 0)
    const activity = creditCardRows.reduce((s, r) => s + r.activity, 0)
    const available = creditCardRows.reduce(
      (s, r) => s + ((creditPaymentBudgets[r.id] || 0) + r.activity),
      0
    )
    return { assigned, activity, available }
  }, [creditCardRows, creditPaymentBudgets])

  const creditUnderfundedTotal = useMemo(() => {
    return creditCardRows.reduce((sum, row) => {
      const avail = (creditPaymentBudgets?.[row.id] || 0) + (row.activity || 0)
      if (avail < 0) return sum + Math.abs(avail)
      return sum
    }, 0)
  }, [creditCardRows, creditPaymentBudgets])

  const underfundedTotalWithCredit = useMemo(() => {
    return Math.round((underfundedTotal + creditUnderfundedTotal) * 100) / 100
  }, [underfundedTotal, creditUnderfundedTotal])

  const lastMonthAssignedTotal = useMemo(() => {
    const catTotal = Object.entries(categoryBudgets || {}).reduce((sum, [id, v]) => {
      const r = hash01(`lm:${id}`)
      const scaled = Math.max(0, Number(v || 0) * (0.75 + r * 0.5))
      return sum + Math.round(scaled * 100) / 100
    }, 0)
    const creditTotal = Object.entries(creditPaymentBudgets || {}).reduce((sum, [id, v]) => {
      const r = hash01(`lm:credit:${id}`)
      const scaled = Math.max(0, Number(v || 0) * (0.75 + r * 0.5))
      return sum + Math.round(scaled * 100) / 100
    }, 0)
    return Math.round((catTotal + creditTotal) * 100) / 100
  }, [categoryBudgets, creditPaymentBudgets])

  const lastMonthSpentTotal = useMemo(() => {
    const v = (totalActivityThisMonth || 0) * 0.92
    return Math.round(v * 100) / 100
  }, [totalActivityThisMonth])

  const avgAssignedMock = useMemo(() => Math.round((lastMonthAssignedTotal / 3) * 100) / 100, [lastMonthAssignedTotal])
  const avgSpentMock = useMemo(() => Math.round((lastMonthSpentTotal / 3) * 100) / 100, [lastMonthSpentTotal])

  const getCreditAvailable = useCallback(
    (accountId) => {
      const assigned = creditPaymentBudgets?.[accountId] || 0
      const row = creditCardRows.find((r) => r.id === accountId)
      const activity = row?.activity || 0
      return assigned + activity
    },
    [creditPaymentBudgets, creditCardRows]
  )

  const groupTotals = useMemo(() => {
    const out = {}
    CATEGORY_TYPES.forEach((type) => {
      const cats = getCategoriesForType(type.id)
      let assigned = 0
      let activity = 0
      cats.forEach((cat) => {
        assigned += categoryBudgets[cat.id] || 0
        activity += activityByCategory[cat.id] || 0
      })
      out[type.id] = { assigned, activity, available: assigned + activity }
    })
    return out
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
    if (dragLocked || e.target.closest('input') || e.target.closest('.plan-budget-input-wrap') || e.target.closest('.plan-cell-budget')) {
      e.preventDefault()
      return
    }
    setDragged({ cat, typeId, index })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cat.id)
    e.dataTransfer.setData('application/json', JSON.stringify({ categoryId: cat.id, typeId, index }))
  }

  const handleDragOver = (e, typeId, rowIndex, totalCount) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const rect = e.currentTarget.getBoundingClientRect()
    const isTopHalf = e.clientY < rect.top + rect.height / 2
    const insertIndex = isTopHalf ? rowIndex : Math.min(rowIndex + 1, totalCount)
    setDragOver({ typeId, insertIndex })
  }

  const handleDragLeave = () => {
    setDragOver(null)
  }

  const handleDrop = (e, toTypeId, toIndex) => {
    e.preventDefault()
    setDragOver(null)
    if (!dragged) return
    const fromTypeId = dragged.typeId
    const categoryId = dragged.cat.id
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

  const handleNewCategoryOk = () => {
    if (!newCategoryModal.typeId) return
    dispatch({
      type: 'ADD_PLAN_CATEGORY',
      payload: { typeId: newCategoryModal.typeId, name: newCategoryName.trim() || 'New Category' },
    })
    setNewCategoryModal({ open: false, typeId: null })
    setNewCategoryName('')
  }

  const handleNewCategoryCancel = () => {
    setNewCategoryModal({ open: false, typeId: null })
    setNewCategoryName('')
  }

  const detailData = useMemo(() => {
    if (!detailCategory) return null
    if (detailCategory.id === 'uncategorized') {
      const budget = 0
      const activity = uncategorizedActivity || 0
      const available = budget + activity
      return {
        availableBalance: available,
        cashLeftLastMonth: null,
        assignedThisMonth: budget,
        spendingThisMonth: Math.abs(activity),
      }
    }
    const budget = categoryBudgets[detailCategory.id] || 0
    const activity = activityByCategory[detailCategory.id] || 0
    const available = budget + activity
    return {
      availableBalance: available,
      cashLeftLastMonth: null,
      assignedThisMonth: budget,
      spendingThisMonth: Math.abs(activity),
    }
  }, [detailCategory, categoryBudgets, activityByCategory, uncategorizedActivity])

  const parseMoneyInput = (v) => {
    const cleaned = String(v ?? '').replace(/[^0-9.-]/g, '')
    const n = parseFloat(cleaned)
    return Number.isFinite(n) ? n : NaN
  }

  const getFirstCategoryId = () => {
    for (const type of CATEGORY_TYPES) {
      const cats = getCategoriesForType(type.id)
      if (cats && cats.length) return cats[0].id
    }
    return ''
  }

  const CREDIT_TO_PREFIX = 'credit:'

  const getFirstAssignableId = () => {
    const firstCategory = getFirstCategoryId()
    if (firstCategory) return firstCategory
    if (creditCardRows && creditCardRows.length) return `${CREDIT_TO_PREFIX}${creditCardRows[0].id}`
    return ''
  }

  const applyAssignTo = (toId, amt) => {
    if (!toId) return
    if (!Number.isFinite(amt) || amt <= 0) return

    if (String(toId).startsWith(CREDIT_TO_PREFIX)) {
      const accountId = String(toId).slice(CREDIT_TO_PREFIX.length)
      const current = creditPaymentBudgets?.[accountId] || 0
      const next = Math.round((current + amt) * 100) / 100
      dispatch({ type: 'SET_CREDIT_PAYMENT_BUDGET', payload: { accountId, amount: next } })
      return
    }

    const current = categoryBudgets?.[toId] || 0
    const next = Math.round((current + amt) * 100) / 100
    dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { categoryId: toId, amount: next } })
  }

  const autoAssignUnderfunded = () => {
    let remaining = Math.max(0, remainingIncome || 0)
    if (!remaining) return

    CATEGORY_TYPES.forEach((type) => {
      getCategoriesForType(type.id).forEach((cat) => {
        const avail = getAvailable(cat.id)
        if (avail < 0 && remaining > 0) {
          const need = Math.min(remaining, Math.abs(avail))
          applyAssignTo(cat.id, need)
          remaining = Math.round((remaining - need) * 100) / 100
        }
      })
    })

    ;(creditCardRows || []).forEach((row) => {
      const avail = getCreditAvailable(row.id)
      if (avail < 0 && remaining > 0) {
        const need = Math.min(remaining, Math.abs(avail))
        applyAssignTo(`${CREDIT_TO_PREFIX}${row.id}`, need)
        remaining = Math.round((remaining - need) * 100) / 100
      }
    })
  }

  const autoAssignLastMonth = () => {
    // Mock last-month budgets: set (overwrite) this month to those values.
    Object.keys(categoryBudgets || {}).forEach((id) => {
      const current = categoryBudgets?.[id] || 0
      const lm = Math.round(Math.max(0, current * (0.75 + hash01(`lm:${id}`) * 0.5)) * 100) / 100
      dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { categoryId: id, amount: lm } })
    })
    Object.keys(creditPaymentBudgets || {}).forEach((id) => {
      const current = creditPaymentBudgets?.[id] || 0
      const lm = Math.round(Math.max(0, current * (0.75 + hash01(`lm:credit:${id}`) * 0.5)) * 100) / 100
      dispatch({ type: 'SET_CREDIT_PAYMENT_BUDGET', payload: { accountId: id, amount: lm } })
    })
  }

  const resetAllBudgets = () => {
    Object.keys(categoryBudgets || {}).forEach((id) => {
      dispatch({ type: 'SET_CATEGORY_BUDGET', payload: { categoryId: id, amount: 0 } })
    })
    Object.keys(creditPaymentBudgets || {}).forEach((id) => {
      dispatch({ type: 'SET_CREDIT_PAYMENT_BUDGET', payload: { accountId: id, amount: 0 } })
    })
  }

  const openAssign = (anchorEl) => {
    if (!anchorEl) return
    const rect = anchorEl.getBoundingClientRect()
    const containerRect = readyToAssignHeaderRef.current?.getBoundingClientRect()
    if (containerRect) {
      setAssignAnchor({
        top: rect.bottom - containerRect.top + 10,
        left: rect.left - containerRect.left + rect.width / 2,
      })
    } else {
      setAssignAnchor({ top: rect.bottom + 10, left: rect.left + rect.width / 2 })
    }
    setAssignTab('manual')
    setAssignAmount(String(Math.max(0, Math.round((remainingIncome || 0) * 100) / 100)))
    setAssignToCategoryId((prev) => prev || getFirstAssignableId())
    setAssignOpen(true)
  }

  const readyToAssignHeaderBlock = (
    <div
      className={`plan-ready-to-assign plan-ready-to-assign-top-middle ${remainingIncome >= 0 ? 'positive' : 'negative'}`}
      role="presentation"
      ref={readyToAssignHeaderRef}
    >
      <div className="plan-ready-to-assign-left">
        <span className="plan-ready-to-assign-amount">{formatCurrency(remainingIncome)}</span>
        <span className="plan-ready-to-assign-label">Ready to Assign</span>
      </div>
      <button
        type="button"
        className="plan-ready-to-assign-btn"
        aria-haspopup="dialog"
        aria-expanded={assignOpen ? 'true' : 'false'}
        onClick={(e) => {
          e.stopPropagation()
          if (assignOpen) {
            setAssignOpen(false)
            return
          }
          openAssign(e.currentTarget)
        }}
      >
        Assign
        <span className="plan-ready-to-assign-chevron" aria-hidden>▼</span>
      </button>
      {assignOpen && assignAnchor && (
        <div
          className="plan-assign-popover"
          style={{ top: assignAnchor.top, left: assignAnchor.left }}
          role="dialog"
          aria-label="Assign Ready to Assign"
        >
          <div className="plan-assign-tabs" role="tablist" aria-label="Assign mode">
            <button
              type="button"
              role="tab"
              aria-selected={assignTab === 'auto'}
              className={`plan-assign-tab ${assignTab === 'auto' ? 'active' : ''}`}
              onClick={() => setAssignTab('auto')}
            >
              <span className="plan-assign-tab-icon" aria-hidden>⚡</span>
              Auto
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={assignTab === 'manual'}
              className={`plan-assign-tab ${assignTab === 'manual' ? 'active' : ''}`}
              onClick={() => setAssignTab('manual')}
            >
              Manually
            </button>
          </div>

          {assignTab === 'manual' ? (
            <>
              <div className="plan-assign-field">
                <label className="plan-assign-label">Assign:</label>
                <input
                  className="plan-assign-input"
                  type="text"
                  inputMode="decimal"
                  value={assignAmount}
                  onChange={(e) => setAssignAmount(e.target.value)}
                />
              </div>
              <div className="plan-assign-field">
                <label className="plan-assign-label">To:</label>
                <div className="plan-assign-select-wrap">
                  <select
                    className="plan-assign-select"
                    value={assignToCategoryId}
                    onChange={(e) => setAssignToCategoryId(e.target.value)}
                  >
                    <option value="" disabled>Select category</option>
                    {creditCardRows?.length ? (
                      <optgroup label="Credit Card Payments">
                        {creditCardRows.map((row) => {
                          const assigned = creditPaymentBudgets?.[row.id] || 0
                          return (
                            <option key={row.id} value={`${CREDIT_TO_PREFIX}${row.id}`}>
                              {getAccountEmoji('credit')} {row.name} — {formatCurrency(assigned)}
                            </option>
                          )
                        })}
                      </optgroup>
                    ) : null}
                    {CATEGORY_TYPES.map((type) => (
                      <optgroup key={type.id} label={type.label}>
                        {getCategoriesForType(type.id).map((cat) => {
                          const budget = categoryBudgets?.[cat.id] || 0
                          return (
                            <option key={cat.id} value={cat.id}>
                              {cat.emoji ? `${cat.emoji} ` : ''}{cat.name} — {formatCurrency(budget)}
                            </option>
                          )
                        })}
                      </optgroup>
                    ))}
                  </select>
                  <span className="plan-assign-select-arrow" aria-hidden>▼</span>
                </div>
              </div>
              <div className="plan-assign-actions">
                <button type="button" className="plan-assign-cancel" onClick={() => setAssignOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="plan-assign-confirm"
                  onClick={() => {
                    const amt = parseMoneyInput(assignAmount)
                    const toId = assignToCategoryId || getFirstAssignableId()
                    if (!toId) return
                    if (!Number.isFinite(amt) || amt <= 0) return
                    applyAssignTo(toId, amt)
                    setAssignOpen(false)
                  }}
                >
                  Assign
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="plan-assign-auto-placeholder">
                Auto will cover underfunded categories first.
              </div>
              <div className="plan-assign-actions">
                <button type="button" className="plan-assign-cancel" onClick={() => setAssignOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="plan-assign-confirm"
                  onClick={() => {
                    let remaining = Math.max(0, remainingIncome || 0)
                    if (!remaining) return
                    CATEGORY_TYPES.forEach((type) => {
                      getCategoriesForType(type.id).forEach((cat) => {
                        const avail = getAvailable(cat.id)
                        if (avail < 0 && remaining > 0) {
                          const need = Math.min(remaining, Math.abs(avail))
                          applyAssignTo(cat.id, need)
                          remaining = Math.round((remaining - need) * 100) / 100
                        }
                      })
                    })
                    ;(creditCardRows || []).forEach((row) => {
                      const avail = getCreditAvailable(row.id)
                      if (avail < 0 && remaining > 0) {
                        const need = Math.min(remaining, Math.abs(avail))
                        applyAssignTo(`${CREDIT_TO_PREFIX}${row.id}`, need)
                        remaining = Math.round((remaining - need) * 100) / 100
                      }
                    })
                    setAssignOpen(false)
                  }}
                >
                  Assign
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )

  const planHeaderLeft = (
    <h1 className="plan-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600 }}>Plan</h1>
  )

  const planFiltersRow = (
    <div className="plan-filters-under-title">
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
  )

  return (
    <div className="plan-page-wrap plan-page-wrap-column">
      <PageHeaderRow
        left={planHeaderLeft}
        center={readyToAssignHeaderBlock}
      />
      {planFiltersRow}

      <div className="plan-page-body">
        <div className="plan-main">
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
                <tr className="plan-category-row">
                  <td>
                    <button
                      type="button"
                      className="plan-check"
                      title="Uncategorized"
                      onClick={() =>
                        setDetailCategory(
                          detailCategory?.id === 'uncategorized'
                            ? null
                            : { id: 'uncategorized', name: 'Uncategorized Transactions', emoji: '📋' }
                        )
                      }
                      aria-pressed={detailCategory?.id === 'uncategorized'}
                    >
                      {detailCategory?.id === 'uncategorized' ? '☑' : '☐'}
                    </button>
                  </td>
                  <td className="plan-cell-category">
                    <span className="plan-category-label">
                      <span className="plan-category-emoji" aria-hidden>📋</span>
                      Uncategorized Transactions
                    </span>
                  </td>
                  <td className="plan-cell-budget">—</td>
                  <td className="plan-cell-amount amount-spent">
                    {uncategorizedActivity !== 0 ? formatCurrency(Math.abs(uncategorizedActivity)) : '—'}
                  </td>
                  <td className={`plan-cell-amount plan-cell-available ${uncategorizedActivity >= 0 ? 'amount-positive' : 'amount-available-negative'}`}>
                    {formatCurrency(uncategorizedActivity)}
                  </td>
                </tr>
                <Fragment>
                    <tr
                      className="plan-group-row plan-group-row-credit"
                      onClick={() => toggleSection('credit')}
                      onMouseEnter={() => setGroupHoverId('credit')}
                      onMouseLeave={() => setGroupHoverId(null)}
                      role="button"
                      tabIndex={0}
                    >
                      <td></td>
                      <td colSpan={4}>
                        <span className="plan-group-chevron">{expanded['credit'] ? '▼' : '▶'}</span>
                        Credit Card Payments
                      </td>
                    </tr>
                    {expanded['credit'] &&
                      creditCardRows.map((row) => {
                        const assigned = creditPaymentBudgets[row.id] || 0
                        const available = assigned + row.activity
                        return (
                          <tr key={row.id} className="plan-category-row">
                            <td>
                              <button
                                type="button"
                                className="plan-check"
                                onClick={() => setDetailCategory(detailCategory?.id === row.id ? null : { id: row.id, name: row.name, emoji: getAccountEmoji('credit') })}
                                title="View details"
                                aria-pressed={detailCategory?.id === row.id}
                              >
                                {detailCategory?.id === row.id ? '☑' : '☐'}
                              </button>
                            </td>
                            <td className="plan-cell-category">
                              <span className="plan-category-label plan-category-drag-handle">
                                <span className="plan-category-emoji">{getAccountEmoji('credit')}</span>
                                {row.name}
                              </span>
                            </td>
                            <td className="plan-cell-budget">
                              <div
                                className="plan-budget-input-wrap"
                                onClick={(e) => e.stopPropagation()}
                                onMouseDown={(e) => { e.stopPropagation(); setDragLocked(true) }}
                                onDragStart={(e) => { e.preventDefault(); e.stopPropagation() }}
                              >
                                <span className="plan-budget-display" aria-hidden draggable={false}>
                                  {formatCurrency(creditPaymentBudgets[row.id] ?? 0)}
                                </span>
                                <input
                                  type="number"
                                  value={formatBudgetInputValue(creditPaymentBudgets[row.id])}
                                  onChange={(e) => handleCreditPaymentChange(row.id, e.target.value)}
                                  onFocus={() => {
                                    setDragLocked(true)
                                    if (detailCategory?.id !== row.id) {
                                      setDetailCategory({ id: row.id, name: row.name, emoji: getAccountEmoji('credit') })
                                    }
                                  }}
                                  onBlur={(e) => { setDragLocked(false); handleCreditPaymentBlur(row.id, e.target.value) }}
                                  min="0"
                                  step="0.01"
                                  placeholder="0"
                                  className="plan-budget-input"
                                  draggable={false}
                                  style={{
                                    width: `${Math.max(6, formatBudgetInputValue(creditPaymentBudgets[row.id]).length + 1)}ch`
                                  }}
                                />
                              </div>
                            </td>
                            <td className="plan-cell-amount amount-spent">
                              {row.activity !== 0 ? formatCurrency(Math.abs(row.activity)) : '—'}
                            </td>
                            <td className={`plan-cell-amount ${available >= 0 ? 'amount-positive' : 'amount-available-negative'}`}>
                              {formatCurrency(available)}
                            </td>
                          </tr>
                        )
                      })}
                </Fragment>
                {showMainGroups && CATEGORY_TYPES.map((type) => (
                  <Fragment key={type.id}>
                    <tr
                      className="plan-group-row"
                      onClick={() => toggleSection(type.id)}
                      onMouseEnter={() => setGroupHoverId(type.id)}
                      onMouseLeave={() => setGroupHoverId(null)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleSection(type.id)
                        }
                      }}
                    >
                      <td></td>
                      <td colSpan={4}>
                        <span className="plan-group-chevron">{expanded[type.id] ? '▼' : '▶'}</span>
                        {type.label}
                        {groupHoverId === type.id && (
                          <button
                            type="button"
                            className="plan-group-add-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              const rect = e.currentTarget.getBoundingClientRect()
                              setNewCategoryModal({
                                open: true,
                                typeId: type.id,
                                anchorRect: { top: rect.bottom, left: rect.left, width: rect.width },
                              })
                              setNewCategoryName('')
                            }}
                            aria-label="Add category"
                          >
                            +
                          </button>
                        )}
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
                        const isDragging = dragged?.cat?.id === cat.id
                        const cats = categoriesByFilter[type.id]
                        const showDropAbove = dragOver?.typeId === type.id && dragOver?.insertIndex === index
                        const showDropBelow = dragOver?.typeId === type.id && dragOver?.insertIndex === cats.length && index === cats.length - 1
                        return (
                          <tr
                            key={cat.id}
                            className={`plan-category-row ${isDragging ? 'plan-row-dragging' : ''} ${showDropAbove ? 'plan-drop-above' : ''} ${showDropBelow ? 'plan-drop-below' : ''}`}
                            draggable={!dragLocked}
                            onDragStart={(e) => handleDragStart(e, cat, type.id, index)}
                            onDragOver={(e) => handleDragOver(e, type.id, index, cats.length)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, type.id, (dragOver?.typeId === type.id && dragOver != null) ? dragOver.insertIndex : index)}
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
                                <div
                                  className="plan-budget-input-wrap"
                                  onMouseDown={(e) => { e.stopPropagation(); setDragLocked(true) }}
                                  onDragStart={(e) => { e.preventDefault(); e.stopPropagation() }}
                                >
                                  <span className="plan-budget-display" aria-hidden draggable={false}>
                                    {formatCurrency(categoryBudgets[cat.id] ?? 0)}
                                  </span>
                                  <input
                                    type="number"
                                    value={formatBudgetInputValue(categoryBudgets[cat.id])}
                                    onChange={(e) => handleBudgetChange(cat.id, e.target.value)}
                                    onFocus={() => {
                                      setDragLocked(true)
                                      if (detailCategory?.id !== cat.id) setDetailCategory(cat)
                                    }}
                                    onBlur={(e) => { setDragLocked(false); handleBudgetBlur(cat.id, e.target.value) }}
                                    min="0"
                                    step="0.01"
                                    placeholder="0"
                                    className="plan-budget-input"
                                    draggable={false}
                                    style={{
                                      width: `${Math.max(6, formatBudgetInputValue(categoryBudgets[cat.id]).length + 1)}ch`
                                    }}
                                  />
                                </div>
                              </td>
                              <td className="plan-cell-amount amount-spent">
                                {activity < 0
                                  ? formatCurrency(Math.abs(activity))
                                  : formatCurrency(0)}
                              </td>
                              <td className={`plan-cell-amount ${available >= 0 ? 'amount-positive' : 'amount-available-negative'}`}>
                                {formatCurrency(available)}
                              </td>
                            </tr>
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
            {targetEditorOpen ? (
            <div className="plan-target-editor-card">
              <div className="plan-target-editor-header">
                <span className="plan-target-editor-check" aria-hidden>✓</span>
                <h3 className="plan-target-editor-title">Target</h3>
              </div>

              <div className="plan-target-editor-tabs" role="tablist" aria-label="Target cadence">
                {[
                  { id: 'weekly', label: 'Weekly' },
                  { id: 'monthly', label: 'Monthly' },
                  { id: 'yearly', label: 'Yearly' },
                  { id: 'custom', label: 'Custom' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={targetDraft.cadence === t.id}
                    className={`plan-target-editor-tab ${targetDraft.cadence === t.id ? 'active' : ''}`}
                    onClick={() => setTargetDraft((p) => ({ ...p, cadence: t.id }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="plan-target-editor-field">
                <label className="plan-target-editor-label">Amount</label>
                <div className="plan-target-editor-input-wrap">
                  <span className="plan-target-editor-currency" aria-hidden>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="plan-target-editor-input"
                    value={targetDraft.amount}
                    onChange={(e) => setTargetDraft((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {targetDraft.cadence === 'weekly' && (
                <div className="plan-target-editor-field">
                  <label className="plan-target-editor-label">Every</label>
                  <div className="plan-target-editor-select-wrap">
                    <select
                      className="plan-target-editor-select"
                      value={targetDraft.dueOn}
                      onChange={(e) => setTargetDraft((p) => ({ ...p, dueOn: e.target.value }))}
                      aria-label="Every day"
                    >
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <span className="plan-target-editor-select-arrow" aria-hidden>▼</span>
                  </div>
                </div>
              )}

              {targetDraft.cadence === 'monthly' && (
              <div className="plan-target-editor-field">
                <label className="plan-target-editor-label">By</label>
                <div className="plan-target-editor-select-wrap">
                  <select
                    className="plan-target-editor-select"
                    value={targetDraft.dueOn}
                    onChange={(e) => setTargetDraft((p) => ({ ...p, dueOn: e.target.value }))}
                    aria-label="By day"
                  >
                    <option value="Last Day of Month">Last Day of Month</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                      const suffix =
                        d % 10 === 1 && d !== 11 ? 'st'
                          : d % 10 === 2 && d !== 12 ? 'nd'
                            : d % 10 === 3 && d !== 13 ? 'rd'
                              : 'th'
                      const label = `${d}${suffix}`
                      return <option key={label} value={label}>{label}</option>
                    })}
                  </select>
                  <span className="plan-target-editor-select-arrow" aria-hidden>▼</span>
                </div>
              </div>
              )}

              {(targetDraft.cadence === 'custom' || targetDraft.cadence === 'yearly') && (
              <div className="plan-target-editor-field">
                <label className="plan-target-editor-label">By</label>
                <input
                  type="date"
                  className="plan-target-editor-date"
                  value={targetDraft.dueOn && targetDraft.dueOn.includes('-') ? targetDraft.dueOn : new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setTargetDraft((p) => ({ ...p, dueOn: e.target.value }))}
                  aria-label="By date"
                />
              </div>
              )}

              <div className="plan-target-editor-field" style={{ position: 'relative' }}>
                <label className="plan-target-editor-label">
                  {targetDraft.cadence === 'weekly'
                    ? 'Next week I want to'
                    : targetDraft.cadence === 'yearly'
                      ? 'Next year I want to'
                      : 'Next month I want to'}
                </label>
                <button
                  type="button"
                  className={`plan-target-editor-dropdown ${targetTypeMenuOpen ? 'open' : ''}`}
                  onClick={() => setTargetTypeMenuOpen((v) => !v)}
                >
                  {(() => {
                    const amt = formatCurrency(parseFloat(targetDraft.amount) || 0)
                    const suffix = ''
                    return targetDraft.nextMonthMode === 'setAside'
                      ? `Set aside another ${amt}${suffix}`
                      : `Refill up to ${amt}${suffix}`
                  })()}
                  <span className="plan-target-editor-select-arrow" aria-hidden>▼</span>
                </button>

                {targetTypeMenuOpen && (
                  <div className="plan-target-type-menu" role="menu">
                    <button
                      type="button"
                      className={`plan-target-type-item ${targetDraft.nextMonthMode === 'setAside' ? 'active' : ''}`}
                      onClick={() => {
                        setTargetDraft((p) => ({ ...p, nextMonthMode: 'setAside' }))
                        setTargetTypeMenuOpen(false)
                      }}
                    >
                      <div className="plan-target-type-item-top">
                        <span className="plan-target-type-check" aria-hidden>✓</span>
                        <span className="plan-target-type-title">
                          Set aside another {formatCurrency(parseFloat(targetDraft.amount) || 0)}
                        </span>
                      </div>
                      <div className="plan-target-type-desc">Use for: bills, subscriptions, saving over time</div>
                      <div className="plan-target-type-pill">Most people choose this</div>
                    </button>

                    <div className="plan-target-type-sep" aria-hidden />

                    <button
                      type="button"
                      className={`plan-target-type-item ${targetDraft.nextMonthMode === 'refill' ? 'active' : ''}`}
                      onClick={() => {
                        setTargetDraft((p) => ({ ...p, nextMonthMode: 'refill' }))
                        setTargetTypeMenuOpen(false)
                      }}
                    >
                      <div className="plan-target-type-title-2">
                        Refill up to {formatCurrency(parseFloat(targetDraft.amount) || 0)}
                      </div>
                      <div className="plan-target-type-desc">Use for: gasoline, fun money, dining out</div>
                      <div className="plan-target-type-long">
                        Sets a Target to have {formatCurrency(parseFloat(targetDraft.amount) || 0)} on hand each month.
                        Whatever you don&apos;t spend will get applied toward next month&apos;s {formatCurrency(parseFloat(targetDraft.amount) || 0)}.
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {targetDraft.cadence === 'custom' && (
              <div className="plan-target-editor-repeat">
                <button
                  type="button"
                  className={`plan-target-editor-toggle ${targetDraft.repeat ? 'on' : ''}`}
                  onClick={() => setTargetDraft((p) => ({ ...p, repeat: !p.repeat }))}
                  aria-pressed={targetDraft.repeat}
                >
                  <span className="plan-target-editor-toggle-knob" aria-hidden />
                </button>
                <span className="plan-target-editor-repeat-label">Repeat</span>
              </div>
              )}

              {targetDraft.cadence === 'custom' && (
              <div className="plan-target-editor-field">
                <label className="plan-target-editor-label">Every</label>
                <div className="plan-target-editor-every">
                  <div className="plan-target-editor-select-wrap">
                    <select
                      className="plan-target-editor-select"
                      value={targetDraft.everyCount}
                      onChange={(e) => setTargetDraft((p) => ({ ...p, everyCount: e.target.value }))}
                      aria-label="Every count"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <span className="plan-target-editor-select-arrow" aria-hidden>▼</span>
                  </div>
                  <div className="plan-target-editor-select-wrap">
                    <select
                      className="plan-target-editor-select"
                      value={targetDraft.everyUnit}
                      onChange={(e) => setTargetDraft((p) => ({ ...p, everyUnit: e.target.value }))}
                      aria-label="Every unit"
                    >
                      {['Week', 'Month', 'Year'].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                    <span className="plan-target-editor-select-arrow" aria-hidden>▼</span>
                  </div>
                </div>
              </div>
              )}

              <div className="plan-target-editor-actions">
                <button type="button" className="plan-target-editor-delete" onClick={handleTargetDelete}>
                  🗑 Delete
                </button>
                <div className="plan-target-editor-actions-right">
                  <button type="button" className="plan-target-editor-cancel" onClick={() => setTargetEditorOpen(false)}>
                    Cancel
                  </button>
                  <button type="button" className="plan-target-editor-save" onClick={handleTargetSave}>
                    Save Target
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="plan-detail-card-header plan-detail-target-header">
                <span className="plan-detail-target-check" aria-hidden>✓</span>
                <h3 className="plan-detail-card-title">Target</h3>
                <span className="plan-detail-chevron" aria-hidden>
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </span>
              </div>
              <p className="plan-detail-target-desc">
                Set Aside Another {formatCurrency(detailData.assignedThisMonth)} Each Month
              </p>
              <p className="plan-detail-target-by">By the 1st of the Month</p>
              <div className="plan-detail-divider" />
              {detailData.availableBalance >= 0 && detailData.assignedThisMonth > 0 ? (
                <div className="plan-detail-target-met">
                  <div className="plan-detail-target-met-circle">
                    <span className="plan-detail-target-met-check">✓</span>
                  </div>
                  <div className="plan-detail-target-met-banner">You've met your target!</div>
                </div>
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
                <span className="plan-detail-value">
                  {formatCurrency(Math.max(0, detailData.assignedThisMonth - detailData.assignedThisMonth))}
                </span>
              </div>
              <button
                type="button"
                className="plan-detail-edit-target-btn"
                onClick={() => {
                  setTargetDraft((p) => ({
                    ...p,
                    cadence: 'weekly',
                    dueOn: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].includes(p.dueOn) ? p.dueOn : 'Saturday',
                  }))
                  setTargetEditorOpen(true)
                }}
              >
                Edit Target
              </button>
            </>
          )}
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
                  <button type="button" className="plan-default-autoassign-item" onClick={autoAssignUnderfunded}>
                    <span className="plan-detail-label">Underfunded</span>
                    <span className="plan-detail-value">{formatCurrency(underfundedTotalWithCredit)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item" onClick={autoAssignLastMonth}>
                    <span className="plan-detail-label">Assigned Last Month</span>
                    <span className="plan-detail-value">{formatCurrency(lastMonthAssignedTotal)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item" disabled>
                    <span className="plan-detail-label">Spent Last Month</span>
                    <span className="plan-detail-value">{formatCurrency(lastMonthSpentTotal)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item" disabled>
                    <span className="plan-detail-label">Average Assigned</span>
                    <span className="plan-detail-value">{formatCurrency(avgAssignedMock)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item" disabled>
                    <span className="plan-detail-label">Average Spent</span>
                    <span className="plan-detail-value">{formatCurrency(avgSpentMock)}</span>
                  </button>
                  <button type="button" className="plan-default-autoassign-item" onClick={resetAllBudgets}>
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

      {newCategoryModal.open && newCategoryModal.anchorRect && (
        <>
          <div
            className="plan-new-category-backdrop"
            onClick={handleNewCategoryCancel}
            role="presentation"
            aria-hidden
          />
          <div
            className="plan-new-category-modal"
            style={{
              top: newCategoryModal.anchorRect.top + 4,
              left: newCategoryModal.anchorRect.left,
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="plan-new-category-title"
            aria-modal="true"
          >
            <div
              className="plan-new-category-modal-pointer"
              style={{ left: newCategoryModal.anchorRect.width / 2 }}
              aria-hidden
            />
            <input
              id="plan-new-category-title"
              type="text"
              className="plan-new-category-input"
              placeholder="New Category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewCategoryOk()
                if (e.key === 'Escape') handleNewCategoryCancel()
              }}
              autoFocus
            />
            <div className="plan-new-category-modal-actions">
              <button type="button" className="plan-new-category-cancel" onClick={handleNewCategoryCancel}>
                Cancel
              </button>
              <button type="button" className="plan-new-category-ok" onClick={handleNewCategoryOk}>
                OK
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
