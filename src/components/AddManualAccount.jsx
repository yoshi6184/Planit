import { useState } from 'react'
import { ACCOUNT_TYPES } from '../context/AppContext'

export default function AddManualAccount({ onBack, onClose, onSubmit, initialValues = {}, isEdit = false, variant }) {
  const isOnboarding = variant === 'onboarding'
  const [name, setName] = useState(initialValues.name ?? '')
  const [type, setType] = useState(initialValues.type ?? 'checking')
  const [balance, setBalance] = useState(initialValues.balance != null ? String(initialValues.balance) : '')
  const [date, setDate] = useState(() => {
    const v = initialValues.lastReconciledAt ?? new Date().toISOString().slice(0, 10)
    return v
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const balanceNum = parseFloat(balance) || 0
    const dateStr = date || new Date().toISOString().slice(0, 10)
    onSubmit({
      name: name.trim() || 'Manual account',
      type,
      balance: balanceNum,
      lastReconciledAt: dateStr,
      isManual: true,
      ...(initialValues.id && { id: initialValues.id }),
    })
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="manual-account-form">
      <div className="manual-account-field">
        <label className="manual-account-label">Account name</label>
        <input
          type="text"
          className="manual-account-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. WISE"
          autoComplete="off"
        />
      </div>
      <div className="manual-account-field">
        <label className="manual-account-label">Account type</label>
        <select
          className="manual-account-input manual-account-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Account type"
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="manual-account-row">
        <div className="manual-account-field manual-account-field-grow">
          <label className="manual-account-label">Balance</label>
          <input
            type="number"
            step="any"
            inputMode="decimal"
            className="manual-account-input"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="0"
          />
        </div>
        <span className="manual-account-on">on</span>
        <div className="manual-account-field manual-account-field-grow">
          <label className="manual-account-label">Date</label>
          <input
            type="date"
            className="manual-account-input manual-account-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Balance date"
          />
        </div>
      </div>
      <div className="manual-account-actions">
        {(onBack || onClose) && (
          <button type="button" className="manual-account-secondary" onClick={onClose || onBack}>
            {onBack ? 'Back' : 'Cancel'}
          </button>
        )}
        <button type="submit" className="manual-account-primary">
          {isOnboarding ? 'Continue' : 'Add account'}
        </button>
      </div>
    </form>
  )

  if (isOnboarding) {
    return (
      <div className="onboarding-add-account">
        <div className="onboarding-add-account-header">
          <h2 className="onboarding-add-account-title">Add manual account</h2>
        </div>
        <p className="onboarding-add-account-subtitle">
          You need to enter your transactions manually for this account.
        </p>
        {formContent}
      </div>
    )
  }

  return (
    <div className="manual-account">
      <h2 className="manual-account-title">Add manual account</h2>
      <p className="manual-account-subtitle">
        You need to enter your transactions manually for this account.
      </p>
      {formContent}
    </div>
  )
}
