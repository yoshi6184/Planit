import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import AccountDisplayName from '../components/AccountDisplayName'
import { ACCOUNT_TYPES } from '../context/AppContext'
import { AccountIcon } from '../components/AccountIcons'
import { getCategoryEmoji } from '../data/mockData'
import FileImportModal from '../components/FileImportModal'
import PageHeaderRow from '../components/PageHeaderRow'

const CATEGORY_GROUP_LABELS = { need: 'Needs', want: 'Wants', bills: 'Bills' }

export default function AccountPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const { accounts, transactions, categories, categoryBudgets, monthlyIncome } = state
  const currentMonth = '2025-02'

  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [editingId, setEditingId] = useState(null)
  const [categoryOpenId, setCategoryOpenId] = useState(null)
  const [editingDraft, setEditingDraft] = useState(null)
  const [showImport, setShowImport] = useState(false)

  const account = accounts.find((a) => a.id === accountId)
  const accountTx = useMemo(
    () => [...transactions].filter((t) => t.accountId === accountId).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50),
    [transactions, accountId]
  )

  useEffect(() => {
    if (!editingId) {
      setEditingDraft(null)
      return
    }
    if (editingId === 'new') {
      setEditingDraft({
        id: 'new',
        accountId: accountId,
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
  }, [editingId, transactions, accountId])

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

  const CURRENT_MONTH = '2025-02'
  const PREVIOUS_MONTH = '2025-01'

  const monthStatsByMonth = useMemo(() => {
    const months = [PREVIOUS_MONTH, CURRENT_MONTH]
    const init = months.reduce((acc, m) => {
      acc[m] = { spent: 0, earned: 0 }
      return acc
    }, {})

    accountTx.forEach((t) => {
      const month = t.date?.slice(0, 7)
      if (!months.includes(month)) return
      const amt = t.amount || 0
      if (amt < 0) {
        init[month].spent += Math.abs(amt)
      } else if (amt > 0) {
        init[month].earned += amt
      }
    })

    return init
  }, [accountTx])

  const currentStats = monthStatsByMonth[CURRENT_MONTH] || { spent: 0, earned: 0 }
  const previousStats = monthStatsByMonth[PREVIOUS_MONTH] || { spent: 0, earned: 0 }

  const balance = account?.balance ?? 0
  const netChangeThisMonth = currentStats.earned - currentStats.spent
  const previousBalance = balance - netChangeThisMonth

  const pctChange = (current, previous) => {
    if (previous === 0 && current === 0) return 0
    if (!previous) return null
    const diff = current - previous
    return (diff / Math.abs(previous)) * 100
  }

  const balanceChangePct = pctChange(balance, previousBalance)
  const spentChangePct = pctChange(currentStats.spent, previousStats.spent)
  const earnedChangePct = pctChange(currentStats.earned, previousStats.earned)

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—'
  const getAccountTypeLabel = (typeId) => ACCOUNT_TYPES.find((t) => t.id === typeId)?.label || typeId

  // Categories that participate in the budget (for inline category editing)
  const budgetCategories = useMemo(
    () => categories.filter((c) => Object.prototype.hasOwnProperty.call(categoryBudgets || {}, c.id)),
    [categories, categoryBudgets]
  )

  const { categoryDropdownSections, remainingIncome } = useMemo(() => {
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
    return { categoryDropdownSections: sections, remainingIncome: remaining }
  }, [transactions, currentMonth, budgetCategories, categoryBudgets, monthlyIncome])

  const handleVoicePayee = () => {
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
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setNewTx((prev) => ({ ...prev, payee: transcript }))
    }
    recognition.start()
  }

  const handleReconcile = () => {
    dispatch({ type: 'RECONCILE_ACCOUNT', payload: accountId })
  }

  if (!account) {
    return (
      <div>
        <p style={{ color: 'var(--text-muted)' }}>Account not found.</p>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="transactions-page">
      <PageHeaderRow
        left={
          <h1 className="transactions-title" style={{ margin: 0 }}>
            <span className="account-page-icon" style={{ marginRight: '0.35rem' }}><AccountIcon type={account.type} /></span>
            <AccountDisplayName account={account} />
          </h1>
        }
      />

      {/* Account hero stats */}
      <div className="account-summary-strip transactions-summary-strip">
        <div className="transactions-summary-item transactions-summary-item-primary">
          <div className="transactions-summary-label">Balance</div>
          <div
            className={`transactions-summary-value ${
              balance >= 0 ? 'transactions-summary-value-positive' : 'transactions-summary-value-negative'
            }`}
          >
            {formatCurrency(balance)}
          </div>
          <div style={{ fontSize: '0.75rem', color: balanceChangePct !== null ? (balanceChangePct >= 0 ? '#16a34a' : '#b91c1c') : 'var(--text-muted)' }}>
            {balanceChangePct !== null ? `${balanceChangePct >= 0 ? '+' : ''}${balanceChangePct.toFixed(1)}%` : '—'} vs last month
          </div>
        </div>
        <div className="transactions-summary-item">
          <div className="transactions-summary-label">Spent this month</div>
          <div className="transactions-summary-value transactions-summary-value-negative">
            {formatCurrency(currentStats.spent)}
          </div>
          <div style={{ fontSize: '0.75rem', color: spentChangePct !== null ? (spentChangePct >= 0 ? '#b91c1c' : '#16a34a') : 'var(--text-muted)' }}>
            {spentChangePct !== null ? `${spentChangePct >= 0 ? '+' : ''}${spentChangePct.toFixed(1)}%` : '—'} vs last month
          </div>
        </div>
        <div className="transactions-summary-item">
          <div className="transactions-summary-label">Earned this month</div>
          <div className="transactions-summary-value transactions-summary-value-positive">
            {formatCurrency(currentStats.earned)}
          </div>
          <div style={{ fontSize: '0.75rem', color: earnedChangePct !== null ? (earnedChangePct >= 0 ? '#16a34a' : '#b91c1c') : 'var(--text-muted)' }}>
            {earnedChangePct !== null ? `${earnedChangePct >= 0 ? '+' : ''}${earnedChangePct.toFixed(1)}%` : '—'} vs last month
          </div>
        </div>
        {account.lastReconciledAt && (
          <div className="transactions-summary-item" style={{ marginLeft: 'auto', paddingTop: '0.25rem' }}>
            <span className="transactions-summary-label">Last reconciled</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{account.lastReconciledAt}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="transactions-pill transactions-pill-add" onClick={() => setEditingId('new')}>+ Add transaction</button>
        <button type="button" className="transactions-pill" onClick={() => setShowImport(true)}>Import from file</button>
        <button
          type="button"
          className="transactions-pill"
          onClick={handleVoicePayee}
        >
          <span className="transactions-pill-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
              <path d="M19 10a7 7 0 0 1-14 0" />
              <path d="M12 17v4" />
              <path d="M8 21h8" />
            </svg>
          </span>
          Voice input
        </button>
      </div>

      <div className="card transactions-table-card">
        <div className="table-wrap">
          <table className="transactions-all-table transactions-all-table-account">
            <thead>
              <tr>
                <th className="transactions-all-th-check" aria-label="Select">
                  <span className="transactions-all-header-checkbox" aria-hidden>✓</span>
                </th>
                <th className="transactions-all-th-new" aria-label="New"><span className="transactions-all-header-box transactions-all-header-i">i</span></th>
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
              {accountTx.map((t) => {
                const isSelected = selectedIds.has(t.id)
                const isEditRow = t.id === editingId && editingDraft && editingDraft.id === t.id
                const categoryLabel = getCategoryDisplay(t)
                const isCategoryOpen = categoryOpenId === t.id
                const isCleared = isEditRow ? editingDraft.cleared : t.cleared !== false
                const draft = isEditRow ? editingDraft : null

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
                      {!t.categoryId && <span className="transactions-all-new-icon new" title="New transaction" aria-hidden>i</span>}
                    </td>
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
                                        dispatch({ type: 'UPDATE_TRANSACTION', payload: { id: t.id, categoryId: opt.id } })
                                      }
                                      setCategoryOpenId(null)
                                    }}
                                  >
                                    <span>{opt.id ? (opt.emoji ? `${opt.emoji} ${opt.name}` : opt.name) : opt.name}</span>
                                    <span className="transactions-all-category-option-amount amount-positive">{formatCurrency(opt.available)}</span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
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
      <FileImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onChooseFile={() => setShowImport(false)}
      />
    </div>
  )
}
