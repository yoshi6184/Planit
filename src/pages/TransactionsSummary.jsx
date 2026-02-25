import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getAccountEmoji } from '../data/mockData'
import { formatCurrency } from '../utils/format'

export default function TransactionsSummary() {
  const { state } = useApp()
  const { accounts, transactions, categories } = state

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—'
  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || '—'

  const allTx = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [transactions]
  )

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.balance || 0), 0),
    [accounts]
  )

  return (
    <div>
      <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', fontWeight: 600 }}>Transactions</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        Overview of all accounts. Click an account in the sidebar to see details.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Total balance
        </h2>
        <div style={{ fontSize: '1.75rem', fontWeight: 700 }} className={totalBalance >= 0 ? 'amount-positive' : 'amount-negative'}>
          {formatCurrency(totalBalance)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {accounts.map((acc) => (
          <Link
            key={acc.id}
            to={`/transactions/accounts/${acc.id}`}
            className="card"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
            }}
          >
            <span style={{ fontSize: '1.75rem' }}>{getAccountEmoji(acc.type)}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{acc.name}</div>
              <div style={{ fontSize: '0.9rem' }} className={acc.balance >= 0 ? 'amount-positive' : 'amount-negative'}>
                {formatCurrency(acc.balance || 0)}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>Recent transactions (all accounts)</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee</th>
                <th>Category</th>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Inflow</th>
                <th style={{ textAlign: 'right' }}>Outflow</th>
              </tr>
            </thead>
            <tbody>
              {allTx.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.payee}</td>
                  <td>{getCategoryName(t.categoryId)}</td>
                  <td>{getAccountName(t.accountId)}</td>
                  <td style={{ textAlign: 'right' }} className="amount-positive">
                    {t.amount > 0 ? formatCurrency(t.amount) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }} className="amount-negative">
                    {t.amount < 0 ? formatCurrency(Math.abs(t.amount)) : '—'}
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
