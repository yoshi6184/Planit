// Category types: need | want | bills
export const CATEGORY_TYPES = [
  { id: 'need', label: 'Need', description: 'Essentials' },
  { id: 'want', label: 'Want', description: 'Lifestyle' },
  { id: 'bills', label: 'Bills & Subscriptions', description: 'Monthly commitments' },
]

export const PRESET_CATEGORIES = {
  need: [
    { id: 'groceries', name: 'Groceries', type: 'need', emoji: '🛒' },
    { id: 'transport', name: 'Transport', type: 'need', emoji: '⛽' },
    { id: 'health', name: 'Health', type: 'need', emoji: '💊' },
    { id: 'utilities', name: 'Utilities', type: 'need', emoji: '💡' },
  ],
  want: [
    { id: 'dining', name: 'Dining Out', type: 'want', emoji: '🍽️' },
    { id: 'entertainment', name: 'Entertainment', type: 'want', emoji: '🎬' },
    { id: 'shopping', name: 'Shopping', type: 'want', emoji: '🛍️' },
    { id: 'travel', name: 'Travel', type: 'want', emoji: '✈️' },
  ],
  bills: [
    { id: 'rent', name: 'Rent / Mortgage', type: 'bills', emoji: '🏠' },
    { id: 'insurance', name: 'Insurance', type: 'bills', emoji: '🛡️' },
    { id: 'subscriptions', name: 'Subscriptions', type: 'bills', emoji: '📱' },
    { id: 'phone', name: 'Phone & Internet', type: 'bills', emoji: '📞' },
  ],
}

export function getCategoryEmoji(categoryId) {
  for (const list of Object.values(PRESET_CATEGORIES)) {
    const c = list.find((x) => x.id === categoryId)
    if (c) return c.emoji ?? '📁'
  }
  return '📁'
}

export const ACCOUNT_TYPES = [
  { id: 'checking', label: 'Debit / Checking', emoji: '💳' },
  { id: 'savings', label: 'Savings', emoji: '🏦' },
  { id: 'credit', label: 'Credit Card', emoji: '📄' },
  { id: 'tfsa', label: 'TFSA', emoji: '📈' },
  { id: 'rrsp', label: 'RRSP', emoji: '🏛️' },
  { id: 'other', label: 'Other', emoji: '📁' },
]

export function getAccountEmoji(typeId) {
  return ACCOUNT_TYPES.find((t) => t.id === typeId)?.emoji ?? '📁'
}

// balance = working balance; lastReconciledAt = date string or null
export const MOCK_ACCOUNTS = [
  { id: 'checking-1', name: 'Main Checking', type: 'checking', balance: 4520.5, lastReconciledAt: '2025-02-20' },
  { id: 'savings-1', name: 'Emergency Fund', type: 'savings', balance: 12000, lastReconciledAt: '2025-02-01' },
  { id: 'credit-1', name: 'Credit Card', type: 'credit', balance: -340, lastReconciledAt: '2025-02-15' },
  { id: 'tfsa-1', name: 'TFSA', type: 'tfsa', balance: 8500, lastReconciledAt: null },
  { id: 'rrsp-1', name: 'RRSP', type: 'rrsp', balance: 22000, lastReconciledAt: null },
]

