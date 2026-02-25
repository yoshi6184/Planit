import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getAccountEmoji } from '../data/mockData'
import Logo from './Logo'

export default function Layout({ children }) {
  const { state } = useApp()
  const { accounts } = state
  const location = useLocation()
  const isTransactions = location.pathname.startsWith('/transactions')
  const [transactionsExpanded, setTransactionsExpanded] = useState(isTransactions)

  useEffect(() => {
    if (isTransactions) setTransactionsExpanded((prev) => prev || true)
  }, [isTransactions])

  const handleTransactionsClick = (e) => {
    if (isTransactions) {
      e.preventDefault()
      setTransactionsExpanded((prev) => !prev)
    }
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo className="sidebar-logo" />
        </div>
        <nav>
          <NavLink to="/dashboard" end className="sidebar-link-with-icon">
            <span className="sidebar-menu-icon">🏠</span> Dashboard
          </NavLink>
          <div className="sidebar-section">
            <NavLink
              to="/transactions"
              end
              className={({ isActive }) => `sidebar-transactions-link ${isActive || isTransactions ? 'active' : ''}`}
              onClick={handleTransactionsClick}
            >
              <span className="sidebar-menu-icon">💸</span> Transactions
            </NavLink>
            {isTransactions && transactionsExpanded && (
              <div className="sidebar-accounts">
                {accounts.map((acc) => (
                  <NavLink
                    key={acc.id}
                    to={`/transactions/accounts/${acc.id}`}
                    className="sidebar-account-link"
                  >
                    <span className="sidebar-account-emoji">{getAccountEmoji(acc.type)}</span>
                    {acc.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          <NavLink to="/reports" className="sidebar-link-with-icon">
            <span className="sidebar-menu-icon">📈</span> Reports
          </NavLink>
          <NavLink to="/plan" className="sidebar-link-with-icon">
            <span className="sidebar-menu-icon">📋</span> Plan
          </NavLink>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
