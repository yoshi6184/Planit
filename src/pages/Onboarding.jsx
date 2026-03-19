import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import AddManualAccount from '../components/AddManualAccount'
import AccountSummary from '../components/AccountSummary'

const TOTAL_STEPS = 7

const BRINGS_OPTIONS = [
  { label: 'Simplify my finance', icon: '✨' },
  { label: 'Feel more in control', icon: '🎛️' },
  { label: 'Get out of debt', icon: '📉' },
  { label: 'Manage money with my partner', icon: '👫' },
  { label: 'Make the most of my money', icon: '💰' },
  { label: 'Save for something', icon: '🎯' },
  { label: 'Other', icon: '📁' },
]

const HEAR_OPTIONS = [
  { label: 'Search', icon: '🔍' },
  { label: 'Friend or family', icon: '👥' },
  { label: 'Social media', icon: '📱' },
  { label: 'Blog or article', icon: '📄' },
  { label: 'Other', icon: '📁' },
]

const PLAN_INCLUDE_OPTIONS = [
  { label: 'Dining out', icon: '🍽️' },
  { label: 'Hobbies', icon: '🎨' },
  { label: 'Holidays and gifts', icon: '🎁' },
  { label: 'Charity', icon: '💝' },
  { label: 'Savings', icon: '🏦' },
]

const POPULAR_BANKS = [
  { name: 'Chase', domain: 'chase.com', logoUrl: '/bank-logos/chase.png' },
  { name: 'Bank of America', domain: 'bankofamerica.com', logoUrl: '/bank-logos/bankofamerica.png' },
  { name: 'Wells Fargo Bank', domain: 'wellsfargo.com', logoUrl: '/bank-logos/wellsfargo.png' },
  { name: 'Capital One', domain: 'capitalone.com', logoUrl: '/bank-logos/capitalone.png' },
  { name: 'American Express', domain: 'americanexpress.com', logoUrl: '/bank-logos/americanexpress.png' },
  { name: 'Citibank', domain: 'citi.com', logoUrl: '/bank-logos/citi.png' },
  { name: 'Fidelity Inv & Retirement', domain: 'fidelity.com', logoUrl: '/bank-logos/fidelity.png' },
  { name: 'Discover Credit Card', domain: 'discover.com', logoUrl: '/bank-logos/discover.png' },
  { name: 'Robinhood', domain: 'robinhood.com', logoUrl: '/bank-logos/robinhood.png' },
  { name: 'Chime', domain: 'chime.com', logoUrl: '/bank-logos/chime.png' },
  { name: 'Charles Schwab', domain: 'schwab.com', logoUrl: '/bank-logos/charlesschwab.png' },
  { name: 'Navy Federal Credit Union', domain: 'navyfederal.org', logoUrl: '/bank-logos/navyfederal.png' },
]

const COUNTRIES = [
  '',
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'India',
  'Mexico',
  'Brazil',
  'Other',
]

const TESTIMONIALS = [
  { quote: 'A game changer for my budget.', author: 'Chicagosnow1' },
  { quote: 'No more guessing where my money goes.', author: 'nnnoah25' },
  { quote: 'Legitimately the best budget app.', author: 'r_x_rx' },
]

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function BankLogo({ bank, className }) {
  const [failed, setFailed] = useState(false)
  const logoUrl = bank.logoUrl || (bank.domain ? `https://logo.clearbit.com/${bank.domain}` : null)

  if (!logoUrl || failed) {
    return <span className={className}>{bank.name.charAt(0)}</span>
  }

  return (
    <span className={className}>
      <img src={logoUrl} alt="" onError={() => setFailed(true)} />
    </span>
  )
}

