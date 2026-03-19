import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getCategoryEmoji } from '../data/mockData'
import { formatCurrency } from '../utils/format'
import FileImportModal from '../components/FileImportModal'
import PageHeaderRow from '../components/PageHeaderRow'

const CATEGORY_GROUP_LABELS = { need: 'Needs', want: 'Wants', bills: 'Bills' }

function getDateRangeForPreset(preset) {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  const pad = (n) => String(n).padStart(2, '0')
  const toYMD = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

  switch (preset) {
    case 'this_week': {
      const day = today.getDay()
      const sunOffset = day === 0 ? -6 : 1 - day
      const start = new Date(today)
      start.setDate(d + sunOffset)
      return { from: toYMD(start), to: toYMD(today) }
    }
    case 'this_month':
      return { from: `${y}-${pad(m + 1)}-01`, to: toYMD(today) }
    case 'this_year':
      return { from: `${y}-01-01`, to: toYMD(today) }
    case 'last_week': {
      const day = today.getDay()
      const sunOffset = day === 0 ? -6 : 1 - day
      const lastSun = new Date(today)
      lastSun.setDate(d + sunOffset - 7)
      const lastSat = new Date(lastSun)
      lastSat.setDate(lastSun.getDate() + 6)
      return { from: toYMD(lastSun), to: toYMD(lastSat) }
    }
    case 'last_month': {
      const first = new Date(y, m - 1, 1)
      const last = new Date(y, m, 0)
      return { from: toYMD(first), to: toYMD(last) }
    }
    case 'last_year':
      return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` }
    case 'last_30_days': {
      const from = new Date(today)
      from.setDate(d - 30)
      return { from: toYMD(from), to: toYMD(today) }
    }
    case 'last_60_days': {
      const from = new Date(today)
      from.setDate(d - 60)
      return { from: toYMD(from), to: toYMD(today) }
    }
    case 'last_90_days': {
      const from = new Date(today)
      from.setDate(d - 90)
      return { from: toYMD(from), to: toYMD(today) }
    }
    default:
      return { from: '', to: '' }
  }
}

export default function TransactionsSummary() {
  const { state, dispatch } = useApp()
  const { accounts, transactions, categories, categoryBudgets, monthlyIncome } = state
  const currentMonth = '2025-02'
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [editingId, setEditingId] = useState(null)
  const [categoryOpenId, setCategoryOpenId] = useState(null)
  const [editingDraft, setEditingDraft] = useState(null)
  const [showNewOnly, setShowNewOnly] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('date')
  const [filterDatePreset, setFilterDatePreset] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterKeyword, setFilterKeyword] = useState('')
  const [filterAmountMin, setFilterAmountMin] = useState('')
  const [filterAmountMax, setFilterAmountMax] = useState('')
  const [filterCategoryIds, setFilterCategoryIds] = useState(() => new Set())
  const [filterAccountIds, setFilterAccountIds] = useState(() => new Set())
  const [filterTransactionStatus, setFilterTransactionStatus] = useState(() => new Set())
  const [dataViewsOpen, setDataViewsOpen] = useState(false)
  const [createViewOpen, setCreateViewOpen] = useState(false)
  const [createViewName, setCreateViewName] = useState('')
  const [savedViews, setSavedViews] = useState(() => [])
  const [activeDataViewId, setActiveDataViewId] = useState('my_transactions')
  const dataViewsRef = useRef(null)
  const filtersRef = useRef(null)
  const [budgetToast, setBudgetToast] = useState(null)

  const applyDatePreset = (preset) => {
    if (preset === 'all' || preset === 'custom') {
      if (preset === 'all') {
        setFilterDateFrom('')
        setFilterDateTo('')
      }
      return
    }
    const { from, to } = getDateRangeForPreset(preset)
    setFilterDateFrom(from)
    setFilterDateTo(to)
  }

  const snapshotFilters = () => ({
    filterDatePreset,
    filterDateFrom,
    filterDateTo,
    filterKeyword,
    filterAmountMin,
    filterAmountMax,
    categoryIds: [...filterCategoryIds],
    accountIds: [...filterAccountIds],
    transactionStatus: [...filterTransactionStatus],
  })

  const applyFiltersSnapshot = (snap) => {
    if (!snap) return
    setFilterDatePreset(snap.filterDatePreset ?? 'all')
    setFilterDateFrom(snap.filterDateFrom ?? '')
    setFilterDateTo(snap.filterDateTo ?? '')
    setFilterKeyword(snap.filterKeyword ?? '')
    setFilterAmountMin(snap.filterAmountMin ?? '')
    setFilterAmountMax(snap.filterAmountMax ?? '')
    setFilterCategoryIds(new Set(snap.categoryIds ?? []))
    setFilterAccountIds(new Set(snap.accountIds ?? []))
    setFilterTransactionStatus(new Set(snap.transactionStatus ?? []))
  }

  const applyDataView = (viewId) => {
    setActiveDataViewId(viewId)
    setDataViewsOpen(false)
    if (viewId === 'my_transactions') {
      setFilterDatePreset('all')
      setFilterDateFrom('')
      setFilterDateTo('')
      setFilterKeyword('')
      setFilterAmountMin('')
      setFilterAmountMax('')
      setFilterCategoryIds(new Set())
      setFilterAccountIds(new Set())
      setFilterTransactionStatus(new Set())
    } else if (viewId === 'monthly_money_in') {
      const { from, to } = getDateRangeForPreset('this_month')
      setFilterDatePreset('this_month')
      setFilterDateFrom(from)
      setFilterDateTo(to)
      setFilterKeyword('')
      setFilterAmountMin('0.01')
      setFilterAmountMax('')
      setFilterCategoryIds(new Set())
      setFilterAccountIds(new Set())
      setFilterTransactionStatus(new Set())
    } else if (viewId === 'monthly_money_out') {
      const { from, to } = getDateRangeForPreset('this_month')
      setFilterDatePreset('this_month')
      setFilterDateFrom(from)
      setFilterDateTo(to)
      setFilterKeyword('')
      setFilterAmountMin('')
      setFilterAmountMax('-0.01')
      setFilterCategoryIds(new Set())
      setFilterAccountIds(new Set())
      setFilterTransactionStatus(new Set())
    } else if (viewId === 'operating_expenses') {
      const { from, to } = getDateRangeForPreset('this_month')
      setFilterDatePreset('this_month')
      setFilterDateFrom(from)
      setFilterDateTo(to)
      setFilterKeyword('')
      setFilterAmountMin('')
      setFilterAmountMax('')
      const billsCategories = categories.filter((c) => c.type === 'bills').map((c) => c.id)
      setFilterCategoryIds(new Set(billsCategories))
      setFilterAccountIds(new Set())
      setFilterTransactionStatus(new Set())
    } else {
      const saved = savedViews.find((v) => v.id === viewId)
      if (saved?.filters) applyFiltersSnapshot(saved.filters)
    }
  }

  const handleSaveCreateView = () => {
    const name = createViewName.trim()
    if (!name) return
    const id = 'view-' + Date.now()
    setSavedViews((prev) => [...prev, { id, name, filters: snapshotFilters() }])
    setActiveDataViewId(id)
    applyFiltersSnapshot(snapshotFilters())
    setCreateViewName('')
    setCreateViewOpen(false)
    setDataViewsOpen(false)
  }

  const selectedSingleId = selectedIds.size === 1 ? [...selectedIds][0] : null

  useEffect(() => {
    if (!dataViewsOpen) return
    const onPointer = (e) => {
      if (dataViewsRef.current?.contains(e.target)) return
      setDataViewsOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [dataViewsOpen])

  useEffect(() => {
    if (!editingId) {
      setEditingDraft(null)
      return
    }
    if (editingId === 'new') {
      setEditingDraft({
        id: 'new',
        accountId: accounts[0]?.id ?? '',
        date: new Date().toISOString().slice(0, 10),
        payee: '',
        categoryId: '',
        memo: '',
        amount: 0,
        cleared: true,
      })
      return
    }
    const t = transactions.find((tr) => tr.id === editingId)
    if (t) {
      setEditingDraft({
        id: t.id,
        accountId: t.accountId,
        date: t.date,
        payee: t.payee || '',
        categoryId: t.categoryId || '',
        memo: t.memo || '',
        amount: t.amount || 0,
        cleared: t.cleared !== false,
      })
    }
  }, [editingId, transactions, accounts])

  const getCategory = (id) => categories.find((c) => c.id === id)
  const getCategoryDisplay = (t) => {
    if (!t.categoryId) return null
    const c = getCategory(t.categoryId)
    if (!c) return null
    const group = CATEGORY_GROUP_LABELS[c.type] || ''
    return group ? `${group}: ${getCategoryEmoji(c.id)} ${c.name}` : `${getCategoryEmoji(c.id)} ${c.name}`
  }

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setEditingId(null)
  }
  const clearSelection = () => {
    setSelectedIds(new Set())
    setEditingId(null)
  }

  useEffect(() => {
    if (!categoryOpenId) return
    const onPointer = (e) => {
      if (e.target.closest('.transactions-all-category-wrap')) return
      setCategoryOpenId(null)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [categoryOpenId])

  const budgetCategories = useMemo(
    () => categories.filter((c) => Object.prototype.hasOwnProperty.call(categoryBudgets || {}, c.id)),
    [categories, categoryBudgets]
  )

  const { categoryAvailable, remainingIncome, categoryDropdownSections } = useMemo(() => {
    const activityByCat = {}
    transactions
      .filter((t) => t.date && t.date.startsWith(currentMonth) && t.amount < 0 && t.categoryId)
      .forEach((t) => {
        activityByCat[t.categoryId] = (activityByCat[t.categoryId] || 0) + t.amount
      })
    const available = {}
    budgetCategories.forEach((c) => {
      const budget = categoryBudgets[c.id] || 0
      const activity = activityByCat[c.id] || 0
      available[c.id] = budget + activity
    })
    const totalBudgeted = Object.values(categoryBudgets || {}).reduce((a, b) => a + b, 0)
    const remaining = (monthlyIncome || 0) - totalBudgeted
    const sections = [
      { label: 'Inflow', options: [{ id: '', name: 'Ready to Assign', available: remaining }] },
      { label: 'Credit Card Payments', options: [{ id: '_cc', name: 'Credit Card', available: 0 }] },
      ...['need', 'want', 'bills'].map((type) => ({
        label: CATEGORY_GROUP_LABELS[type],
        options: budgetCategories.filter((c) => c.type === type).map((c) => ({ ...c, available: available[c.id] ?? 0 })),
      })),
    ]
    return { categoryAvailable: available, remainingIncome: remaining, categoryDropdownSections: sections }
  }, [transactions, currentMonth, budgetCategories, categoryBudgets, monthlyIncome])

  const handleVoiceFilter = () => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      // Graceful no-op if browser doesn't support speech recognition
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.start()
  }

  useEffect(() => {
    if (!filtersOpen) return
    const onPointer = (e) => {
      if (filtersRef.current && filtersRef.current.contains(e.target)) return
      setFiltersOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [filtersOpen])

  const demoNewIds = useMemo(() => {
    const actionRequired = transactions.filter((t) => t.date && !t.categoryId && t.cleared !== true)
    return new Set(actionRequired.map((t) => t.id))
  }, [transactions])

  const allTx = useMemo(() => {
    let list = transactions
    if (showNewOnly) list = list.filter((t) => demoNewIds.has(t.id))
    if (filterDateFrom || filterDateTo) {
      list = list.filter((t) => {
        if (!t.date) return false
        if (filterDateFrom && t.date < filterDateFrom) return false
        if (filterDateTo && t.date > filterDateTo) return false
        return true
      })
    }
    if (filterKeyword.trim()) {
      const k = filterKeyword.trim().toLowerCase()
      list = list.filter((t) => {
        const payee = (t.payee || '').toLowerCase()
        const memo = (t.memo || '').toLowerCase()
        return payee.includes(k) || memo.includes(k)
      })
    }
    const minAmt = filterAmountMin === '' ? null : parseFloat(filterAmountMin)
    const maxAmt = filterAmountMax === '' ? null : parseFloat(filterAmountMax)
    if (minAmt != null || maxAmt != null) {
      list = list.filter((t) => {
        const amt = t.amount ?? 0
        if (minAmt != null && amt < minAmt) return false
        if (maxAmt != null && amt > maxAmt) return false
        return true
      })
    }
    if (filterCategoryIds.size > 0) {
      list = list.filter((t) => t.categoryId && filterCategoryIds.has(t.categoryId))
    }
    if (filterAccountIds.size > 0) {
      list = list.filter((t) => t.accountId && filterAccountIds.has(t.accountId))
    }
    if (filterTransactionStatus.size > 0) {
      list = list.filter((t) => {
        const status = t.status ?? 'posted'
        return filterTransactionStatus.has(status)
      })
    }
    return [...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50)
  }, [transactions, showNewOnly, filterDateFrom, filterDateTo, filterKeyword, filterAmountMin, filterAmountMax, filterCategoryIds, filterAccountIds, filterTransactionStatus, demoNewIds])

  const previousMonth = '2025-01'

  const monthSummary = useMemo(() => {
    let net = 0
    let moneyIn = 0
    let moneyOut = 0
    let prevNet = 0
    let prevMoneyIn = 0
    let prevMoneyOut = 0

    transactions.forEach((t) => {
      if (!t.date) return
      const amount = t.amount || 0
      if (t.date.startsWith(currentMonth)) {
        net += amount
        if (amount > 0) moneyIn += amount
        else if (amount < 0) moneyOut += Math.abs(amount)
      } else if (t.date.startsWith(previousMonth)) {
        prevNet += amount
        if (amount > 0) prevMoneyIn += amount
        else if (amount < 0) prevMoneyOut += Math.abs(amount)
      }
    })

    const pct = (curr, prev) => (prev === 0 && curr === 0 ? null : !prev ? null : ((curr - prev) / Math.abs(prev)) * 100)
    return {
      netChange: net,
      moneyIn,
      moneyOut,
      netChangePct: pct(net, prevNet),
      moneyInPct: pct(moneyIn, prevMoneyIn),
      moneyOutPct: pct(moneyOut, prevMoneyOut),
    }
  }, [transactions])

  const { netChange, moneyIn, moneyOut, netChangePct, moneyInPct, moneyOutPct } = monthSummary

  const newTransactionsCount = useMemo(() => demoNewIds.size, [demoNewIds])

  const handleApproveEdit = () => {
    if (!editingDraft) return
    if (editingDraft.id === 'new') {
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          accountId: editingDraft.accountId,
          date: editingDraft.date,
          payee: editingDraft.payee,
          categoryId: editingDraft.categoryId || null,
          memo: editingDraft.memo || null,
          amount: editingDraft.amount,
          cleared: editingDraft.cleared,
        },
      })
    } else {
      dispatch({
        type: 'UPDATE_TRANSACTION',
        payload: {
          id: editingDraft.id,
          accountId: editingDraft.accountId,
          date: editingDraft.date,
          payee: editingDraft.payee,
          categoryId: editingDraft.categoryId || null,
          memo: editingDraft.memo || null,
          amount: editingDraft.amount,
          cleared: editingDraft.cleared,
        },
      })
    }
    setEditingId(null)
    setEditingDraft(null)
    setSelectedIds(new Set())
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDraft(null)
    setSelectedIds(new Set())
  }

  const handleRowClick = (tId) => {
    const isOnlySelected = selectedIds.size === 1 && selectedIds.has(tId)
    const isCurrentlyEditing = editingId === tId
    if (isOnlySelected && !isCurrentlyEditing) {
      setEditingId(tId)
    } else {
      setSelectedIds(new Set([tId]))
      setEditingId(null)
    }
  }

  return (
    <div className={`transactions-page ${selectedIds.size > 0 ? 'has-action-bar' : ''}`}>
      <PageHeaderRow
        left={<h1 className="transactions-title">Transactions</h1>}
        center={
          (newTransactionsCount > 0 || showNewOnly) ? (
            <div className="transactions-notification-wrap transactions-notification-inline">
              <div className="transactions-notification-bubble">
                <span className="transactions-notification-text">
                  <span className="transactions-notification-icon" aria-hidden>ⓘ</span>
                  {showNewOnly
                    ? (newTransactionsCount === 0 ? 'No new transactions.' : `${newTransactionsCount} new transaction${newTransactionsCount !== 1 ? 's' : ''} to approve or categorize.`)
                    : `${newTransactionsCount} new transaction${newTransactionsCount !== 1 ? 's' : ''} to approve or categorize.`}
                </span>
                {showNewOnly ? (
                  <button type="button" className="transactions-notification-view" onClick={() => setShowNewOnly(false)}>
                    Show all
                  </button>
                ) : (
                  <button type="button" className="transactions-notification-view" onClick={() => setShowNewOnly(true)}>
                    View
                  </button>
                )}
              </div>
            </div>
          ) : null
        }
      />

      <div className="transactions-summary-strip">
        <div className="transactions-summary-item transactions-summary-item-primary">
          <div className="transactions-summary-label">Net change this month</div>
          <div
            className={`transactions-summary-value ${
              netChange >= 0 ? 'transactions-summary-value-positive' : 'transactions-summary-value-negative'
            }`}
          >
            {formatCurrency(netChange)}
          </div>
          <div className="transactions-summary-pct" style={{ color: netChangePct != null ? (netChangePct >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)' }}>
            {netChangePct != null ? `${netChangePct >= 0 ? '+' : ''}${netChangePct.toFixed(1)}%` : '—'} vs last month
          </div>
        </div>
        <div className="transactions-summary-item">
          <div className="transactions-summary-label">Money in</div>
          <div className="transactions-summary-value transactions-summary-value-positive">
            {formatCurrency(moneyIn)}
          </div>
          <div className="transactions-summary-pct" style={{ color: moneyInPct != null ? (moneyInPct >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)' }}>
            {moneyInPct != null ? `${moneyInPct >= 0 ? '+' : ''}${moneyInPct.toFixed(1)}%` : '—'} vs last month
          </div>
        </div>
        <div className="transactions-summary-item">
          <div className="transactions-summary-label">Money out</div>
          <div className="transactions-summary-value transactions-summary-value-negative">
            {formatCurrency(moneyOut > 0 ? -moneyOut : 0)}
          </div>
          <div className="transactions-summary-pct" style={{ color: moneyOutPct != null ? (moneyOutPct >= 0 ? 'var(--red)' : 'var(--green)') : 'var(--text-muted)' }}>
            {moneyOutPct != null ? `${moneyOutPct >= 0 ? '+' : ''}${moneyOutPct.toFixed(1)}%` : '—'} vs last month
          </div>
        </div>
      </div>

      <div className="transactions-toolbar">
        <div className="transactions-toolbar-left">
          <button type="button" className="transactions-pill transactions-pill-add" onClick={() => setEditingId('new')}>
            + Add transaction
          </button>
          <button type="button" className="transactions-pill" onClick={() => setShowImport(true)}>Import from file</button>
          {/* Voice input pill removed per design */}
          <div className="transactions-dataviews-wrap" ref={dataViewsRef}>
            <button
              type="button"
              className={`transactions-pill ${dataViewsOpen ? 'active' : ''}`}
              onClick={() => setDataViewsOpen((o) => !o)}
              aria-expanded={dataViewsOpen}
            >
              <span className="transactions-pill-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="8" height="7" rx="1.5" />
                  <rect x="13" y="4" width="8" height="4" rx="1.5" />
                  <rect x="13" y="10" width="8" height="7" rx="1.5" />
                  <rect x="3" y="13" width="8" height="4" rx="1.5" />
                </svg>
              </span>
              Data views
              <span className="transactions-pill-chevron" aria-hidden>▾</span>
            </button>
            {dataViewsOpen && (
              <div className="transactions-dataviews-dropdown">
                {[
                  { id: 'my_transactions', label: 'My transactions' },
                  { id: 'monthly_money_in', label: 'Monthly money in' },
                  { id: 'monthly_money_out', label: 'Monthly money out' },
                  { id: 'operating_expenses', label: 'Operating expenses' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    className={`transactions-dataviews-option ${activeDataViewId === id ? 'active' : ''}`}
                    onClick={() => applyDataView(id)}
                  >
                    {label}
                  </button>
                ))}
                {savedViews.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`transactions-dataviews-option ${activeDataViewId === v.id ? 'active' : ''}`}
                    onClick={() => applyDataView(v.id)}
                  >
                    {v.name}
                  </button>
                ))}
                <div className="transactions-dataviews-divider" />
                <button
                  type="button"
                  className="transactions-dataviews-create"
                  onClick={() => {
                    setDataViewsOpen(false)
                    setCreateViewOpen(true)
                  }}
                >
                  <span className="transactions-dataviews-create-icon">+</span>
                  Create view
                </button>
              </div>
            )}
          </div>
          <div className="transactions-filters-wrap" ref={filtersRef}>
            <button
              type="button"
              className={`transactions-pill ${filtersOpen ? 'active' : ''}`}
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              <span className="transactions-pill-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5h16l-5 6v5l-6 3v-8z" />
                </svg>
              </span>
              Filters
              <span className="transactions-pill-chevron" aria-hidden>▾</span>
            </button>
            {filtersOpen && (
              <div className="transactions-filter-panel">
                <div className="transactions-filter-list">
                  {[
                    { id: 'date', label: 'Date', icon: 'calendar' },
                    { id: 'keyword', label: 'Keyword', icon: 'search' },
                    { id: 'amount', label: 'Amount', icon: 'amount' },
                    { id: 'category', label: 'Category', icon: 'tag' },
                    { id: 'account', label: 'Account', icon: 'account' },
                    { id: 'status', label: 'Status', icon: 'status' },
                  ].map(({ id, label, icon }) => (
                    <button
                      key={id}
                      type="button"
                      className={`transactions-filter-option ${activeFilter === id ? 'active' : ''}`}
                      onClick={() => setActiveFilter(id)}
                    >
                      {icon === 'calendar' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                      )}
                      {icon === 'search' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                      )}
                      {icon === 'amount' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      )}
                      {icon === 'tag' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><path d="M7 7h.01" /></svg>
                      )}
                      {icon === 'account' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                      )}
                      {icon === 'status' && (
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      )}
                      <span>{label}</span>
                      {activeFilter === id && <span className="transactions-filter-arrow">›</span>}
                    </button>
                  ))}
                </div>
                <div className="transactions-filter-config">
                  {activeFilter === 'date' && (
                    <>
                      <div className="transactions-filter-config-title">Show transactions for</div>
                      <select
                        className="transactions-filter-select"
                        value={filterDatePreset}
                        onChange={(e) => {
                          const v = e.target.value
                          setFilterDatePreset(v)
                          applyDatePreset(v)
                        }}
                      >
                        <option value="all">All time</option>
                        <option value="this_week">This week</option>
                        <option value="this_month">This month</option>
                        <option value="this_year">This year</option>
                        <option value="last_week">Last week</option>
                        <option value="last_month">Last month</option>
                        <option value="last_year">Last year</option>
                        <option value="last_30_days">Last 30 days</option>
                        <option value="last_60_days">Last 60 days</option>
                        <option value="last_90_days">Last 90 days</option>
                        <option value="custom">Custom range</option>
                      </select>
                      <div className="transactions-filter-daterange">
                        <label>
                          <span>From</span>
                          <input
                            type="date"
                            value={filterDateFrom}
                            onChange={(e) => {
                              setFilterDateFrom(e.target.value)
                              setFilterDatePreset('custom')
                            }}
                            className="transactions-filter-input"
                          />
                        </label>
                        <label>
                          <span>To</span>
                          <input
                            type="date"
                            value={filterDateTo}
                            onChange={(e) => {
                              setFilterDateTo(e.target.value)
                              setFilterDatePreset('custom')
                            }}
                            className="transactions-filter-input"
                          />
                        </label>
                      </div>
                    </>
                  )}
                  {activeFilter === 'keyword' && (
                    <>
                      <div className="transactions-filter-config-title">Search payee or memo</div>
                      <input
                        type="text"
                        className="transactions-filter-input"
                        placeholder="Enter keyword..."
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                      />
                    </>
                  )}
                  {activeFilter === 'amount' && (
                    <>
                      <div className="transactions-filter-config-title">Amount range</div>
                      <div className="transactions-filter-daterange">
                        <label>
                          <span>Min</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            value={filterAmountMin}
                            onChange={(e) => setFilterAmountMin(e.target.value)}
                            className="transactions-filter-input"
                          />
                        </label>
                        <label>
                          <span>Max</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Any"
                            value={filterAmountMax}
                            onChange={(e) => setFilterAmountMax(e.target.value)}
                            className="transactions-filter-input"
                          />
                        </label>
                      </div>
                    </>
                  )}
                  {activeFilter === 'category' && (
                    <>
                      <div className="transactions-filter-config-title">Categories</div>
                      <div className="transactions-filter-check-list">
                        {categories.map((c) => (
                          <label key={c.id} className="transactions-filter-check-item">
                            <input
                              type="checkbox"
                              checked={filterCategoryIds.has(c.id)}
                              onChange={(e) => {
                                setFilterCategoryIds((prev) => {
                                  const next = new Set(prev)
                                  if (e.target.checked) next.add(c.id)
                                  else next.delete(c.id)
                                  return next
                                })
                              }}
                            />
                            <span>{getCategoryEmoji(c.id)} {c.name}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                  {activeFilter === 'account' && (
                    <>
                      <div className="transactions-filter-config-title">Accounts</div>
                      <div className="transactions-filter-check-list">
                        {accounts.map((a) => (
                          <label key={a.id} className="transactions-filter-check-item">
                            <input
                              type="checkbox"
                              checked={filterAccountIds.has(a.id)}
                              onChange={(e) => {
                                setFilterAccountIds((prev) => {
                                  const next = new Set(prev)
                                  if (e.target.checked) next.add(a.id)
                                  else next.delete(a.id)
                                  return next
                                })
                              }}
                            />
                            <span>{a.name}</span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                  {activeFilter === 'status' && (
                    <>
                      <div className="transactions-filter-status-section">
                        <div className="transactions-filter-config-title">Transaction status</div>
                        {[
                          { id: 'posted', label: 'Posted', desc: 'Money was successfully transferred.' },
                          { id: 'pending', label: 'Pending', desc: 'A transfer has been initiated, and a hold may be placed on your account, but it has not completed.' },
                          { id: 'failed', label: 'Failed', desc: 'No money was transferred.' },
                          { id: 'canceled', label: 'Canceled', desc: 'Transaction was stopped by you, a teammate, or Mercury employee before money was transferred.' },
                          { id: 'blocked', label: 'Blocked', desc: 'Vendor payment was blocked.' },
                        ].map(({ id, label, desc }) => (
                          <label key={id} className="transactions-filter-status-item">
                            <input
                              type="checkbox"
                              checked={filterTransactionStatus.has(id)}
                              onChange={(e) => {
                                setFilterTransactionStatus((prev) => {
                                  const next = new Set(prev)
                                  if (e.target.checked) next.add(id)
                                  else next.delete(id)
                                  return next
                                })
                              }}
                            />
                            <span className="transactions-filter-status-text">
                              <span className="transactions-filter-status-label">{label}</span>
                              <span className="transactions-filter-status-desc">{desc}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Date pill dropdown removed; date filtering lives in Filters only */}
        </div>
        <div className="transactions-toolbar-right">
          <button type="button" className="transactions-icon-button" aria-label="Toggle view">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="5" width="6" height="4" rx="1" />
              <rect x="4" y="13" width="6" height="4" rx="1" />
              <rect x="14" y="5" width="6" height="4" rx="1" />
              <rect x="14" y="13" width="6" height="4" rx="1" />
            </svg>
          </button>
          <button type="button" className="transactions-icon-button" aria-label="Sort">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 17V5" />
              <path d="M5 14l3 3 3-3" />
              <path d="M16 7v12" />
              <path d="M13 10l3-3 3 3" />
            </svg>
          </button>
          <button type="button" className="transactions-icon-button">Export all</button>
          <button type="button" className="transactions-icon-button" aria-label="More">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="card transactions-table-card">
        <div className="table-wrap">
          <table className="transactions-all-table transactions-all-table-main">
            <thead>
              <tr>
                <th className="transactions-all-th-check" aria-label="Select">
                  <span className="transactions-all-header-checkbox" aria-hidden>✓</span>
                </th>
                <th className="transactions-all-th-new" aria-label="New"><span className="transactions-all-header-box transactions-all-header-i">i</span></th>
                <th>Account</th>
                <th>Date</th>
                <th>Payee</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Inflow</th>
                <th style={{ textAlign: 'right' }}>Outflow</th>
                <th className="transactions-all-th-cleared" aria-label="Cleared"><span className="transactions-all-cleared-header" aria-hidden>✓</span></th>
              </tr>
            </thead>
            <tbody>
              {editingId === 'new' && editingDraft && editingDraft.id === 'new' && (() => {
                const draft = editingDraft
                const inflowVal = (draft.amount || 0) > 0 ? String(draft.amount) : ''
                const outflowVal = (draft.amount || 0) < 0 ? String(Math.abs(draft.amount)) : ''
                const isCleared = draft.cleared
                return (
                  <tr key="new" className="transactions-all-row-editing" onClick={(e) => e.stopPropagation()}>
                    <td className="transactions-all-td-check">
                      <button type="button" className="transactions-all-checkbox selected" onClick={() => setEditingId(null)} aria-label="Close edit">
                        <span className="transactions-all-checkmark" aria-hidden>✓</span>
                      </button>
                    </td>
                    <td className="transactions-all-td-new">
                      {!draft.categoryId && <span className="transactions-all-new-icon new" title="New transaction" aria-hidden>i</span>}
                    </td>
                    <td>
                      <select
                        className="transactions-all-edit-input transactions-all-edit-select"
                        value={draft.accountId}
                        onChange={(e) => setEditingDraft((p) => ({ ...p, accountId: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="transactions-all-edit-input"
                        value={draft.date}
                        onChange={(e) => setEditingDraft((p) => ({ ...p, date: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="transactions-all-edit-input"
                        value={draft.payee}
                        onChange={(e) => setEditingDraft((p) => ({ ...p, payee: e.target.value }))}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Payee"
                      />
                    </td>
                    <td className="transactions-all-td-category">
                      <select
                        className="transactions-all-edit-input transactions-all-edit-select transactions-all-edit-category"
                        value={draft.categoryId || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          if (v === '_inflow' || v === '_cc') {
                            setEditingDraft((p) => ({ ...p, categoryId: '' }))
                            return
                          }
                          setEditingDraft((p) => ({ ...p, categoryId: v || '' }))
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="">Uncategorized</option>
                        <option value="_inflow">Ready to Assign — {formatCurrency(remainingIncome)}</option>
                        {categoryDropdownSections.filter((s) => s.label !== 'Inflow' && s.label !== 'Credit Card Payments').map((sec) => (
                          <optgroup key={sec.label} label={sec.label}>
                            {sec.options.map((c) => (
                              <option key={c.id} value={c.id}>{getCategoryEmoji(c.id)} {c.name} — {formatCurrency(c.available)}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                    <td className="transactions-all-td-inflow">
                      <input
                        type="text"
                        className="transactions-all-edit-input transactions-all-edit-amount"
                        value={inflowVal}
                        onChange={(e) => { const v = parseFloat(e.target.value) || 0; setEditingDraft((p) => ({ ...p, amount: v })) }}
                        onClick={(e) => e.stopPropagation()}
                        placeholder=""
                      />
                    </td>
                    <td className="transactions-all-td-outflow">
                      <div className="transactions-all-outflow-wrap">
                        <input
                          type="text"
                          className="transactions-all-edit-input transactions-all-edit-amount"
                          value={outflowVal}
                          onChange={(e) => { const v = parseFloat(e.target.value) || 0; setEditingDraft((p) => ({ ...p, amount: -v })) }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder=""
                        />
                        <div className="transactions-all-inline-actions">
                          <button type="button" className="transactions-all-inline-cancel" onClick={handleCancelEdit}>Cancel</button>
                          <button type="button" className="transactions-all-inline-approve" onClick={handleApproveEdit}>Approve</button>
                        </div>
                      </div>
                    </td>
                    <td className="transactions-all-td-cleared">
                      <div className="transactions-all-cleared-cell-inner">
                        <button
                          type="button"
                          className={`transactions-all-cleared-toggle ${isCleared ? 'cleared' : ''}`}
                          onClick={() => setEditingDraft((p) => ({ ...p, cleared: !p.cleared }))}
                          aria-label={isCleared ? 'Mark uncleared' : 'Mark cleared'}
                          title={isCleared ? 'Cleared' : 'Uncleared'}
                        >
                          <span className="transactions-all-cleared-check" aria-hidden>✓</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })()}
              {allTx.map((t) => {
                const isSelected = selectedIds.has(t.id)
                const isEditRow = t.id === editingId && editingDraft && editingDraft.id === t.id
                const categoryLabel = getCategoryDisplay(t)
                const isCategoryOpen = categoryOpenId === t.id
                const isCleared = isEditRow ? editingDraft.cleared : t.cleared !== false
                const draft = isEditRow ? editingDraft : null
                const rowAccount = accounts.find((a) => a.id === t.accountId)

                if (isEditRow && draft) {
                  const inflowVal = (draft.amount || 0) > 0 ? String(draft.amount) : ''
                  const outflowVal = (draft.amount || 0) < 0 ? String(Math.abs(draft.amount)) : ''
                  return (
                    <tr key={t.id} className="transactions-all-row-editing" onClick={(e) => e.stopPropagation()}>
                      <td className="transactions-all-td-check">
                        <button
                          type="button"
                          className="transactions-all-checkbox selected"
                          onClick={() => setEditingId(null)}
                          aria-label="Close edit"
                        >
                          <span className="transactions-all-checkmark" aria-hidden>✓</span>
                        </button>
                      </td>
                      <td className="transactions-all-td-new">
                        {!draft.categoryId && <span className="transactions-all-new-icon new" title="New transaction" aria-hidden>i</span>}
                      </td>
                      <td>
                        <select
                          className="transactions-all-edit-input transactions-all-edit-select"
                          value={draft.accountId}
                          onChange={(e) => setEditingDraft((p) => ({ ...p, accountId: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="date"
                          className="transactions-all-edit-input"
                          value={draft.date}
                          onChange={(e) => setEditingDraft((p) => ({ ...p, date: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="transactions-all-edit-input"
                          value={draft.payee}
                          onChange={(e) => setEditingDraft((p) => ({ ...p, payee: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Payee"
                        />
                      </td>
                      <td className="transactions-all-td-category">
                        <select
                          className="transactions-all-edit-input transactions-all-edit-select transactions-all-edit-category"
                          value={draft.categoryId || ''}
                          onChange={(e) => {
                            const v = e.target.value
                            if (v === '_inflow' || v === '_cc') {
                              setEditingDraft((p) => ({ ...p, categoryId: '' }))
                              return
                            }
                            setEditingDraft((p) => ({ ...p, categoryId: v || '' }))
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Uncategorized</option>
                          <option value="_inflow">Ready to Assign — {formatCurrency(remainingIncome)}</option>
                          {categoryDropdownSections.filter((s) => s.label !== 'Inflow' && s.label !== 'Credit Card Payments').map((sec) => (
                            <optgroup key={sec.label} label={sec.label}>
                              {sec.options.map((c) => (
                                <option key={c.id} value={c.id}>{getCategoryEmoji(c.id)} {c.name} — {formatCurrency(c.available)}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      </td>
                      <td className="transactions-all-td-inflow">
                        <input
                          type="text"
                          className="transactions-all-edit-input transactions-all-edit-amount"
                          value={inflowVal}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0
                            setEditingDraft((p) => ({ ...p, amount: v }))
                          }}
                          onClick={(e) => e.stopPropagation()}
                          placeholder=""
                        />
                      </td>
                      <td className="transactions-all-td-outflow">
                        <div className="transactions-all-outflow-wrap">
                          <input
                            type="text"
                            className="transactions-all-edit-input transactions-all-edit-amount"
                            value={outflowVal}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0
                              setEditingDraft((p) => ({ ...p, amount: -v }))
                            }}
                            onClick={(e) => e.stopPropagation()}
                            placeholder=""
                          />
                          <div className="transactions-all-inline-actions">
                            <button type="button" className="transactions-all-inline-cancel" onClick={handleCancelEdit}>
                              Cancel
                            </button>
                            <button type="button" className="transactions-all-inline-approve" onClick={handleApproveEdit}>
                              Approve
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="transactions-all-td-cleared">
                        <div className="transactions-all-cleared-cell-inner">
                          <button
                            type="button"
                            className={`transactions-all-cleared-toggle ${isCleared ? 'cleared' : ''}`}
                            onClick={() => setEditingDraft((p) => ({ ...p, cleared: !p.cleared }))}
                            aria-label={isCleared ? 'Mark uncleared' : 'Mark cleared'}
                            title={isCleared ? 'Cleared' : 'Uncleared'}
                          >
                            <span className="transactions-all-cleared-check" aria-hidden>✓</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                return (
                  <tr
                    key={t.id}
                    className={isSelected ? 'transactions-all-row-selected' : ''}
                    onClick={() => handleRowClick(t.id)}
                  >
                    <td className="transactions-all-td-check" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`transactions-all-checkbox ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleSelection(t.id)}
                        aria-label={isSelected ? 'Deselect' : 'Select'}
                      >
                        {isSelected && <span className="transactions-all-checkmark" aria-hidden>✓</span>}
                      </button>
                    </td>
                    <td className="transactions-all-td-new">
                      {demoNewIds.has(t.id) && <span className="transactions-all-new-icon new" title="New transaction" aria-hidden>i</span>}
                    </td>
                    <td>{rowAccount ? rowAccount.name : '—'}</td>
                    <td>{t.date}</td>
                    <td>{t.payee}</td>
                    <td className="transactions-all-td-category">
                      <div className="transactions-all-category-wrap">
                        {categoryLabel ? (
                          <button
                            type="button"
                            className="transactions-all-category-pill"
                            onClick={(e) => { e.stopPropagation(); setCategoryOpenId(isCategoryOpen ? null : t.id) }}
                          >
                            {categoryLabel}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="transactions-all-category-pill uncategorized"
                            onClick={(e) => { e.stopPropagation(); setCategoryOpenId(isCategoryOpen ? null : t.id) }}
                          >
                            This needs a category
                          </button>
                        )}
                        {isCategoryOpen && (
                          <div className="transactions-all-category-dropdown" role="listbox">
                            <button
                              type="button"
                              className="transactions-all-category-option"
                              onClick={(e) => { e.stopPropagation(); dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: t.id, categoryId: null } }); setCategoryOpenId(null) }}
                            >
                              <span>Uncategorized</span>
                            </button>
                            {categoryDropdownSections.map((sec) => (
                              <div key={sec.label} className="transactions-all-category-dropdown-section">
                                <div className="transactions-all-category-dropdown-section-header">{sec.label}</div>
                                {sec.options.map((opt) => (
                                  <button
                                    key={opt.id || sec.label + '-' + opt.name}
                                    type="button"
                                    className="transactions-all-category-option"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (opt.id === '_cc' || opt.id === '') {
                                        dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: t.id, categoryId: null } })
                                      } else {
                                        const amount = t.amount || 0
                                        // Use the exact "Available left" number shown in the dropdown (Plan-derived),
                                        // then apply this transaction amount to show the new "Available".
                                        if (opt.id && Number.isFinite(opt.available)) {
                                          const availableBefore = opt.available
                                          const availableAfter = availableBefore + amount
                                          const toastId = `${t.id}:${opt.id}`
                                          setBudgetToast({
                                            id: toastId,
                                            name: opt.name,
                                            emoji: opt.emoji || '📁',
                                            before: availableBefore,
                                            after: availableAfter,
                                            isNegative: availableAfter < 0,
                                            animate: false,
                                          })
                                          // Pause, then roll to the updated number.
                                          setTimeout(() => {
                                            setBudgetToast((prev) => (prev && prev.id === toastId ? { ...prev, animate: true } : prev))
                                          }, 1000)
                                          setTimeout(() => {
                                            setBudgetToast((prev) => (prev && prev.id === toastId ? null : prev))
                                          }, 3000)
                                        }
                                        dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: t.id, categoryId: opt.id } })
                                      }
                                      setCategoryOpenId(null)
                                    }}
                                  >
                                    <span className="transactions-all-category-option-name">
                                      {opt.id ? (opt.emoji ? `${opt.emoji} ${opt.name}` : opt.name) : opt.name}
                                    </span>
                                    <span
                                      className={`transactions-all-category-option-amount ${opt.available < 0 ? 'transactions-amount-warning' : 'amount-positive'}`}
                                    >
                                      {formatCurrency(opt.available)}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Memo column removed per design */}
                    <td style={{ textAlign: 'right' }} className="amount-positive">
                      {t.amount > 0 ? formatCurrency(t.amount) : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }} className="amount-negative">
                      {t.amount < 0 ? formatCurrency(Math.abs(t.amount)) : '—'}
                    </td>
                      <td className="transactions-all-td-cleared" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className={`transactions-all-cleared-toggle ${isCleared ? 'cleared' : ''}`}
                          onClick={() => dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: t.id, cleared: !isCleared } })}
                          aria-label={isCleared ? 'Mark uncleared' : 'Mark cleared'}
                          title={isCleared ? 'Cleared' : 'Uncleared'}
                        >
