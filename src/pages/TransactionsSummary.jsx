import { useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'

export default function TransactionsSummary() {
  const { state } = useApp()
  const { accounts, transactions, categories } = state
  const receiptInputRef = useRef(null)

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '—'
  const getAccountName = (id) => accounts.find((a) => a.id === id)?.name || '—'

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

  const handleReceiptToolbarClick = () => {
    if (receiptInputRef.current) {
      receiptInputRef.current.click()
    }
  }

  const handleReceiptToolbarChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    // No persistence yet – reset so the same file can be chosen again
    e.target.value = ''
  }

  const allTx = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50),
    [transactions]
  )

  const currentMonth = '2025-02'

  const monthSummary = useMemo(() => {
    let net = 0
    let moneyIn = 0
    let moneyOut = 0

    transactions.forEach((t) => {
      if (!t.date || !t.date.startsWith(currentMonth)) return
      const amount = t.amount || 0
      net += amount
      if (amount > 0) {
        moneyIn += amount
      } else if (amount < 0) {
        moneyOut += Math.abs(amount)
      }
    })

    return { netChange: net, moneyIn, moneyOut }
  }, [transactions])

  const { netChange, moneyIn, moneyOut } = monthSummary

  return (
    <div className="transactions-page">
      <div className="transactions-header-row">
        <h1 className="transactions-title">Transactions</h1>
      </div>

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
        </div>
        <div className="transactions-summary-item">
          <div className="transactions-summary-label">Money in</div>
          <div className="transactions-summary-value transactions-summary-value-positive">
            {formatCurrency(moneyIn)}
          </div>
        </div>
        <div className="transactions-summary-item">
          <div className="transactions-summary-label">Money out</div>
          <div className="transactions-summary-value transactions-summary-value-negative">
            {formatCurrency(moneyOut > 0 ? -moneyOut : 0)}
          </div>
        </div>
      </div>

      <div className="transactions-toolbar">
        <div className="transactions-toolbar-left">
          <button type="button" className="transactions-pill">
            <span className="transactions-pill-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="8" height="7" rx="1.5" />
                <rect x="13" y="4" width="8" height="4" rx="1.5" />
                <rect x="13" y="10" width="8" height="7" rx="1.5" />
                <rect x="3" y="13" width="8" height="4" rx="1.5" />
              </svg>
            </span>
            Data views
          </button>
          <button type="button" className="transactions-pill">
            <span className="transactions-pill-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16l-5 6v5l-6 3v-8z" />
              </svg>
            </span>
            Filters
          </button>
          <button type="button" className="transactions-pill">Date</button>
          <button type="button" className="transactions-pill">Keyword</button>
          <button type="button" className="transactions-pill">Amount</button>
        </div>
        <div className="transactions-toolbar-right">
          <button type="button" className="transactions-icon-button transactions-match-button">
            <span className="transactions-pill-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="13" rx="2" />
                <path d="M8 9h8" />
                <path d="M8 13h4" />
              </svg>
            </span>
            Match receipts
          </button>
          <button
            type="button"
            className="transactions-icon-button"
            aria-label="Voice input for filters"
            onClick={handleVoiceFilter}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" />
              <path d="M19 10a7 7 0 0 1-14 0" />
              <path d="M12 17v4" />
              <path d="M8 21h8" />
            </svg>
          </button>
          <button
            type="button"
            className="transactions-icon-button"
            onClick={handleReceiptToolbarClick}
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
            onChange={handleReceiptToolbarChange}
            style={{ display: 'none' }}
          />
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
          <button type="button" className="transactions-icon-button" aria-label="More filters">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
          <button type="button" className="transactions-icon-button">Export all</button>
        </div>
      </div>

      <div className="card transactions-table-card">
        <div className="transactions-table-header">
          <span className="transactions-table-title">All transactions</span>
        </div>
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