export default function Onboarding() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const { accounts } = state

  const [step, setStep] = useState(1)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreeTerms, setAgreeTerms] = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('')

  const [brings, setBrings] = useState([])
  const [hear, setHear] = useState('')
  const [planInclude, setPlanInclude] = useState([])

  const [selectedBank, setSelectedBank] = useState('')
  const [bankSearch, setBankSearch] = useState('')
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAccountSummary, setShowAccountSummary] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState(null)

  const toggleMulti = (setter, value) => {
    setter(prev => (prev.includes(value) ? prev.filter(x => x !== value) : [...prev, value]))
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      dispatch({ type: 'COMPLETE_ONBOARDING' })
      navigate('/dashboard')
    }
  }

  const handleSkip = () => {
    if (step < TOTAL_STEPS) {
      setStep(step + 1)
    } else {
      dispatch({ type: 'COMPLETE_ONBOARDING' })
      navigate('/dashboard')
    }
  }

  const progressPct = step > 0 ? (step / TOTAL_STEPS) * 100 : 0

  return (
    <div className={`onboarding-layout ${step === 0 ? 'onboarding-layout-welcome' : ''}`}>
      <div
        className={`onboarding-card ${step === 0 ? 'onboarding-card-welcome' : ''} ${
          step === 6 ? 'onboarding-card-wide' : ''
        } ${step === 7 ? 'onboarding-card-quotes' : ''}`}
      >
        {step > 0 && (
          <div className="onboarding-progress-wrap">
            <div className="onboarding-progress-bar" style={{ width: `${progressPct}%` }} />
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="onboarding-welcome">
            <div className="onboarding-welcome-hero" aria-hidden>
              <img src="/onboarding-hero.png" alt="" className="onboarding-welcome-img" />
            </div>
            <h1 className="onboarding-welcome-title">Welcome to Planit</h1>
            <p className="onboarding-welcome-subtitle">
              Set your goals, track spending, and stay on budget. One simple place for your money.
            </p>
            <button type="button" className="onboarding-welcome-cta" onClick={() => setStep(1)}>
              Get started
            </button>
          </div>
        )}

        {/* Step 1: Sign up / Login */}
        {step === 1 && (
          <>
            <h1 className="onboarding-title">Create your account</h1>
            <p className="onboarding-subtitle">Sign up or log in to get started.</p>
            <div className="onboarding-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="onboarding-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="onboarding-input"
              />
              <button type="button" className="onboarding-sso" disabled>
                <AppleIcon /> Continue with Apple
              </button>
              <button type="button" className="onboarding-sso" disabled>
                <GoogleIcon /> Continue with Google
              </button>
              <label className="onboarding-check">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={e => setAgreeTerms(e.target.checked)}
                />
                <span>I agree to the Terms of Service and Privacy Policy</span>
              </label>
            </div>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Continue
              </button>
              <button type="button" className="btn btn-ghost onboarding-skip" onClick={handleSkip}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* Step 2: About you (optional) */}
        {step === 2 && (
          <>
            <h1 className="onboarding-title">Tell us a bit about yourself</h1>
            <p className="onboarding-subtitle">We use this to personalize your experience.</p>
            <div className="onboarding-form">
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="onboarding-input"
              />
              <input
                type="text"
                placeholder="Last name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="onboarding-input"
              />
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="onboarding-input"
                aria-label="Country"
              >
                {COUNTRIES.map(c => (
                  <option key={c || 'blank'} value={c}>
                    {c || 'Select country'}
                  </option>
                ))}
              </select>
            </div>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Continue
              </button>
              <button type="button" className="btn btn-ghost onboarding-skip" onClick={handleSkip}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* Step 3: What brings you */}
        {step === 3 && (
          <>
            <h1 className="onboarding-title">What brings you to Planit?</h1>
            <p className="onboarding-subtitle">
              Select what matters most to you. You can choose more than one.
            </p>
            <div className="onboarding-option-list">
              {BRINGS_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  className={`onboarding-option-item ${brings.includes(opt.label) ? 'selected' : ''}`}
                  onClick={() => toggleMulti(setBrings, opt.label)}
                >
                  <span className="onboarding-option-icon" aria-hidden>{opt.icon}</span>
                  <span className="onboarding-option-text">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Continue
              </button>
              <button type="button" className="btn btn-ghost onboarding-skip" onClick={handleSkip}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* Step 4: How did you hear about us */}
        {step === 4 && (
          <>
            <h1 className="onboarding-title">How did you hear about us?</h1>
            <p className="onboarding-subtitle">Select one option.</p>
            <div className="onboarding-option-list">
              {HEAR_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  className={`onboarding-option-item ${hear === opt.label ? 'selected' : ''}`}
                  onClick={() => setHear(opt.label)}
                >
                  <span className="onboarding-option-icon" aria-hidden>{opt.icon}</span>
                  <span className="onboarding-option-text">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Continue
              </button>
              <button type="button" className="btn btn-ghost onboarding-skip" onClick={handleSkip}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* Step 5: What to include in plan */}
        {step === 5 && (
          <>
            <h1 className="onboarding-title">What else do you want in your plan?</h1>
            <p className="onboarding-subtitle">Select the categories that matter to you.</p>
            <div className="onboarding-option-list">
              {PLAN_INCLUDE_OPTIONS.map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  className={`onboarding-option-item ${planInclude.includes(opt.label) ? 'selected' : ''}`}
                  onClick={() => toggleMulti(setPlanInclude, opt.label)}
                >
                  <span className="onboarding-option-icon" aria-hidden>{opt.icon}</span>
                  <span className="onboarding-option-text">{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Continue
              </button>
              <button type="button" className="btn btn-ghost onboarding-skip" onClick={handleSkip}>
                Skip
              </button>
            </div>
          </>
        )}

        {/* Step 6: Connect bank — Add account; or Add manual account form; or Account summary */}
        {step === 6 && showManualForm && (
          <AddManualAccount
            variant="onboarding"
            onBack={() => {
              setShowManualForm(false)
              setEditingAccountId(null)
            }}
            onClose={handleSkip}
            onSubmit={(payload) => {
              if (editingAccountId) {
                dispatch({ type: 'UPDATE_ACCOUNT', payload: { id: editingAccountId, ...payload } })
                setEditingAccountId(null)
              } else {
                dispatch({ type: 'ADD_ACCOUNT', payload })
              }
              setShowManualForm(false)
              setShowAccountSummary(true)
            }}
            initialValues={
              editingAccountId
                ? accounts.find((a) => a.id === editingAccountId) || {}
                : {}
            }
            isEdit={!!editingAccountId}
          />
        )}
        {step === 6 && showAccountSummary && !showManualForm && (
          <AccountSummary
            accounts={accounts}
            onRemove={(id) => dispatch({ type: 'REMOVE_ACCOUNT', payload: id })}
            onEdit={(acc) => {
              setEditingAccountId(acc.id)
              setShowAccountSummary(false)
              setShowManualForm(true)
            }}
            onAddAnother={() => setShowManualForm(true)}
            onContinue={() => {
              setShowAccountSummary(false)
              setStep(7)
            }}
          />
        )}
        {step === 6 && !showManualForm && !showAccountSummary && (
          <div className="onboarding-add-account">
            <div className="onboarding-add-account-header">
              <h2 className="onboarding-add-account-title">Add account</h2>
              <button
                type="button"
                className="onboarding-add-account-close"
                onClick={handleSkip}
                aria-label="Skip"
              >
                ×
              </button>
            </div>
            <p className="onboarding-add-account-subtitle">
              Connect your financial institution to Planit.
            </p>
            <div className="onboarding-add-account-search-wrap">
              <input
                type="text"
                placeholder="Search all financial institutions"
                value={bankSearch}
                onChange={e => setBankSearch(e.target.value)}
                className="onboarding-add-account-search"
                aria-label="Search financial institutions"
              />
              <span className="onboarding-add-account-search-icon" aria-hidden>
                <SearchIcon />
              </span>
            </div>
            <p className="onboarding-add-account-divider">Or select from popular ones</p>
            <div className="onboarding-add-account-grid">
              {POPULAR_BANKS.filter(b =>
                bankSearch.trim() ? b.name.toLowerCase().includes(bankSearch.toLowerCase()) : true,
              ).map(bank => (
                <button
                  key={bank.name}
                  type="button"
                  className={`onboarding-add-account-card ${
                    selectedBank === bank.name ? 'selected' : ''
                  }`}
                  onClick={() =>
                    setSelectedBank(selectedBank === bank.name ? '' : bank.name)
                  }
                >
                  <BankLogo bank={bank} className="onboarding-add-account-card-logo" />
                  <span className="onboarding-add-account-card-name">{bank.name}</span>
                </button>
              ))}
            </div>
            <div className="onboarding-add-account-footer">
              <span className="onboarding-add-account-manual-label">
                Track an asset or cash account.
              </span>
              <button
                type="button"
                className="onboarding-add-account-manual-btn"
                onClick={() => setShowManualForm(true)}
              >
                ADD MANUAL ACCOUNT
              </button>
            </div>
            <div className="onboarding-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                Continue
              </button>
              <button type="button" className="btn btn-ghost onboarding-skip" onClick={handleSkip}>
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Quotes */}
        {step === 7 && (
          <>
            <div className="onboarding-all-set-block">
              <h1 className="onboarding-title onboarding-all-set-title">You're all set</h1>
              <div className="onboarding-all-set-check" aria-hidden>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
            </div>
            <p className="onboarding-quotes-heading">They love it, so will you</p>
            <div className="onboarding-testimonials">
              {TESTIMONIALS.map((t, index) => (
                <div key={index} className="onboarding-testimonial-card">
                  <div className="onboarding-testimonial-stars" aria-label="5 stars">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className="onboarding-star" aria-hidden>★</span>
                    ))}
                  </div>
                  <p className="onboarding-testimonial-quote">"{t.quote}"</p>
                  <p className="onboarding-testimonial-author">{t.author}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary onboarding-cta"
              onClick={handleNext}
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  )
}

