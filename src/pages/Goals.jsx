import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import { DEFAULT_DEBT_BY_MONTH } from '../data/mockData'

const GOAL_TYPES = [
  { id: 'target', label: 'Target amount (e.g. emergency fund, down payment)' },
  { id: 'monthly', label: 'Monthly savings goal' },
]

function getLast12Months() {
  const out = []
  const d = new Date()
  for (let i = 11; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(m.toISOString().slice(0, 7))
  }
  return out
}

export default function Goals() {
  const { state, dispatch } = useApp()
  const { goals } = state
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    type: 'target',
    targetAmount: '',
    currentAmount: '',
    monthlyTarget: '',
    monthlyAmounts: {},
  })

  const months = useMemo(() => getLast12Months(), [])

  const debtChartData = useMemo(() => {
    const entries = Object.entries(DEFAULT_DEBT_BY_MONTH || {}).sort(([a], [b]) => (a < b ? -1 : 1))
    return entries.map(([month, v]) => ({
      month,
      'Credit card': v.creditCard ?? 0,
      'Mortgage': v.mortgage ?? 0,
      'Student loans': v.studentLoans ?? 0,
    }))
  }, [])

  const formatWholeCurrency = (n) => '$' + Math.round(n || 0).toLocaleString('en-US')

  const emergencyFundGoal = useMemo(() => goals.find((g) => g.name === 'Emergency fund'), [goals])
  const otherGoals = useMemo(() => goals.filter((g) => g.name !== 'Emergency fund'), [goals])

  const resetForm = () => {
    setForm({
      name: '',
      type: 'target',
      targetAmount: '',
      currentAmount: '',
      monthlyTarget: '',
      monthlyAmounts: {},
    })
    setShowAdd(false)
    setEditingId(null)
  }

  const handleAdd = () => {
    setShowAdd(true)
    setEditingId(null)
    setForm({ name: '', type: 'target', targetAmount: '', currentAmount: '', monthlyTarget: '', monthlyAmounts: {} })
  }

  const handleEdit = (goal) => {
    setEditingId(goal.id)
    setShowAdd(false)
    setForm({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount ?? '',
      currentAmount: goal.currentAmount ?? '',
      monthlyTarget: goal.monthlyTarget ?? '',
      monthlyAmounts: goal.monthlyAmounts ?? {},
    })
  }

  const handleSaveNew = () => {
    const name = (form.name || '').trim()
    if (!name) return
    if (form.type === 'target') {
      const targetAmount = parseFloat(form.targetAmount) || 0
      const currentAmount = parseFloat(form.currentAmount) || 0
      dispatch({
        type: 'ADD_GOAL',
        payload: { name, type: 'target', targetAmount, currentAmount },
      })
    } else {
      const monthlyTarget = parseFloat(form.monthlyTarget) || 0
      dispatch({
        type: 'ADD_GOAL',
        payload: { name, type: 'monthly', monthlyTarget, monthlyAmounts: form.monthlyAmounts || {} },
      })
    }
    resetForm()
  }

  const handleSaveEdit = () => {
    const name = (form.name || '').trim()
    if (!name || !editingId) return
    if (form.type === 'target') {
      const targetAmount = parseFloat(form.targetAmount) || 0
      const currentAmount = parseFloat(form.currentAmount) || 0
      dispatch({
        type: 'UPDATE_GOAL',
        payload: { id: editingId, name, type: 'target', targetAmount, currentAmount },
      })
    } else {
      const monthlyTarget = parseFloat(form.monthlyTarget) || 0
      dispatch({
        type: 'UPDATE_GOAL',
        payload: { id: editingId, name, type: 'monthly', monthlyTarget, monthlyAmounts: form.monthlyAmounts || {} },
      })
    }
    resetForm()
  }

  const handleRemove = (id) => {
    if (window.confirm('Remove this goal?')) dispatch({ type: 'REMOVE_GOAL', payload: id })
  }

  return (
    <div className="goals-page">
      <div className="goals-header">
        <h1 className="goals-title">Goals</h1>
        <button type="button" className="btn btn-primary" onClick={handleAdd}>
          Add goal
        </button>
      </div>

      {showAdd && (
        <div className="goals-form-card card">
          <h3 className="goals-form-title">New goal</h3>
          <div className="goals-form-row">
            <label>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Emergency fund"
              className="goals-input"
            />
          </div>
          <div className="goals-form-row">
            <label>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="goals-input"
            >
              {GOAL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          {form.type === 'target' && (
            <>
              <div className="goals-form-row">
                <label>Target amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  className="goals-input"
                />
              </div>
              <div className="goals-form-row">
                <label>Current amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.currentAmount}
                  onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                  className="goals-input"
                />
              </div>
            </>
          )}
          {form.type === 'monthly' && (
            <div className="goals-form-row">
              <label>Monthly goal ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.monthlyTarget}
                onChange={(e) => setForm((f) => ({ ...f, monthlyTarget: e.target.value }))}
                className="goals-input"
              />
            </div>
          )}
          <div className="goals-form-actions">
            <button type="button" className="btn btn-primary" onClick={handleSaveNew}>Save</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {editingId && (
        <div className="goals-form-card card">
          <h3 className="goals-form-title">Edit goal</h3>
          <div className="goals-form-row">
            <label>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="goals-input"
            />
          </div>
          <div className="goals-form-row">
            <label>Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="goals-input"
            >
              {GOAL_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          {form.type === 'target' && (
            <>
              <div className="goals-form-row">
                <label>Target amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  className="goals-input"
                />
              </div>
              <div className="goals-form-row">
                <label>Current amount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.currentAmount}
                  onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                  className="goals-input"
                />
              </div>
            </>
          )}
          {form.type === 'monthly' && (
            <div className="goals-form-row">
              <label>Monthly goal ($)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.monthlyTarget}
                onChange={(e) => setForm((f) => ({ ...f, monthlyTarget: e.target.value }))}
                className="goals-input"
              />
            </div>
          )}
          <div className="goals-form-actions">
            <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
            <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </div>
      )}

      {emergencyFundGoal && (
        <div className="goals-list">
          <div key={emergencyFundGoal.id} className="goals-card card">
            <div className="goals-card-header">
              <h3 className="goals-card-title">{emergencyFundGoal.name}</h3>
              <div className="goals-card-actions">
                <button type="button" className="goals-btn-icon" onClick={() => handleEdit(emergencyFundGoal)} title="Edit">✏️</button>
                <button type="button" className="goals-btn-icon" onClick={() => handleRemove(emergencyFundGoal.id)} title="Remove">🗑️</button>
              </div>
            </div>
            {emergencyFundGoal.type === 'target' && (
              <div className="goals-target-wrap">
                <div className="goals-target-bar">
                  <div
                    className="goals-target-fill"
                    style={{
                      width: `${emergencyFundGoal.targetAmount > 0 ? Math.min(100, (emergencyFundGoal.currentAmount / emergencyFundGoal.targetAmount) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="goals-target-label">
                  {formatCurrency(emergencyFundGoal.currentAmount ?? 0)} of {formatCurrency(emergencyFundGoal.targetAmount ?? 0)}
                </p>
              </div>
            )}
            {emergencyFundGoal.type === 'monthly' && (
              <div className="goals-monthly-wrap">
                <div className="goals-monthly-bars">
                  {months.map((ym) => {
                    const amount = emergencyFundGoal.monthlyAmounts?.[ym] ?? 0
                    const target = emergencyFundGoal.monthlyTarget ?? 0
                    const met = target > 0 && amount >= target
                    const maxVal = Math.max(...months.map((m) => emergencyFundGoal.monthlyAmounts?.[m] ?? 0), target, 1)
                    const heightPct = maxVal > 0 ? (amount / maxVal) * 100 : 0
                    const goalLinePct = maxVal > 0 ? (target / maxVal) * 100 : 0
                    const label = new Date(ym + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    return (
                      <div key={ym} className="goals-monthly-bar-cell">
                        <div className="goals-monthly-bar-wrap">
                          <div
                            className={`goals-monthly-bar ${met ? 'goals-monthly-bar-met' : ''}`}
                            style={{ height: `${heightPct}%` }}
                          />
                          {target > 0 && (
                            <div
                              className="goals-monthly-goal-line"
                              style={{ bottom: `${goalLinePct}%` }}
                              title={`Goal: ${formatCurrency(target)}`}
                            />
                          )}
                        </div>
                        <span className="goals-monthly-label">{label}</span>
                        <span className="goals-monthly-amount">{formatCurrency(amount)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="goals-monthly-legend">
                  Monthly goal: {formatCurrency(emergencyFundGoal.monthlyTarget ?? 0)} — green = met, grey = not met
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {debtChartData.length > 0 && (
        <div className="goals-debt-card card">
          <h2 className="goals-card-title">Debt over time</h2>
          <p className="goals-debt-subtitle">Stacked bars by month. Hover for amounts.</p>
          <div className="goals-debt-chart-wrap">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={debtChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%">
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => {
                    const d = new Date(val + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatWholeCurrency(v)} />
                <Tooltip
                  formatter={(v) => [formatWholeCurrency(v)]}
                  labelFormatter={(label) => {
                    const d = new Date(label + '-01')
                    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  }}
                />
                <Bar dataKey="Credit card" stackId="debt" fill="var(--debt-credit)" name="Credit card" />
                <Bar dataKey="Mortgage" stackId="debt" fill="var(--debt-mortgage)" name="Mortgage" />
                <Bar dataKey="Student loans" stackId="debt" fill="var(--debt-student)" name="Student loans" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="goals-debt-legend">
            <span className="goals-debt-legend-item">
              <span className="goals-debt-legend-swatch" style={{ background: 'var(--debt-credit)' }} />
              Credit card
            </span>
            <span className="goals-debt-legend-item">
              <span className="goals-debt-legend-swatch" style={{ background: 'var(--debt-mortgage)' }} />
              Mortgage
            </span>
            <span className="goals-debt-legend-item">
              <span className="goals-debt-legend-swatch" style={{ background: 'var(--debt-student)' }} />
              Student loans
            </span>
          </div>
        </div>
      )}

      <div className="goals-list">
        {otherGoals.map((goal) => (
          <div key={goal.id} className="goals-card card">
            <div className="goals-card-header">
              <h3 className="goals-card-title">{goal.name}</h3>
              <div className="goals-card-actions">
                <button type="button" className="goals-btn-icon" onClick={() => handleEdit(goal)} title="Edit">✏️</button>
                <button type="button" className="goals-btn-icon" onClick={() => handleRemove(goal.id)} title="Remove">🗑️</button>
              </div>
            </div>

            {goal.type === 'target' && (
              <div className="goals-target-wrap">
                <div className="goals-target-bar">
                  <div
                    className="goals-target-fill"
                    style={{
                      width: `${goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0}%`,
                    }}
                  />
                </div>
                <p className="goals-target-label">
                  {formatCurrency(goal.currentAmount ?? 0)} of {formatCurrency(goal.targetAmount ?? 0)}
                </p>
              </div>
            )}

            {goal.type === 'monthly' && (
              <div className="goals-monthly-wrap">
                <div className="goals-monthly-bars">
                  {months.map((ym) => {
                    const amount = goal.monthlyAmounts?.[ym] ?? 0
                    const target = goal.monthlyTarget ?? 0
                    const met = target > 0 && amount >= target
                    const maxVal = Math.max(...months.map((m) => goal.monthlyAmounts?.[m] ?? 0), target, 1)
                    const heightPct = maxVal > 0 ? (amount / maxVal) * 100 : 0
                    const goalLinePct = maxVal > 0 ? (target / maxVal) * 100 : 0
                    const label = new Date(ym + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    return (
                      <div key={ym} className="goals-monthly-bar-cell">
                        <div className="goals-monthly-bar-wrap">
                          <div
                            className={`goals-monthly-bar ${met ? 'goals-monthly-bar-met' : ''}`}
                            style={{ height: `${heightPct}%` }}
                          />
                          {target > 0 && (
                            <div
                              className="goals-monthly-goal-line"
                              style={{ bottom: `${goalLinePct}%` }}
                              title={`Goal: ${formatCurrency(target)}`}
                            />
                          )}
                        </div>
                        <span className="goals-monthly-label">{label}</span>
                        <span className="goals-monthly-amount">{formatCurrency(amount)}</span>
                      </div>
                    )
                  })}
                </div>
                <p className="goals-monthly-legend">
                  Monthly goal: {formatCurrency(goal.monthlyTarget ?? 0)} — green = met, grey = not met
                </p>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}
