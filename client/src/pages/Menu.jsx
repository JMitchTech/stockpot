import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import MarginBadge from '../components/MarginBadge'
import api from '../api'

export default function Menu() {
  const [items, setItems] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', category: '', sale_price: '' })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [menuRes, ingRes] = await Promise.all([
        api.get('/menu/'),
        api.get('/ingredients/')
      ])
      setItems(menuRes.data)
      setIngredients(ingRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
      fetchAll()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id) => {
    if (!confirm('Remove this item from the menu?')) return
    await api.delete(`/menu/${id}`)
    fetchAll()
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
                    <td className="px-5 py-3 flex gap-3">
                      <button
                        onClick={() => setEditItem(item)}
                        className="text-xs hover:underline"
                        style={{ color: '#1B2A4A' }}
                      >
                        Edit
                      </button>
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

      {/* Edit modal */}
      {editItem && (
        <EditDishModal
          item={editItem}
          ingredients={ingredients}
          onClose={() => setEditItem(null)}
          onSaved={() => { setEditItem(null); fetchAll() }}
        />
      )}

    </Layout>
  )
}

function EditDishModal({ item, ingredients, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: item.name,
    category: item.category || '',
    sale_price: item.sale_price
  })
  const [recipeLines, setRecipeLines] = useState(
    item.recipe_lines?.map(line => ({
      ingredient_id: line.ingredient_id,
      quantity: line.quantity,
      unit: line.unit
    })) || []
  )
  const [saving, setSaving] = useState(false)
  const [costPreview, setCostPreview] = useState(null)

  // Calculate cost preview when recipe lines change
  useEffect(() => {
    let total = 0
    for (const line of recipeLines) {
      const ing = ingredients.find(i => i.id === line.ingredient_id)
      if (ing && line.quantity) {
        total += ing.cost_per_unit * parseFloat(line.quantity)
      }
    }
    const margin = form.sale_price > 0
      ? Math.round((1 - total / form.sale_price) * 10000) / 100
      : null
    setCostPreview({ food_cost: Math.round(total * 100) / 100, margin })
  }, [recipeLines, form.sale_price, ingredients])

  const addLine = () => {
    setRecipeLines([...recipeLines, { ingredient_id: '', quantity: '', unit: '' }])
  }

  const updateLine = (index, field, value) => {
    const updated = [...recipeLines]
    updated[index][field] = value
    if (field === 'ingredient_id') {
      const ing = ingredients.find(i => i.id === value)
      if (ing) updated[index].unit = ing.unit
    }
    setRecipeLines(updated)
  }

  const removeLine = (index) => {
    setRecipeLines(recipeLines.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Update dish details
      await api.patch(`/menu/${item.id}`, {
        name: form.name,
        category: form.category,
        sale_price: parseFloat(form.sale_price),
        recipe_lines: recipeLines
          .filter(l => l.ingredient_id && l.quantity)
          .map(l => ({
            ingredient_id: l.ingredient_id,
            quantity: parseFloat(l.quantity),
            unit: l.unit
          }))
      })
      onSaved()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99998,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          backgroundColor: '#FEFAF4',
          borderRadius: '20px',
          padding: '32px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: '#1B2A4A' }}>Edit Dish</h2>
          <button
            onClick={onClose}
            style={{ color: '#6B4F3A', fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {/* Dish details */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-1">
            <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Dish Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
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
            />
          </div>
        </div>

        {/* Cost preview */}
        {costPreview && recipeLines.some(l => l.ingredient_id && l.quantity) && (
          <div
            className="rounded-xl px-4 py-3 mb-6 flex gap-6 text-sm"
            style={{ backgroundColor: '#F5ECD7', border: '1px solid #E8D5B7' }}
          >
            <div>
              <span style={{ color: '#6B4F3A' }}>Food Cost: </span>
              <span className="font-semibold" style={{ color: '#3D2B1F' }}>${costPreview.food_cost}</span>
            </div>
            <div>
              <span style={{ color: '#6B4F3A' }}>Margin: </span>
              <span
                className="font-semibold"
                style={{
                  color: costPreview.margin >= 70 ? '#065F46'
                    : costPreview.margin >= 50 ? '#92400E'
                    : '#991B1B'
                }}
              >
                {costPreview.margin}%
              </span>
            </div>
          </div>
        )}

        {/* Recipe builder */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>Recipe</h3>
            <button
              onClick={addLine}
              className="text-xs px-3 py-1 rounded-lg"
              style={{ backgroundColor: '#1B2A4A', color: 'white' }}
            >
              Add Ingredient
            </button>
          </div>

          {recipeLines.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#6B4F3A' }}>
              No ingredients linked yet. Add ingredients to calculate food cost automatically.
            </p>
          ) : (
            <div className="space-y-2">
              {recipeLines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      value={line.ingredient_id}
                      onChange={(e) => updateLine(i, 'ingredient_id', e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                    >
                      <option value="">Select ingredient</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} (${ing.cost_per_unit}/{ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      value={line.quantity}
                      onChange={(e) => updateLine(i, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      value={line.unit}
                      onChange={(e) => updateLine(i, 'unit', e.target.value)}
                      placeholder="Unit"
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeLine(i)}
                      style={{ color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm px-5 py-2 rounded-lg"
            style={{ backgroundColor: '#F5ECD7', color: '#3D2B1F', border: '1px solid #E8D5B7' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm text-white px-6 py-2 rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#C0392B' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

      </div>
    </div>
  )
}