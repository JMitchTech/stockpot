import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import HealthScore from '../components/HealthScore'
import MarginBadge from '../components/MarginBadge'
import api from '../api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isNewUser, setIsNewUser] = useState(false)

  useEffect(() => {
    api.get('/dashboard/')
      .then(res => {
        setData(res.data)
        const newUser =
          res.data.menu.total_active_items === 0 &&
          res.data.waste.total_cost === 0 &&
          res.data.purchasing.item_count === 0
        setIsNewUser(newUser)
        if (newUser) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('open-nonna-onboarding'))
          }, 1000)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64" style={{ color: '#6B4F3A' }}>
        Loading your kitchen...
      </div>
    </Layout>
  )

  if (!data) return (
    <Layout>
      <div className="p-6" style={{ color: '#C0392B' }}>Failed to load dashboard.</div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>
              {data.restaurant_name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
              Good {getTimeOfDay()} — here's how your kitchen looks today.
            </p>
          </div>
          <HealthScore
            score={data.health_score.score}
            indicator={data.health_score.indicator}
          />
        </div>

        {/* Setup checklist for new users */}
        {isNewUser && <SetupChecklist data={data} />}

        {/* Alerts */}
        {data.alerts.count > 0 && (
          <div className="space-y-2">
            {data.alerts.items.map((alert, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2"
                style={{
                  backgroundColor:
                    alert.severity === 'danger' ? '#FEF2F2' :
                    alert.severity === 'warning' ? '#FFFBEB' : '#EFF6FF',
                  color:
                    alert.severity === 'danger' ? '#B91C1C' :
                    alert.severity === 'warning' ? '#92400E' : '#1E40AF',
                  border: `1px solid ${
                    alert.severity === 'danger' ? '#FECACA' :
                    alert.severity === 'warning' ? '#FDE68A' : '#BFDBFE'
                  }`
                }}
              >
                <span className="mt-0.5">
                  {alert.severity === 'danger' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'}
                </span>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            label="Food Cost"
            value={`${data.food_cost.overall_pct}%`}
            sub={`Target: ${data.food_cost.target_pct}%`}
            status={data.food_cost.status === 'on_target' ? 'good' : 'bad'}
          />
          <StatCard
            label="Total Waste Cost"
            value={`$${data.waste.total_cost}`}
            sub={data.waste.top_wasted[0]
              ? `Top: ${data.waste.top_wasted[0].name}`
              : 'No waste logged'}
            status={data.waste.total_cost > 50 ? 'bad' : 'good'}
          />
          <StatCard
            label="Items to Order"
            value={data.purchasing.item_count}
            sub={`Est. $${data.purchasing.total_estimated_cost}`}
            status={data.purchasing.item_count > 0 ? 'warn' : 'good'}
          />
        </div>

        {/* Menu health + Purchasing */}
        <div className="grid grid-cols-2 gap-4">

          {/* Menu health */}
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>Menu Health</h2>
            <div className="space-y-2">
              {[...data.menu.green_items, ...data.menu.yellow_items, ...data.menu.red_items].map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span style={{ color: '#3D2B1F' }}>{item.name}</span>
                  <MarginBadge pct={item.margin} />
                </div>
              ))}
              {data.menu.total_active_items === 0 && (
                <p className="text-sm" style={{ color: '#6B4F3A' }}>
                  No menu items yet. Add your first dish to see margins.
                </p>
              )}
            </div>
          </div>

          {/* Purchasing */}
          <div
            className="rounded-2xl p-5 shadow-sm"
            style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>Order This Week</h2>
            {data.purchasing.upcoming_events.length > 0 && (
              <div
                className="text-xs px-3 py-1.5 rounded-lg mb-3"
                style={{ backgroundColor: '#EBF5FB', color: '#1B2A4A' }}
              >
                {data.purchasing.upcoming_events[0].name} in {data.purchasing.upcoming_events[0].days_until} days — buffers applied
              </div>
            )}
            <div className="space-y-2">
              {data.purchasing.top_items.map(item => (
                <div key={item.ingredient_name} className="flex items-center justify-between text-sm">
                  <span style={{ color: '#3D2B1F' }}>{item.ingredient_name}</span>
                  <span style={{ color: '#6B4F3A' }}>
                    {item.recommended_order_quantity} {item.unit} — ${item.estimated_cost}
                  </span>
                </div>
              ))}
              {data.purchasing.item_count === 0 && (
                <p className="text-sm" style={{ color: '#6B4F3A' }}>Stock levels are good.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  )
}

function StatCard({ label, value, sub, status }) {
  const borderColor =
    status === 'good' ? '#6EE7B7' :
    status === 'bad' ? '#FECACA' : '#FDE68A'

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ backgroundColor: '#FEFAF4', border: `1px solid ${borderColor}` }}
    >
      <p
        className="text-xs font-medium uppercase tracking-wide mb-1"
        style={{ color: '#6B4F3A' }}
      >
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: '#6B4F3A' }}>{sub}</p>
    </div>
  )
}

function SetupChecklist({ data }) {
  const steps = [
    {
      label: 'Add your first ingredient',
      done: data.purchasing.item_count > 0 ||
            data.waste.total_cost > 0 ||
            data.menu.total_active_items > 0
    },
    {
      label: 'Add your first menu item',
      done: data.menu.total_active_items > 0
    },
    {
      label: 'Log your first waste entry',
      done: data.waste.total_cost > 0
    },
    {
      label: 'Review your purchasing forecast',
      done: data.purchasing.item_count > 0
    },
    {
      label: 'Download your first report',
      done: false
    }
  ]

  const completed = steps.filter(s => s.done).length
  if (completed === steps.length) return null

  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
          Getting Started
        </h2>
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{ backgroundColor: '#F5ECD7', color: '#6B4F3A' }}
        >
          {completed} of {steps.length} complete
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full h-1.5 mb-4"
        style={{ backgroundColor: '#E8D5B7' }}
      >
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${(completed / steps.length) * 100}%`,
            backgroundColor: '#C0392B'
          }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-medium"
              style={{
                backgroundColor: step.done ? '#D1FAE5' : '#F5ECD7',
                color: step.done ? '#065F46' : '#6B4F3A',
                border: `1px solid ${step.done ? '#6EE7B7' : '#E8D5B7'}`
              }}
            >
              {step.done ? '✓' : i + 1}
            </div>
            <span style={{
              color: step.done ? '#9CA3AF' : '#3D2B1F',
              textDecoration: step.done ? 'line-through' : 'none'
            }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}