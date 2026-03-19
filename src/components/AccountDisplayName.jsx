import { getAccountLast4 } from '../utils/format'

const MASK_DOT = '\u00B7' // · middle dot, vertically centered

export default function AccountDisplayName({ account, className }) {
  if (!account?.name) return <>—</>
  const last4 = getAccountLast4(account)
  return (
    <span className={className ? `account-display-name ${className}` : 'account-display-name'}>
      {account.name}{' '}
      <span className="account-mask">
        <span className="account-mask-dot" aria-hidden>{MASK_DOT}</span>
        <span className="account-mask-dot" aria-hidden>{MASK_DOT}</span>
        <span className="account-mask-digits">{last4}</span>
      </span>
    </span>
  )
}
