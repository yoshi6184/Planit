import { useMemo, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import { ACCOUNT_TYPES } from '../context/AppContext'
import { AccountIcon } from '../components/AccountIcons'

export default function AccountPage() {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const { accounts, transactions, categories } = state

  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().slice(0, 10),
    payee: '',
    amount: '',
    categoryId: '',
    cleared: true,
    receiptName: '',
  })
  const [importText, setImportText] = useState('')
  const receiptInputRef = useRef(null)

  const account = accounts.find((a) => a.id === accountId)
  const accountTx = useMemo(
    () => transactions.filter((t) => t.accountId === accountId).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, accountId]
  )

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

  const handleReceiptChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setNewTx((prev) => ({ ...prev, receiptName: file.name }))
  }

  const handleAddTransaction = (e) => {
    e.preventDefault()
    const amount = parseFloat(newTx.amount)
    if (!newTx.payee || isNaN(amount)) return
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        date: newTx.date,
        payee: newTx.payee,
        amount,
        categoryId: newTx.categoryId || null,
        accountId,
        cleared: newTx.cleared,
        receiptName: newTx.receiptName || null,
      },
    })
    setNewTx({
      date: new Date().toISOString().slice(0, 10),
      payee: '',
      amount: '',
      categoryId: '',
      cleared: true,
      receiptName: '',
    })
    setShowAdd(false)
  }

  const handleImport = () => {
    const lines = importText.trim().split('\n').filter(Boolean)
    const imported = lines.map((line, i) => {
      const parts = line.split(',').map((p) => p.trim())
      const date = parts[0] || new Date().toISOString().slice(0, 10)
      const payee = parts[1] || 'Imported'
      const amount = parseFloat(parts[2]) || 0
      const categoryId = parts[3] ? categories.find((c) => c.id === parts[3] || c.name === parts[3])?.id : null
      const cleared = parts[4] !== 'false' && parts[4] !== '0'
      return { id: 'imp' + Date.now() + i, date, payee, amount, categoryId, accountId, cleared }
    })

    dispatch({ type: 'IMPORT_TRANSACTIONS', payload: imported })
    setImportText('')
    setShowImport(false)
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
      <h1 className="transactions-title" style={{ margin: '0 0 0.5rem' }}>
        <span className="account-page-icon" style={{ marginRight: '0.35rem' }}><AccountIcon type={account.type} /></span>
        {account.name}
      </h1>

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
        <button type="button" className="transactions-pill" onClick={() => setShowAdd(true)}>+ Add transaction</button>
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
        <button
          type="button"
          className="transactions-pill"
          onClick={() => receiptInputRef.current && receiptInputRef.current.click()}
        >
          <span className="transactions-pill-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
              <path d="M16 3v4h4" />
              <path d="M16 17l2 2 4-4" />
            </svg>
          </span>
          Upload receipt
        </button>
        <input
          ref={receiptInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleReceiptChange}
          style={{ display: 'none' }}
        />
        {newTx.receiptName && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Attached: {newTx.receiptName}
          </span>
        )}
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>Add transaction</h3>
          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date</span>
              <input
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx((p) => ({ ...p, date: e.target.value }))}
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '200px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payee</span>
              <input
                value={newTx.payee}
                onChange={(e) => setNewTx((p) => ({ ...p, payee: e.target.value }))}
                placeholder="Payee"
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minWidth: '160px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inflow</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newTx.amount >= 0 ? newTx.amount : ''}
                onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value ? parseFloat(e.target.value) : '' }))}
                placeholder="0.00"
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '100px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Outflow</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newTx.amount < 0 ? Math.abs(newTx.amount) : ''}
                onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value ? -parseFloat(e.target.value) : '' }))}
                placeholder="0.00"
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '100px' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Category</span>
              <select
                value={newTx.categoryId}
                onChange={(e) => setNewTx((p) => ({ ...p, categoryId: e.target.value }))}
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minWidth: '140px' }}
              >
                <option value="">—</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '0.25rem' }}>
              All new transactions are treated as cleared.
            </span>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </form>
        </div>
      )}

      {showImport && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>Import from file</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            One line per transaction: date, payee, amount, categoryId (optional), cleared (optional). Example: 2025-02-20, Store, -25.99, groceries, true
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="2025-02-20, Store, -25.99, groceries"
            rows={4}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-primary" onClick={handleImport}>Import</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowImport(false); setImportText('') }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Transactions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Inflow</th>
                <th style={{ textAlign: 'right' }}>Outflow</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {accountTx.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.payee}</td>
                  <td>{getCategoryName(t.categoryId)}</td>
                  <td style={{ textAlign: 'right' }} className="amount-positive">
                    {t.amount > 0 ? formatCurrency(t.amount) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }} className="amount-negative">
                    {t.amount < 0 ? formatCurrency(Math.abs(t.amount)) : '—'}
                  </td>
                  <td>
                    {t.receiptName ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '999px',
                          background: 'rgba(148, 163, 184, 0.12)',
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={t.receiptName}
                      >
                        <span aria-hidden>📎</span>
                        <span>{t.receiptName}</span>
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No receipt</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
