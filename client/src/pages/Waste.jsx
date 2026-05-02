import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function Waste() {
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    ingredient_id: '',
    quantity: '',
    unit: '',
    reason: '',
    notes: ''
  })

  const reasons = ['Spoilage', 'Overprep', 'Dropped', 'Expired', 'Damaged', 'Other']

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [logsRes, summaryRes, ingRes] = await Promise.all([
        api.get('/waste/'),
        api.get('/waste/summary'),
        api.get('/ingredients/')
      ])
      setLogs(logsRes.data)
      setSummary(summaryRes.data)
      setIngredients(ingRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleIngredientChange = (id) => {
    const ing = ingredients.find(i => i.id === id)
    setForm({ ...form, ingredient_id: id, unit: ing?.unit || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/waste/', {
        ingredient_id: form.ingredient_id || null,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        reason: form.reason,
        notes: form.notes
      })
      setForm({ ingredient_id: '', quantity: '', unit: '', reason: '', notes: '' })
      setShowForm(false)
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Waste Log</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
              Track what gets thrown out and why
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-white px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: '#C0392B' }}
          >
            {showForm ? 'Cancel' : 'Log Waste'}
          </button>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: '#6B4F3A' }}>Total Waste Cost</p>
              <p className="text-3xl font-bold" style={{ color: '#C0392B' }}>${summary.total_waste_cost.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
              <p className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: '#6B4F3A' }}>Top Wasted</p>
              {summary.top_wasted_ingredients.slice(0, 3).map(item => (
                <div key={item.ingredient_name} className="flex justify-between text-sm mb-1">
                  <span style={{ color: '#3D2B1F' }}>{item.ingredient_name}</span>
                  <span style={{ color: '#C0392B' }}>${item.total_cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log form */}
        {showForm && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>Log Waste Entry</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Ingredient</label>
                <select
                  value={form.ingredient_id}
                  onChange={(e) => handleIngredientChange(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                >
                  <option value="">Select ingredient</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Reason</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                >
                  <option value="">Select reason</option>
                  {reasons.map(r => (
                    <option key={r} value={r.toLowerCase()}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="lb"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Notes</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="Left out overnight"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#1B2A4A' }}
                >
                  {saving ? 'Saving...' : 'Log Waste'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Waste log table */}
        {loading ? (
          <p className="text-sm" style={{ color: '#6B4F3A' }}>Loading waste log...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#6B4F3A' }}>
            <p className="text-lg font-medium">No waste logged yet</p>
            <p className="text-sm mt-1">Start logging at the end of each shift.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #E8D5B7' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5ECD7' }}>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Date</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Ingredient</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Quantity</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Cost</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Reason</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr
                    key={log.id}
                    style={{ backgroundColor: i % 2 === 0 ? '#FEFAF4' : '#FDF6EC', borderTop: '1px solid #E8D5B7' }}
                  >
                    <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>
                      {log.logged_at?.slice(0, 10)}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: '#3D2B1F' }}>
                      {log.ingredient_name || '—'}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#3D2B1F' }}>
                      {log.quantity} {log.unit}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: '#C0392B' }}>
                      {log.cost_of_waste ? `$${log.cost_of_waste.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>
                      {log.reason || '—'}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}