export function formatCurrency(n) {
  if (n == null || Number.isNaN(n)) return '$0.00'
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function formatNumber(n, decimals = 0) {
  if (n == null || Number.isNaN(n)) return '0'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
