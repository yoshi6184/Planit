import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import { ACCOUNT_TYPES } from '../context/AppContext'
import { getAccountEmoji } from '../data/mockData'

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
  })
  const [importText, setImportText] = useState('')

  const account = accounts.find((a) => a.id === accountId)
  const accountTx = useMemo(
    () => transactions.filter((t) => t.accountId === accountId).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, accountId]
  )

  const balances = useMemo(() => {
    let cleared = 0
    let uncleared = 0
    accountTx.forEach((t) => {
      const amt = t.amount || 0
      if (t.cleared) cleared += amt
      else uncleared += amt
    })
    return { cleared, uncleared, working: cleared + uncleared }
  }, [accountTx])

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—'
  const getAccountTypeLabel = (typeId) => ACCOUNT_TYPES.find((t) => t.id === typeId)?.label || typeId

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
      },
    })
    setNewTx({
      date: new Date().toISOString().slice(0, 10),
      payee: '',
      amount: '',
      categoryId: '',
      cleared: true,
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
  const handleReconcile = () => {
    dispatch({ type: 'RECONCILE_ACCOUNT', payload: accountId })
  }

    dispatch({ type: 'IMPORT_TRANSACTIONS', payload: imported })
    setImportText('')
    setShowImport(false)
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
    <div>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 600 }}>
        <span style={{ marginRight: '0.35rem' }}>{getAccountEmoji(account.type)}</span>
        {account.name}
      </h1>

      {/* Balance: compact single line; reconciled date on same block */}
      <div className="balance-compact">
        <span><strong>Cleared</strong> <span className={balances.cleared >= 0 ? 'amount-positive' : 'amount-negative'}>{formatCurrency(balances.cleared)}</span></span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span><strong>Uncleared</strong> <span className={balances.uncleared >= 0 ? 'amount-positive' : 'amount-negative'}>{formatCurrency(balances.uncleared)}</span></span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span><strong>Working</strong> <span className={balances.working >= 0 ? 'amount-positive' : 'amount-negative'}>{formatCurrency(balances.working)}</span></span>
        {account.lastReconciledAt && (
          <>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Reconciled {account.lastReconciledAt}</span>
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add transaction</button>
        <button type="button" className="btn btn-secondary" onClick={() => setShowImport(true)}>Import from file</button>
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
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.25rem' }}>
              <input
                type="checkbox"
                checked={newTx.cleared}
                onChange={(e) => setNewTx((p) => ({ ...p, cleared: e.target.checked }))}
              />
              <span style={{ fontSize: '0.85rem' }}>Cleared</span>
            </label>
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
                <th>Cleared</th>
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
                  <td>{t.cleared ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
