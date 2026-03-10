import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import SignIn from './pages/SignIn'
import Plan from './pages/Plan'
import Dashboard from './pages/Dashboard'
import TransactionsSummary from './pages/TransactionsSummary'
import AccountPage from './pages/AccountPage'
import Reports from './pages/Reports'
import Tasks from './pages/Tasks'

export default function App() {
  const { state } = useApp()

  if (!state.hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<TransactionsSummary />} />
        <Route path="/transactions/accounts/:accountId" element={<AccountPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}
