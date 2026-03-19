export function formatCurrency(n) {
  if (n == null || Number.isNaN(n)) return '$0.00'
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatNumber(n, decimals = 0) {
  if (n == null || Number.isNaN(n)) return '0'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** Stable last-4 "account number" from account (uses last4 if set, else derived from id) */
export function getAccountLast4(account) {
  if (account?.last4 != null) return String(account.last4).slice(-4)
  const id = account?.id ?? ''
  let n = 0
  for (let i = 0; i < id.length; i++) n = ((n << 5) - n) + id.charCodeAt(i)
  return String(Math.abs(n) % 10000).padStart(4, '0')
}

/** Middle dot for masked account number (vertically centered, not baseline period) */
const MASK_DOT = '\u00B7' // · middle dot

/** Account display title with masked number e.g. "Main Checking ··9876" */
export function getAccountDisplayName(account) {
  if (!account?.name) return '—'
  const last4 = getAccountLast4(account)
  return `${account.name} ${MASK_DOT}${MASK_DOT}${last4}`
}
