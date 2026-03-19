import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const USER = { name: 'David Nguyen', email: 'nguy6184@planit.com' }

export default function TopBar() {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard'
  const { state, dispatch } = useApp()
  const { hideBalances, theme } = state
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [moveMoneyOpen, setMoveMoneyOpen] = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const profileRef = useRef(null)
  const notificationsRef = useRef(null)
  const moveMoneyRef = useRef(null)

  useEffect(() => {
    const onPointer = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
        setAppearanceOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false)
      if (moveMoneyRef.current && !moveMoneyRef.current.contains(e.target)) setMoveMoneyOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const setTheme = (value) => {
    dispatch({ type: 'SET_THEME', payload: value })
    setAppearanceOpen(false)
  }

  const themeLabel = theme === 'system' ? 'System default' : theme === 'dark' ? 'Dark' : 'Light'

  return (
    <div className="topbar-controls">
        {isDashboard && (
          <div className="topbar-search-wrap">
            <div className="dashboard-search">
              <span className="dashboard-search-icon" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input type="search" className="dashboard-search-input" placeholder="Search for anything" />
              <kbd className="dashboard-search-kbd">Ctrl K</kbd>
            </div>
          </div>
        )}
          <button
            type="button"
            className="dashboard-eye-toggle"
            onClick={() => dispatch({ type: 'SET_HIDE_BALANCES', payload: !hideBalances })}
            aria-label={hideBalances ? 'Show balances' : 'Hide balances'}
          >
            {hideBalances ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
          <div className="topbar-dropdown-wrap" ref={notificationsRef}>
            <button
              type="button"
              className="dashboard-notify-btn"
              onClick={() => setNotificationsOpen((v) => !v)}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            {notificationsOpen && (
              <div className="topbar-dropdown topbar-dropdown-notifications">
                <p className="topbar-dropdown-empty">No new notifications</p>
              </div>
            )}
          </div>
        <div className="topbar-dropdown-wrap" ref={moveMoneyRef}>
          <button
            type="button"
            className="btn dashboard-topbar-btn"
            onClick={() => setMoveMoneyOpen((v) => !v)}
          >
            Move money
          </button>
          {moveMoneyOpen && (
            <div className="topbar-dropdown">
              <button type="button" className="topbar-dropdown-item">Transfer between accounts</button>
              <button type="button" className="topbar-dropdown-item">Pay someone</button>
            </div>
          )}
        </div>
        <div className="topbar-dropdown-wrap topbar-profile-wrap" ref={profileRef}>
          <button
            type="button"
            className="dashboard-avatar"
            onClick={() => { setProfileOpen((v) => !v); setAppearanceOpen(false) }}
            aria-label="Profile"
            aria-expanded={profileOpen}
          >
            DN
          </button>
          {profileOpen && (
            <div className="topbar-profile-menu">
              <div className="topbar-profile-header">
                <span className="topbar-profile-tag">Admin</span>
                <div className="topbar-profile-name">{USER.name}</div>
                <div className="topbar-profile-email">{USER.email}</div>
              </div>
              <div className="topbar-profile-divider" />
              <button type="button" className="topbar-profile-item">Profile</button>
              <button type="button" className="topbar-profile-item">Notifications</button>
              <button type="button" className="topbar-profile-item">Security</button>
              <button type="button" className="topbar-profile-item">
                Privacy
                <span className="topbar-profile-external" aria-hidden>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                </span>
              </button>
              <div className="topbar-profile-divider" />
              <div className="topbar-profile-appearance">
                <button
                  type="button"
                  className="topbar-profile-item topbar-profile-item-with-sub"
                  onClick={() => setAppearanceOpen((v) => !v)}
                >
                  <span>Appearance</span>
                  <span className="topbar-profile-chevron">{appearanceOpen ? '▼' : '▶'}</span>
                </button>
                {!appearanceOpen && <div className="topbar-profile-sub">{themeLabel}</div>}
                {appearanceOpen && (
                  <div className="topbar-appearance-options">
                    <button type="button" className="topbar-appearance-opt" onClick={() => setTheme('light')}>Light</button>
                    <button type="button" className="topbar-appearance-opt" onClick={() => setTheme('dark')}>Dark</button>
                    <button type="button" className="topbar-appearance-opt" onClick={() => setTheme('system')}>System default</button>
                  </div>
                )}
              </div>
              <button type="button" className="topbar-profile-item topbar-profile-item-logout">Log out</button>
            </div>
          )}
        </div>
    </div>
  )
}
