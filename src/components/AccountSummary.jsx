import { formatCurrency } from '../utils/format'
import AccountDisplayName from './AccountDisplayName'
import { ACCOUNT_TYPES } from '../context/AppContext'

function getAccountTypeLabel(typeId) {
  return ACCOUNT_TYPES.find((t) => t.id === typeId)?.label ?? typeId
}

export default function AccountSummary({ accounts, onRemove, onEdit, onAddAnother, onContinue }) {
  return (
    <div className="account-summary">
      <h1 className="account-summary-title">Your accounts</h1>
      <p className="account-summary-subtitle">
        Review your accounts. You can add more, edit, or remove them.
      </p>
      <ul className="account-summary-list">
        {accounts.map((acc) => (
          <li key={acc.id} className="account-summary-item">
            <div className="account-summary-item-main">
              <div className="account-summary-item-info">
                <span className="account-summary-item-name-line">
                  <span className="account-summary-item-name"><AccountDisplayName account={acc} /></span>
                  <span className={`account-summary-item-badge ${acc.isManual ? 'manual' : 'linked'}`}>
                    {acc.isManual ? 'Manual' : 'Linked'}
                  </span>
                </span>
                <span className="account-summary-item-meta">
                  {getAccountTypeLabel(acc.type)} · {formatCurrency(acc.balance ?? 0)}
                </span>
              </div>
            </div>
            <div className="account-summary-item-actions">
              <button
                type="button"
                className="account-summary-btn account-summary-btn-edit"
                onClick={() => onEdit(acc)}
              >
                Edit
              </button>
              <button
                type="button"
                className="account-summary-btn account-summary-btn-remove"
                onClick={() => onRemove(acc.id)}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="account-summary-actions">
        <button type="button" className="account-summary-add-another" onClick={onAddAnother}>
          + Add another manual account
        </button>
        <button type="button" className="btn btn-primary account-summary-continue" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