<span className="transactions-all-cleared-check" aria-hidden>✓</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
      {selectedIds.size > 0 && (
        <div className="transactions-all-action-bar-wrap">
          <div className="transactions-all-action-bar" role="toolbar">
            <button type="button" className="transactions-all-action-dismiss" onClick={clearSelection} aria-label="Clear selection">
              × {selectedIds.size} Transaction{selectedIds.size !== 1 ? 's' : ''}
            </button>
            <span className="transactions-all-action-divider" aria-hidden />
            <button type="button" className="transactions-all-action-btn">
              <span className="transactions-all-action-icon" aria-hidden>✔</span> Approve
            </button>
            <span className="transactions-all-action-divider" aria-hidden />
            <button type="button" className="transactions-all-action-btn">
              <span className="transactions-all-action-icon" aria-hidden>✖</span> Reject
            </button>
            <span className="transactions-all-action-divider" aria-hidden />
            <button type="button" className="transactions-all-action-btn">
              <span className="transactions-all-action-icon" aria-hidden>☑</span> Categorize
            </button>
            <span className="transactions-all-action-divider" aria-hidden />
            <button type="button" className="transactions-all-action-btn">
              <span className="transactions-all-action-icon" aria-hidden>⋯</span> More
            </button>
          </div>
        </div>
      )}
      {budgetToast && (
        <div className="transactions-budget-toast" role="status" aria-live="polite">
          <div className={`transactions-budget-toast-inner ${budgetToast.isNegative ? 'negative' : 'positive'}`}>
            <div className="transactions-budget-toast-icon" aria-hidden>
              {budgetToast.emoji}
            </div>
            <div className="transactions-budget-toast-content">
              <div className="transactions-budget-toast-title">Budget updated</div>
              <div className="transactions-budget-toast-row">
                <span className="transactions-budget-toast-name">{budgetToast.name}</span>
                <span className={`transactions-budget-toast-roll ${budgetToast.animate ? 'animate' : ''}`} aria-label={`${formatCurrency(budgetToast.before)} to ${formatCurrency(budgetToast.after)}`}>
                  <span className="transactions-budget-toast-roll-inner">
                    <span className="transactions-budget-toast-roll-value">{formatCurrency(budgetToast.before)}</span>
                    <span className="transactions-budget-toast-roll-value">{formatCurrency(budgetToast.after)}</span>
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {createViewOpen && (
        <div className="transactions-createview-overlay" onClick={(e) => e.target === e.currentTarget && setCreateViewOpen(false)}>
          <div className="transactions-createview-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="transactions-createview-title">Create view</h3>
            <label className="transactions-createview-label">
              <span>View name</span>
              <input
                type="text"
                className="transactions-createview-input"
                value={createViewName}
                onChange={(e) => setCreateViewName(e.target.value)}
                placeholder="e.g. Q1 expenses"
              />
            </label>
            <p className="transactions-createview-hint">
              Current filters will be saved with this view. Use the Filters button to adjust date, keyword, amount, category, account, or status before saving.
            </p>
            <div className="transactions-createview-actions">
              <button type="button" className="transactions-createview-btn secondary" onClick={() => setFiltersOpen(true)}>
                Adjust filters
              </button>
              <button type="button" className="transactions-createview-btn primary" onClick={handleSaveCreateView} disabled={!createViewName.trim()}>
                Save
              </button>
              <button type="button" className="transactions-createview-btn secondary" onClick={() => { setCreateViewOpen(false); setCreateViewName('') }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <FileImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onChooseFile={() => { /* TODO: parse OFX/QFX/QIF/CSV */ setShowImport(false) }}
      />
    </div>
  )
}
