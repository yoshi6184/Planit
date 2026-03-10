import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import Logo from './Logo'
import { AccountIcon } from './AccountIcons'
import { IconHome, IconTransactions, IconReports, IconPlan, IconTasks } from './SidebarIcons'

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
        <nav className="sidebar-main-nav">
          <NavLink to="/dashboard" end className={({ isActive }) => `sidebar-link-with-icon${isActive ? ' active' : ''}`}>
            <span className="sidebar-menu-icon"><IconHome /></span> Home
          </NavLink>
          <div className="sidebar-section">
            <NavLink
              to="/transactions"
              end
              className={({ isActive }) => `sidebar-transactions-link ${isActive || isTransactions ? 'active' : ''}`}
              onClick={handleTransactionsClick}
            >
              <span className="sidebar-menu-icon"><IconTransactions /></span> Transactions
            </NavLink>
            {isTransactions && transactionsExpanded && (
              <div className="sidebar-accounts">
                {accounts.map((acc) => (
                  <NavLink
                    key={acc.id}
                    to={`/transactions/accounts/${acc.id}`}
                    className="sidebar-account-link"
                  >
                    <span className="sidebar-account-icon"><AccountIcon type={acc.type} /></span>
                    {acc.name}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
          <NavLink to="/reports" className={({ isActive }) => `sidebar-link-with-icon${isActive ? ' active' : ''}`}>
            <span className="sidebar-menu-icon"><IconReports /></span> Reports
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => `sidebar-link-with-icon${isActive ? ' active' : ''}`}>
            <span className="sidebar-menu-icon"><IconPlan /></span> Plan
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `sidebar-link-with-icon${isActive ? ' active' : ''}`}>
            <span className="sidebar-menu-icon"><IconTasks /></span> Tasks
          </NavLink>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  )
}
