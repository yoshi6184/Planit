import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'

export default function Transactions() {
  const { state, dispatch } = useApp()
  const { transactions, accounts, categories } = state
  const [showAdd, setShowAdd] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [newTx, setNewTx] = useState({ date: new Date().toISOString().slice(0, 10), payee: '', amount: '', categoryId: '', accountId: accounts[0]?.id })
  const [importText, setImportText] = useState('')
  const [connectBank, setConnectBank] = useState(false)

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—'
  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || '—'

  const handleAddTransaction = (e) => {
    e.preventDefault()
    const amount = parseFloat(newTx.amount)
    if (!newTx.payee || isNaN(amount)) return
    dispatch({
      type: 'ADD_TRANSACTION',
      payload: {
        date: newTx.date,
        payee: newTx.payee,
        amount: amount,
        categoryId: newTx.categoryId || null,
        accountId: newTx.accountId,
      },
    })
    setNewTx({ date: new Date().toISOString().slice(0, 10), payee: '', amount: '', categoryId: '', accountId: accounts[0]?.id })
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
      return { id: 'imp' + Date.now() + i, date, payee, amount, categoryId, accountId: accounts[0]?.id }
    })
    dispatch({ type: 'IMPORT_TRANSACTIONS', payload: imported })
    setImportText('')
    setShowImport(false)
  }

  const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem' }}>Transactions</h1>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Connect your bank</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Link your accounts to automatically import transactions. (Mock: use manual entry or import below.)
        </p>
        <button
          className="btn btn-primary"
          onClick={() => setConnectBank(true)}
          style={{ opacity: connectBank ? 0.7 : 1 }}
        >
          {connectBank ? '✓ Connected (mock)' : 'Connect bank (mock)'}
        </button>
        {connectBank && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--green)' }}>
            Mock connection active. Add or import transactions to see them here.
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + New transaction
        </button>
        <button className="btn btn-secondary" onClick={() => setShowImport(true)}>
          Import transactions
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 1rem' }}>Add transaction</h3>
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
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount (negative = expense)</span>
              <input
                type="number"
                step="0.01"
                value={newTx.amount}
                onChange={(e) => setNewTx((p) => ({ ...p, amount: e.target.value }))}
                placeholder="-50.00"
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', width: '120px' }}
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
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Account</span>
              <select
                value={newTx.accountId}
                onChange={(e) => setNewTx((p) => ({ ...p, accountId: e.target.value }))}
                style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', minWidth: '140px' }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          </form>
        </div>
      )}

      {showImport && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: '0 0 0.5rem' }}>Import transactions</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            One line per transaction: date, payee, amount, categoryId (optional). Example: 2025-02-20, Store, -25.99, groceries
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="2025-02-20, Store, -25.99, groceries"
            rows={4}
            style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontFamily: 'inherit', marginBottom: '0.75rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleImport}>Import</button>
            <button className="btn btn-secondary" onClick={() => { setShowImport(false); setImportText('') }}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>All transactions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Category</th>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {sortedTx.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.payee}</td>
                  <td>{getCategoryName(t.categoryId)}</td>
                  <td>{getAccountName(t.accountId)}</td>
                  <td style={{ textAlign: 'right' }} className={t.amount >= 0 ? 'amount-positive' : 'amount-negative'}>
                    {t.amount < 0 ? '-' + formatCurrency(Math.abs(t.amount)) : formatCurrency(t.amount)}
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
