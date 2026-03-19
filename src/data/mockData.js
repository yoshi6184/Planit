// Category types: need | want | bills
export const CATEGORY_TYPES = [
  { id: 'bills', label: 'Bills', description: 'Monthly commitments' },
  { id: 'need', label: 'Need', description: 'Essentials' },
  { id: 'want', label: 'Want', description: 'Lifestyle' },
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
    { id: 'dream-vacation', name: 'Dream Vacation', type: 'want', emoji: '🏝️' },
    { id: 'emergency-fund', name: 'Emergency Fund', type: 'want', emoji: '🚨' },
    { id: 'house-goal', name: 'House', type: 'want', emoji: '🏡' },
    { id: 'forgotten-stuff', name: 'Stuff I forgot to plan for', type: 'want', emoji: '🧾' },
  ],
  bills: [
    { id: 'rent', name: 'Rent / Mortgage', type: 'bills', emoji: '🏠' },
    { id: 'insurance', name: 'Insurance', type: 'bills', emoji: '🛡️' },
    { id: 'subscriptions', name: 'Subscriptions', type: 'bills', emoji: '📱' },
    { id: 'phone', name: 'Phone & Internet', type: 'bills', emoji: '📞' },
  ],
  system: [
    { id: 'starting-balance', name: 'Starting balance', type: 'system', emoji: '⚙️' },
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

// balance = working balance; lastReconciledAt = date string or null (negative = liability/debt)
export const MOCK_ACCOUNTS = [
  { id: 'checking-1', name: 'Main Checking', type: 'checking', balance: 4520.5, lastReconciledAt: '2025-02-20' },
  { id: 'savings-1', name: 'Emergency Fund', type: 'savings', balance: 12000, lastReconciledAt: '2025-02-01' },
  { id: 'credit-1', name: 'Credit Card', type: 'credit', balance: -340, lastReconciledAt: '2025-02-15' },
  { id: 'student-loans-1', name: 'Student Loans', type: 'other', balance: -36500, lastReconciledAt: '2025-02-01' },
  { id: 'tfsa-1', name: 'TFSA', type: 'tfsa', balance: 108500, lastReconciledAt: null },
]

/** Map debt account id -> debt category key for Goals debt chart */
export const DEBT_ACCOUNT_TO_CATEGORY = {
  'credit-1': 'creditCard',
  'student-loans-1': 'studentLoans',
}

/** Starting debt balance (owed) at beginning of 2024-03 for computing debt-by-month from transactions */
const DEBT_START_BALANCES_2024_03 = {
  'credit-1': 2400,
  'student-loans-1': 42000,
}

/** Credit card debt by month (static – not derived from transactions to avoid changing credit account balance) */
const STATIC_CREDIT_DEBT_BY_MONTH = {
  '2024-03': 2400, '2024-04': 2100, '2024-05': 1800, '2024-06': 1500, '2024-07': 1200,
  '2024-08': 900, '2024-09': 600, '2024-10': 300, '2024-11': 0, '2024-12': 0,
  '2025-01': 0, '2025-02': 0,
}

const DEBT_MONTHS = ['2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02']

/** Default debt-by-month for Pay off debt goal (credit card, student loans) */
export const DEFAULT_DEBT_BY_MONTH = {
  '2024-03': { creditCard: 1200, studentLoans: 6000 },
  '2024-04': { creditCard: 1050, studentLoans: 5850 },
  '2024-05': { creditCard: 900, studentLoans: 5700 },
  '2024-06': { creditCard: 750, studentLoans: 5550 },
  '2024-07': { creditCard: 600, studentLoans: 5400 },
  '2024-08': { creditCard: 450, studentLoans: 5250 },
  '2024-09': { creditCard: 300, studentLoans: 5100 },
  '2024-10': { creditCard: 150, studentLoans: 4950 },
  '2024-11': { creditCard: 0, studentLoans: 4800 },
  '2024-12': { creditCard: 0, studentLoans: 4650 },
  '2025-01': { creditCard: 0, studentLoans: 4500 },
  '2025-02': { creditCard: 0, studentLoans: 4350 },
}

/**
 * Build debt-by-month for the Goals debt chart from transactions.
 * Uses mortgage and student loan payment transactions; credit card uses static curve.
 */
export function computeDebtByMonthFromTransactions(transactions) {
  const byAccount = {}
  Object.keys(DEBT_ACCOUNT_TO_CATEGORY).forEach((accId) => {
    byAccount[accId] = { start: DEBT_START_BALANCES_2024_03[accId] ?? 0, payments: [] }
  })
  transactions
    .filter((t) => t.accountId && DEBT_ACCOUNT_TO_CATEGORY[t.accountId] && (t.amount > 0))
    .forEach((t) => {
      if (!byAccount[t.accountId]) return
      byAccount[t.accountId].payments.push({ date: t.date, amount: t.amount })
    })
  Object.keys(byAccount).forEach((accId) => {
    byAccount[accId].payments.sort((a, b) => a.date.localeCompare(b.date))
  })

  const debtByMonth = {}
  DEBT_MONTHS.forEach((ym) => {
    const [y, m] = ym.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const end = `${ym}-${String(lastDay).padStart(2, '0')}`
    const creditCard = STATIC_CREDIT_DEBT_BY_MONTH[ym] ?? 0
    let studentLoans = DEBT_START_BALANCES_2024_03['student-loans-1'] ?? 0
    const list = byAccount['student-loans-1']?.payments ?? []
    const sum = list.filter((p) => p.date <= end).reduce((s, p) => s + p.amount, 0)
    const start = DEBT_START_BALANCES_2024_03['student-loans-1'] ?? 0
    studentLoans = Math.max(0, start - sum)
    debtByMonth[ym] = { creditCard, studentLoans }
  })
  return debtByMonth
}

// cleared: included in cleared balance; !cleared = uncleared
export const MOCK_TRANSACTIONS = [
  // 10 most recent: action required (uncategorized, not approved), outflow, Main Checking — appear first in list
  { id: 'new1', date: '2025-02-28', payee: 'Walmart', amount: -24.50, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new2', date: '2025-02-27', payee: 'Starbucks', amount: -6.75, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new3', date: '2025-02-26', payee: 'Shoppers Drug Mart', amount: -42.00, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new4', date: '2025-02-25', payee: 'Petro Canada', amount: -55.00, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new5', date: '2025-02-24', payee: "McDonald's", amount: -38.20, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new6', date: '2025-02-23', payee: 'Best Buy', amount: -89.99, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new7', date: '2025-02-22', payee: 'Real Canadian Superstore', amount: -67.30, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new8', date: '2025-02-21', payee: 'Netflix', amount: -12.99, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new9', date: '2025-02-21', payee: 'City Parking', amount: -15.00, categoryId: null, accountId: 'checking-1', cleared: false },
  { id: 'new10', date: '2025-02-20', payee: 'Home Depot', amount: -33.00, categoryId: null, accountId: 'checking-1', cleared: false },
  // 2025-02: ~2500 (slight rebound after Jan)
  { id: 't1', date: '2025-02-20', payee: 'Whole Foods', amount: -400, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't2', date: '2025-02-19', payee: 'Netflix', amount: -15.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't3', date: '2025-02-18', payee: 'Petro Canada', amount: -140, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't4', date: '2025-02-17', payee: 'Salary', amount: 3200, categoryId: 'starting-balance', accountId: 'checking-1', cleared: true },
  { id: 't5', date: '2025-02-16', payee: 'Spotify', amount: -10.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: false },
  { id: 't6', date: '2025-02-15', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't7', date: '2025-02-14', payee: 'Starbucks', amount: -255, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  { id: 't8', date: '2025-02-13', payee: 'Hydro One', amount: -117, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't9', date: '2025-02-12', payee: 'Amazon', amount: -118, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't10', date: '2025-02-10', payee: 'GoodLife Fitness', amount: -70, categoryId: 'health', accountId: 'checking-1', cleared: true },
  // TFSA
  { id: 't11', date: '2025-02-18', payee: 'TFSA Contribution', amount: 500, categoryId: 'starting-balance', accountId: 'tfsa-1', cleared: true },
  { id: 't12', date: '2025-02-01', payee: 'ETF Dividend', amount: 42.50, categoryId: 'starting-balance', accountId: 'tfsa-1', cleared: true },
  { id: 't13', date: '2025-01-15', payee: 'TFSA Contribution', amount: 500, categoryId: 'starting-balance', accountId: 'tfsa-1', cleared: true },
  // More history – spending varies month to month for meaningful "spending over time" chart (up and down)
  // 2024-09: lighter month (~1950)
  { id: 'ts1', date: '2024-09-01', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 'ts2', date: '2024-09-05', payee: 'Electric Co', amount: -100, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 'ts3', date: '2024-09-08', payee: 'Trader Joe\'s', amount: -200, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 'ts4', date: '2024-09-12', payee: 'Shell Gas', amount: -100, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 'ts5', date: '2024-09-15', payee: 'Netflix', amount: -15.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 'ts6', date: '2024-09-15', payee: 'Salary', amount: 3200, categoryId: 'starting-balance', accountId: 'checking-1', cleared: true },
  { id: 'ts7', date: '2024-09-18', payee: 'Spotify', amount: -10.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 'ts8', date: '2024-09-22', payee: 'Coffee Shop', amount: -124, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  // 2024-10: moderate month (~2400)
  { id: 'to1', date: '2024-10-01', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 'to2', date: '2024-10-05', payee: 'Whole Foods', amount: -300, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 'to3', date: '2024-10-08', payee: 'Shell Gas', amount: -120, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 'to4', date: '2024-10-12', payee: 'Electric Co', amount: -110, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 'to5', date: '2024-10-15', payee: 'Salary', amount: 3200, categoryId: 'starting-balance', accountId: 'checking-1', cleared: true },
  { id: 'to6', date: '2024-10-18', payee: 'Restaurant', amount: -200, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  { id: 'to7', date: '2024-10-20', payee: 'Amazon', amount: -150, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 'to8', date: '2024-10-25', payee: 'Gym', amount: -120, categoryId: 'health', accountId: 'checking-1', cleared: true },
  // 2024-11: higher (~2650)
  { id: 't17', date: '2024-11-05', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't18', date: '2024-11-08', payee: 'Whole Foods', amount: -320, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't19', date: '2024-11-12', payee: 'Shell Gas', amount: -130, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't20', date: '2024-11-15', payee: 'Netflix', amount: -15.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't21', date: '2024-11-18', payee: 'Electric Co', amount: -115, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't22', date: '2024-11-20', payee: 'Salary', amount: 3200, categoryId: 'starting-balance', accountId: 'checking-1', cleared: true },
  { id: 't23', date: '2024-11-22', payee: 'Amazon', amount: -220, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't24', date: '2024-11-25', payee: 'Coffee Shop', amount: -232, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  // 2024-12: peak month – holiday spending (~3100)
  { id: 't25', date: '2024-12-01', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't26', date: '2024-12-03', payee: 'Trader Joe\'s', amount: -320, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't27', date: '2024-12-07', payee: 'Shell Gas', amount: -100, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't28', date: '2024-12-10', payee: 'Gym', amount: -50, categoryId: 'health', accountId: 'checking-1', cleared: true },
  { id: 't29', date: '2024-12-12', payee: 'Spotify', amount: -10.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't30', date: '2024-12-15', payee: 'Salary', amount: 3200, categoryId: 'starting-balance', accountId: 'checking-1', cleared: true },
  { id: 't31', date: '2024-12-18', payee: 'Electric Co', amount: -100, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't32', date: '2024-12-20', payee: 'Movie Theater', amount: -45, categoryId: 'entertainment', accountId: 'checking-1', cleared: true },
  { id: 't33', date: '2024-12-23', payee: 'Restaurant', amount: -180, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  { id: 't33b', date: '2024-12-05', payee: 'Holiday Gifts', amount: -650, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't33c', date: '2024-12-10', payee: 'Travel', amount: -100, categoryId: 'travel', accountId: 'checking-1', cleared: true },
  { id: 't33d', date: '2024-12-14', payee: 'Furniture', amount: -50, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't33e', date: '2024-12-22', payee: 'Dining Out', amount: -95, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  // 2025-01: tighter month after holidays (~2100)
  { id: 't34', date: '2025-01-02', payee: 'Rent', amount: -1400, categoryId: 'rent', accountId: 'checking-1', cleared: true },
  { id: 't35', date: '2025-01-05', payee: 'Whole Foods', amount: -180, categoryId: 'groceries', accountId: 'checking-1', cleared: true },
  { id: 't36', date: '2025-01-08', payee: 'Shell Gas', amount: -100, categoryId: 'transport', accountId: 'checking-1', cleared: true },
  { id: 't37', date: '2025-01-10', payee: 'Phone Bill', amount: -75, categoryId: 'phone', accountId: 'checking-1', cleared: true },
  { id: 't38', date: '2025-01-12', payee: 'Netflix', amount: -15.99, categoryId: 'subscriptions', accountId: 'checking-1', cleared: true },
  { id: 't39', date: '2025-01-15', payee: 'Salary', amount: 3200, categoryId: 'starting-balance', accountId: 'checking-1', cleared: true },
  { id: 't40', date: '2025-01-18', payee: 'Electric Co', amount: -117, categoryId: 'utilities', accountId: 'checking-1', cleared: true },
  { id: 't41', date: '2025-01-20', payee: 'Insurance', amount: -95, categoryId: 'insurance', accountId: 'checking-1', cleared: true },
  { id: 't42', date: '2025-01-22', payee: 'Amazon', amount: -27, categoryId: 'shopping', accountId: 'credit-1', cleared: true },
  { id: 't43', date: '2025-01-25', payee: 'Coffee Shop', amount: -106, categoryId: 'dining', accountId: 'checking-1', cleared: true },
  // Student loan payments (500/mo; no payment Dec 2024)
  { id: 'td20', date: '2024-03-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td21', date: '2024-04-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td22', date: '2024-05-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td23', date: '2024-06-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td24', date: '2024-07-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td25', date: '2024-08-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td26', date: '2024-09-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td27', date: '2024-10-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td28', date: '2024-11-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td29', date: '2025-01-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
  { id: 'td30', date: '2025-02-05', payee: 'Student loan payment', amount: 500, categoryId: 'starting-balance', accountId: 'student-loans-1', cleared: true },
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
