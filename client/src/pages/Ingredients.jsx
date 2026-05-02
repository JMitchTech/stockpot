import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function Ingredients() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    unit: '',
    cost_per_unit: '',
    par_level: '',
    current_stock: '',
    allergens: ''
  })

  useEffect(() => {
    fetchIngredients()
  }, [])

  const fetchIngredients = () => {
    api.get('/ingredients/')
      .then(res => setIngredients(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/ingredients/', {
        name: form.name,
        unit: form.unit,
        cost_per_unit: parseFloat(form.cost_per_unit),
        par_level: parseFloat(form.par_level || 0),
        current_stock: parseFloat(form.current_stock || 0),
        allergens: form.allergens
          ? form.allergens.split(',').map(a => a.trim()).filter(Boolean)
          : []
      })
      setForm({ name: '', unit: '', cost_per_unit: '', par_level: '', current_stock: '', allergens: '' })
      setShowForm(false)
      fetchIngredients()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const stockStatus = (ing) => {
    if (!ing.par_level || ing.par_level === 0) return null
    if (ing.current_stock <= ing.par_level * 0.5) return 'critical'
    if (ing.current_stock <= ing.par_level) return 'low'
    return 'good'
  }

  const stockBadge = (status) => {
    if (!status) return null
    const styles = {
      good: 'bg-green-50 text-green-700',
      low: 'bg-yellow-50 text-yellow-700',
      critical: 'bg-red-50 text-red-700'
    }
    const labels = { good: 'Good', low: 'Low', critical: 'Critical' }
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Ingredients</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
              {ingredients.length} ingredients in your library
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-white px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: '#C0392B' }}
          >
            {showForm ? 'Cancel' : 'Add Ingredient'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>New Ingredient</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="Chicken Thighs"
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
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Cost per Unit</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost_per_unit}
                  onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="3.80"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Par Level</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.par_level}
                  onChange={(e) => setForm({ ...form, par_level: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Current Stock</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.current_stock}
                  onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Allergens (comma separated)</label>
                <input
                  type="text"
                  value={form.allergens}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="dairy, gluten"
                />
              </div>
              <div className="col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#1B2A4A' }}
                >
                  {saving ? 'Saving...' : 'Save Ingredient'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ingredients table */}
        {loading ? (
          <p className="text-sm" style={{ color: '#6B4F3A' }}>Loading ingredients...</p>
        ) : ingredients.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#6B4F3A' }}>
            <p className="text-lg font-medium">No ingredients yet</p>
            <p className="text-sm mt-1">Add ingredients to start calculating food costs.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #E8D5B7' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F5ECD7' }}>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Ingredient</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Unit</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Cost/Unit</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Stock</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Par</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Status</th>
                  <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Allergens</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing, i) => (
                  <tr
                    key={ing.id}
                    style={{ backgroundColor: i % 2 === 0 ? '#FEFAF4' : '#FDF6EC', borderTop: '1px solid #E8D5B7' }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: '#3D2B1F' }}>{ing.name}</td>
                    <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>{ing.unit}</td>
                    <td className="px-5 py-3" style={{ color: '#3D2B1F' }}>${ing.cost_per_unit?.toFixed(2)}</td>
                    <td className="px-5 py-3" style={{ color: '#3D2B1F' }}>{ing.current_stock}</td>
                    <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>{ing.par_level}</td>
                    <td className="px-5 py-3">{stockBadge(stockStatus(ing))}</td>
                    <td className="px-5 py-3">
                      {ing.allergens?.length > 0 ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700">
                          {ing.allergens.join(', ')}
                        </span>
                      ) : (
                        <span style={{ color: '#6B4F3A' }}>None</span>
                      )}
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