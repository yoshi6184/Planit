import { useRef } from 'react'

export default function FileImportModal({ open, onClose, onChooseFile }) {
  const fileInputRef = useRef(null)

  if (!open) return null

  const handleChooseFile = (e) => {
    const file = e.target.files?.[0]
    if (file && onChooseFile) onChooseFile(file)
    e.target.value = ''
    onClose()
  }

  return (
    <div className="file-import-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="file-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-import-header">
          <h2 className="file-import-title">File Import</h2>
          <button type="button" className="file-import-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="file-import-body">
          <p className="file-import-intro">
            To import transactions without linking your financial institution, first download a set of transactions from your bank or credit card website.
          </p>
          <p className="file-import-formats">
            <strong>Recommended formats:</strong> OFX and QFX<br />
            <strong>Supported formats:</strong> QIF and CSV
          </p>
          <div className="file-import-info-box">
            <span className="file-import-info-icon" aria-hidden>ⓘ</span>
            <span className="file-import-info-text">
              Worried about duplicates? Transactions entered by you will match automatically. Direct Import duplicates are skipped.
            </span>
          </div>
        </div>
        <div className="file-import-footer">
          <label className="file-import-dont-show">
            <input type="checkbox" />
            <span>Don&apos;t show again</span>
          </label>
          <div className="file-import-actions">
            <button type="button" className="file-import-btn file-import-btn-secondary" onClick={onClose}>
              Learn More
            </button>
            <button
              type="button"
              className="file-import-btn file-import-btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ofx,.qfx,.qif,.csv,application/vnd.ms-money,text/csv,text/qif"
              onChange={handleChooseFile}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
