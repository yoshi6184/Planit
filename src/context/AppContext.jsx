import { createContext, useContext, useReducer } from 'react'
import {
  CATEGORY_TYPES,
  PRESET_CATEGORIES,
  ACCOUNT_TYPES,
  MOCK_ACCOUNTS,
  MOCK_TRANSACTIONS,
  getRandomQuote,
} from '../data/mockData'

const defaultBudgets = {
  groceries: 500, transport: 200, health: 100, utilities: 150,
  dining: 200, entertainment: 100, shopping: 150, travel: 100,
  rent: 1400, insurance: 120, subscriptions: 50, phone: 80,
}

const defaultGoals = [
  { id: 'goal-1', name: 'Emergency fund', type: 'target', targetAmount: 10000, currentAmount: 4200 },
  {
    id: 'goal-2',
    name: 'Monthly savings',
    type: 'monthly',
    monthlyTarget: 500,
    monthlyAmounts: {
      '2024-03': 380, '2024-04': 520, '2024-05': 490, '2024-06': 510, '2024-07': 440, '2024-08': 560,
      '2024-09': 500, '2024-10': 470, '2024-11': 530, '2024-12': 480, '2025-01': 320, '2025-02': 550,
    },
  },
  { id: 'goal-3', name: 'Down payment for house', type: 'target', targetAmount: 50000, currentAmount: 12500 },
]

function getDefaultPlanCategoryOrder() {
  return {
    need: (PRESET_CATEGORIES.need || []).map((c) => c.id),
    want: (PRESET_CATEGORIES.want || []).map((c) => c.id),
    bills: (PRESET_CATEGORIES.bills || []).map((c) => c.id),
  }
}

const initialState = {
  hasCompletedOnboarding: false,
  monthlyIncome: 4500,
  categories: Object.values(PRESET_CATEGORIES).flat(),
  categoryBudgets: defaultBudgets,
  accounts: MOCK_ACCOUNTS,
  transactions: MOCK_TRANSACTIONS,
  quote: getRandomQuote(),
  goals: defaultGoals,
  planCategoryOrder: getDefaultPlanCategoryOrder(),
  categoryTypeOverrides: {},
  snoozedCategoryIds: [],
}

function appReducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...state, hasCompletedOnboarding: true }
    case 'SET_INCOME':
      return { ...state, monthlyIncome: action.payload }
    case 'SET_CATEGORY_BUDGET':
      return {
        ...state,
        categoryBudgets: {
          ...state.categoryBudgets,
          [action.payload.categoryId]: action.payload.amount,
        },
      }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload }
    case 'ADD_ACCOUNT':
      return {
        ...state,
        accounts: [...state.accounts, { ...action.payload, id: 'acc-' + Date.now(), balance: 0, lastReconciledAt: null }],
      }
    case 'ADD_TRANSACTION': {
      const tx = { ...action.payload, id: 't' + Date.now(), cleared: action.payload.cleared !== false }
      const amount = typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount) || 0
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        accounts: state.accounts.map((a) =>
          a.id === tx.accountId ? { ...a, balance: (a.balance || 0) + amount } : a
        ),
      }
    }
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }
    case 'IMPORT_TRANSACTIONS': {
      const newTxs = (action.payload || []).map((t) => ({ ...t, cleared: t.cleared !== false }))
      const byAccount = {}
      newTxs.forEach((t) => {
        byAccount[t.accountId] = (byAccount[t.accountId] || 0) + (t.amount || 0)
      })
      return {
        ...state,
        transactions: [...newTxs, ...state.transactions],
        accounts: state.accounts.map((a) => ({
          ...a,
          balance: (a.balance || 0) + (byAccount[a.id] || 0),
        })),
      }
    }
    case 'RECONCILE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload ? { ...a, lastReconciledAt: new Date().toISOString().slice(0, 10) } : a
        ),
      }
    case 'REFRESH_QUOTE':
      return { ...state, quote: getRandomQuote() }
    case 'ADD_GOAL':
      return {
        ...state,
        goals: [...state.goals, { ...action.payload, id: 'goal-' + Date.now() }],
      }
    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? { ...g, ...action.payload } : g
        ),
      }
    case 'REMOVE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      }
    case 'REORDER_PLAN_CATEGORY': {
      const { typeId, fromIndex, toIndex } = action.payload
      const order = state.planCategoryOrder?.[typeId] ? [...state.planCategoryOrder[typeId]] : getDefaultPlanCategoryOrder()[typeId] || []
      const [removed] = order.splice(fromIndex, 1)
      order.splice(toIndex, 0, removed)
      return {
        ...state,
        planCategoryOrder: {
          ...state.planCategoryOrder,
          [typeId]: order,
        },
      }
    }
    case 'MOVE_PLAN_CATEGORY': {
      const { categoryId, fromTypeId, toTypeId, toIndex } = action.payload
      const order = { ...state.planCategoryOrder }
      const fromList = [...(order[fromTypeId] || [])]
      const toList = fromTypeId === toTypeId ? fromList : [...(order[toTypeId] || [])]
      const fromIdx = fromList.indexOf(categoryId)
      if (fromIdx === -1) return state
      fromList.splice(fromIdx, 1)
      if (fromTypeId === toTypeId) {
        toList.splice(toIndex > fromIdx ? toIndex - 1 : toIndex, 0, categoryId)
        order[fromTypeId] = toList
      } else {
        toList.splice(toIndex, 0, categoryId)
        order[fromTypeId] = fromList
        order[toTypeId] = toList
      }
      return {
        ...state,
        planCategoryOrder: order,
        categoryTypeOverrides: {
          ...state.categoryTypeOverrides,
          [categoryId]: toTypeId,
        },
      }
    }
    case 'TOGGLE_SNOOZED_CATEGORY':
      return {
        ...state,
        snoozedCategoryIds: state.snoozedCategoryIds.includes(action.payload)
          ? state.snoozedCategoryIds.filter((id) => id !== action.payload)
          : [...state.snoozedCategoryIds, action.payload],
      }
    default:
      return state
  }
}

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { CATEGORY_TYPES, PRESET_CATEGORIES, ACCOUNT_TYPES }