// cleared: included in cleared balance; !cleared = uncleared
export const MOCK_TRANSACTIONS = [
  { id: 't1', date: '2025-02-20', payee: 'Whole Foods', amount: -87.32, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't2', date: '2025-02-19', payee: 'Netflix', amount: -15.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't3', date: '2025-02-18', payee: 'Shell Gas', amount: -52, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't4', date: '2025-02-17', payee: 'Salary', amount: 3200, categoryId: null, accountId: 'checking-1', cleared: true },
  { id: 't5', date: '2025-02-16', payee: 'Spotify', amount: -10.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: false },
  { id: 't6', date: '2025-02-15', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't7', date: '2025-02-14', payee: 'Coffee Shop', amount: -6.5, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  { id: 't8', date: '2025-02-13', payee: 'Electric Co', amount: -89, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't9', date: '2025-02-12', payee: 'Amazon', amount: -34.99, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't10', date: '2025-02-10', payee: 'Gym', amount: -45, categoryId: 'health', accountId: 'checking-1', cleared: true },
  // TFSA
  { id: 't11', date: '2025-02-18', payee: 'TFSA Contribution', amount: 500, categoryId: null, accountId: 'tfsa-1', cleared: true },
  { id: 't12', date: '2025-02-01', payee: 'ETF Dividend', amount: 42.50, categoryId: null, accountId: 'tfsa-1', cleared: true },
  { id: 't13', date: '2025-01-15', payee: 'TFSA Contribution', amount: 500, categoryId: null, accountId: 'tfsa-1', cleared: true },
  // RRSP
  { id: 't14', date: '2025-02-20', payee: 'RRSP Contribution', amount: 1000, categoryId: null, accountId: 'rrsp-1', cleared: true },
  { id: 't15', date: '2025-02-01', payee: 'RRSP Dividend', amount: 78.25, categoryId: null, accountId: 'rrsp-1', cleared: true },
  { id: 't16', date: '2025-01-05', payee: 'RRSP Contribution', amount: 800, categoryId: null, accountId: 'rrsp-1', cleared: true },
  // More history – spending varies month to month; Dec over budget (4500)
  { id: 't17', date: '2024-11-05', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't18', date: '2024-11-08', payee: 'Whole Foods', amount: -180, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't19', date: '2024-11-12', payee: 'Shell Gas', amount: -48, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't20', date: '2024-11-15', payee: 'Netflix', amount: -15.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't21', date: '2024-11-18', payee: 'Electric Co', amount: -92, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't22', date: '2024-11-20', payee: 'Salary', amount: 3200, categoryId: null, accountId: 'checking-1', cleared: true },
  { id: 't23', date: '2024-11-22', payee: 'Amazon', amount: -120, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't24', date: '2024-11-25', payee: 'Coffee Shop', amount: -45, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  { id: 't25', date: '2024-12-01', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't26', date: '2024-12-03', payee: 'Trader Joe\'s', amount: -220, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't27', date: '2024-12-07', payee: 'Shell Gas', amount: -55, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't28', date: '2024-12-10', payee: 'Gym', amount: -45, categoryId: 'health', accountId: 'checking-1', cleared: true },
  { id: 't29', date: '2024-12-12', payee: 'Spotify', amount: -10.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't30', date: '2024-12-15', payee: 'Salary', amount: 3200, categoryId: null, accountId: 'checking-1', cleared: true },
  { id: 't31', date: '2024-12-18', payee: 'Electric Co', amount: -78, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't32', date: '2024-12-20', payee: 'Movie Theater', amount: -32, categoryId: 'entertainment', accountId: 'checking-1', cleared: true },
  { id: 't33', date: '2024-12-23', payee: 'Restaurant', amount: -68, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  { id: 't33b', date: '2024-12-05', payee: 'Holiday Shopping', amount: -680, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't33c', date: '2024-12-10', payee: 'Travel', amount: -520, categoryId: 'travel', accountId: 'checking-1', cleared: true },
  { id: 't33d', date: '2024-12-14', payee: 'Furniture', amount: -450, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't33e', date: '2024-12-22', payee: 'Dining Out', amount: -185, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  { id: 't34', date: '2025-01-02', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't35', date: '2025-01-05', payee: 'Whole Foods', amount: -134.80, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't36', date: '2025-01-08', payee: 'Shell Gas', amount: -62, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't37', date: '2025-01-10', payee: 'Phone Bill', amount: -75, categoryId: 'phone', accountId: 'checking-1', cleared: true },
  { id: 't38', date: '2025-01-12', payee: 'Netflix', amount: -15.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't39', date: '2025-01-15', payee: 'Salary', amount: 3200, categoryId: null, accountId: 'checking-1', cleared: true },
  { id: 't40', date: '2025-01-18', payee: 'Electric Co', amount: -105, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't41', date: '2025-01-20', payee: 'Insurance', amount: -120, categoryId: 'insurance', accountId: 'checking-1', cleared: true },
  { id: 't42', date: '2025-01-22', payee: 'Amazon', amount: -89.99, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't43', date: '2025-01-25', payee: 'Coffee Shop', amount: -18, categoryId: 'dining', accountId: 'checking-1', cleared: true },
]

// Subscriptions for Reports > Subscription Tracker: name, price per month, next billed date, icon, frequency, active
export const MOCK_SUBSCRIPTIONS = [
  { id: 'sub-1', name: 'Netflix', pricePerMonth: 15.99, nextBilled: '2025-03-19', icon: '🎬', frequency: 'Monthly', active: true },
  { id: 'sub-2', name: 'Spotify', pricePerMonth: 10.99, nextBilled: '2025-03-16', icon: '🎵', frequency: 'Monthly', active: true },
  { id: 'sub-3', name: 'Disney+', pricePerMonth: 13.99, nextBilled: '2025-03-08', icon: '🏰', frequency: 'Monthly', active: true },
  { id: 'sub-4', name: 'Gym', pricePerMonth: 45, nextBilled: '2025-03-10', icon: '💪', frequency: 'Monthly', active: true },
  { id: 'sub-5', name: 'Amazon Prime', pricePerMonth: 14.99, nextBilled: '2025-03-12', icon: '📦', frequency: 'Monthly', active: true },
  { id: 'sub-6', name: 'iCloud Storage', pricePerMonth: 2.99, nextBilled: '2025-03-15', icon: '☁️', frequency: 'Monthly', active: true },
  { id: 'sub-7', name: 'Adobe Creative Cloud', pricePerMonth: 54.99, nextBilled: '2025-03-05', icon: '🎨', frequency: 'Monthly', active: false },
]

export const BUDGET_QUOTES = [
  { text: 'A budget is telling your money where to go instead of wondering where it went.', author: 'Dave Ramsey' },
  { text: 'Do not save what is left after spending; spend what is left after saving.', author: 'Warren Buffett' },
  { text: "The goal isn't more money. The goal is a life you don't need to escape from.", author: 'Unknown' },
  { text: 'Every dollar has a job. Give yours a purpose.', author: 'YNAB' },
  { text: 'Small steps lead to big changes in your financial life.', author: 'Unknown' },
]

export function getRandomQuote() {
  return BUDGET_QUOTES[Math.floor(Math.random() * BUDGET_QUOTES.length)]
}
