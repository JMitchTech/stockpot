import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import MarginBadge from '../components/MarginBadge'
import api from '../api'

export default function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', category: '', sale_price: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = () => {
    api.get('/menu/')
      .then(res => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/menu/', {
        name: form.name,
        category: form.category,
        sale_price: parseFloat(form.sale_price),
        recipe_lines: []
      })
      setForm({ name: '', category: '', sale_price: '' })
      setShowForm(false)
      fetchMenu()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Remove this item from the menu?')) return
    await api.delete(`/menu/${id}`)
    fetchMenu()
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Menu</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
              {items.length} active dishes
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-white px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: '#C0392B' }}
          >
            {showForm ? 'Cancel' : 'Add Dish'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>New Dish</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Dish Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                    placeholder="Chicken Margherita"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Category</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                    placeholder="Entrees"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Sale Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.sale_price}
                    onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                    placeholder="18.99"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#1B2A4A' }}
                >
                  {saving ? 'Saving...' : 'Save Dish'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Menu list */}
        {loading ? (
          <p className="text-sm" style={{ color: '#6B4F3A' }}>Loading menu...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#6B4F3A' }}>
            <p className="text-lg font-medium">No dishes yet</p>
            <p className="text-sm mt-1">Add your first dish or scan your menu to get started.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #E8D5B7' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5ECD7' }}>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Dish</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Category</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Sale Price</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Food Cost</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Margin</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Allergens</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{ backgroundColor: i % 2 === 0 ? '#FEFAF4' : '#FDF6EC', borderTop: '1px solid #E8D5B7' }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: '#3D2B1F' }}>{item.name}</td>
                    <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>{item.category || '—'}</td>
                    <td className="px-5 py-3" style={{ color: '#3D2B1F' }}>${item.sale_price?.toFixed(2)}</td>
                    <td className="px-5 py-3" style={{ color: '#3D2B1F' }}>
                      {item.food_cost_cached ? `$${item.food_cost_cached.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <MarginBadge pct={item.margin_cached} />
                    </td>
                    <td className="px-5 py-3">
                      {item.allergens?.length > 0 ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                          {item.allergens.join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: '#6B4F3A' }}>None</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => handleDeactivate(item.id)}
                        className="text-xs hover:underline"
                        style={{ color: '#C0392B' }}
                      >
                        Remove
                      </button>
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