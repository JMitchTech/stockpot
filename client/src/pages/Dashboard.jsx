import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import HealthScore from '../components/HealthScore'
import MarginBadge from '../components/MarginBadge'
import NonnaSidebar from '../components/Nonna'
import api from '../api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nonnaOpen, setNonnaOpen] = useState(false)

  useEffect(() => {
    api.get('/dashboard/')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading your kitchen...
      </div>
    </Layout>
  )

  if (!data) return (
    <Layout>
      <div className="text-red-500 p-6">Failed to load dashboard.</div>
    </Layout>
  )

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">
              {data.restaurant_name}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Good {getTimeOfDay()} — here's how your kitchen looks today.
            </p>
          </div>
          <HealthScore
            score={data.health_score.score}
            indicator={data.health_score.indicator}
          />
        </div>

        {/* Alerts */}
        {data.alerts.count > 0 && (
          <div className="space-y-2">
            {data.alerts.items.map((alert, i) => (
              <div
                key={i}
                className={`px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2 ${
                  alert.severity === 'danger'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
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
            sub={data.waste.top_wasted[0] ? `Top: ${data.waste.top_wasted[0].name}` : 'No waste logged'}
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-[#1B2A4A] mb-4">Menu Health</h2>
            <div className="space-y-2">
              {data.menu.green_items.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <MarginBadge pct={item.margin} />
                </div>
              ))}
              {data.menu.yellow_items.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <MarginBadge pct={item.margin} />
                </div>
              ))}
              {data.menu.red_items.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.name}</span>
                  <MarginBadge pct={item.margin} />
                </div>
              ))}
              {data.menu.total_active_items === 0 && (
                <p className="text-gray-400 text-sm">No menu items yet.</p>
              )}
            </div>
          </div>

          {/* Top purchasing items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-[#1B2A4A] mb-4">Order This Week</h2>
            {data.purchasing.upcoming_events.length > 0 && (
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg mb-3">
                {data.purchasing.upcoming_events[0].name} in {data.purchasing.upcoming_events[0].days_until} days — buffers applied
              </div>
            )}
            <div className="space-y-2">
              {data.purchasing.top_items.map(item => (
                <div key={item.ingredient_name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.ingredient_name}</span>
                  <span className="text-gray-400">{item.recommended_order_quantity} {item.unit} — ${item.estimated_cost}</span>
                </div>
              ))}
              {data.purchasing.item_count === 0 && (
                <p className="text-gray-400 text-sm">Stock levels are good.</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Nonna floating button */}
      <button
        onClick={() => setNonnaOpen(true)}
        className="fixed bottom-0 left-0 w-52 flex flex-col items-center pb-4 hover:scale-105 transition-transform"
      >
        <img src="/src/assets/Nonna.png" alt="Ask Nonna" className="w-36 h-36 object-contain drop-shadow-lg" />
        <span className="text-xs mt-1" style={{ color: '#6B4F3A' }}>Ask Nonna</span>
      </button>

      <NonnaSidebar open={nonnaOpen} onClose={() => setNonnaOpen(false)} />

    </Layout>
  )
}

function StatCard({ label, value, sub, status }) {
  const border =
    status === 'good'
      ? 'border-green-200'
      : status === 'bad'
      ? 'border-red-200'
      : 'border-yellow-200'

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${border} p-5`}>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#1B2A4A]">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}