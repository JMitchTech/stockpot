import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function Purchasing() {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEventForm, setShowEventForm] = useState(false)
  const [events, setEvents] = useState([])
  const [saving, setSaving] = useState(false)
  const [eventForm, setEventForm] = useState({
    name: '',
    type: '',
    event_date: '',
    notes: ''
  })

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [forecastRes, eventsRes] = await Promise.all([
        api.get('/purchasing/forecast'),
        api.get('/purchasing/events')
      ])
      setForecast(forecastRes.data)
      setEvents(eventsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEventSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/purchasing/events', eventForm)
      setEventForm({ name: '', type: '', event_date: '', notes: '' })
      setShowEventForm(false)
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
            <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Purchasing</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
              Smart order list based on your stock and waste history
            </p>
          </div>
          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="text-sm text-white px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: '#C0392B' }}
          >
            {showEventForm ? 'Cancel' : 'Add Event'}
          </button>
        </div>

        {/* Event form */}
        {showEventForm && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>Add Calendar Event</h2>
            <p className="text-xs mb-4" style={{ color: '#6B4F3A' }}>
              Events within 7 days add a 20% buffer to your order quantities automatically.
            </p>
            <form onSubmit={handleEventSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Event Name</label>
                <input
                  type="text"
                  value={eventForm.name}
                  onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="Mother's Day Weekend"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Type</label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm({ ...eventForm, type: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                >
                  <option value="">Select type</option>
                  <option value="holiday">Holiday</option>
                  <option value="local_event">Local Event</option>
                  <option value="private_party">Private Party</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Date</label>
                <input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Notes</label>
                <input
                  type="text"
                  value={eventForm.notes}
                  onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="Busiest weekend of the year"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#1B2A4A' }}
                >
                  {saving ? 'Saving...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Upcoming events */}
        {events.length > 0 && (
          <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#1B2A4A' }}>Upcoming Events</h2>
            <div className="flex flex-wrap gap-2">
              {events.map(event => (
                <div
                  key={event.id}
                  className="text-xs px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: '#EBF5FB', color: '#1B2A4A', border: '1px solid #BEE3F8' }}
                >
                  {event.name} — {event.event_date?.slice(0, 10)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Forecast */}
        {loading ? (
          <p className="text-sm" style={{ color: '#6B4F3A' }}>Generating your order list...</p>
        ) : !forecast || forecast.item_count === 0 ? (
          <div className="text-center py-16" style={{ color: '#6B4F3A' }}>
            <p className="text-lg font-medium">Stock levels look good</p>
            <p className="text-sm mt-1">Nothing needs ordering right now.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="flex items-center justify-between px-5 py-4 rounded-2xl shadow-sm"
              style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1B2A4A' }}>
                  {forecast.item_count} items to order this week
                </p>
                {forecast.upcoming_events.length > 0 && (
                  <p className="text-xs mt-0.5" style={{ color: '#6B4F3A' }}>
                    Event buffers applied for {forecast.upcoming_events[0].name}
                  </p>
                )}
              </div>
              <p className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>
                ${forecast.total_estimated_cost.toFixed(2)}
              </p>
            </div>

            {/* Order list */}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #E8D5B7' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F5ECD7' }}>
                    <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Ingredient</th>
                    <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>On Hand</th>
                    <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Par Level</th>
                    <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Order Qty</th>
                    <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Waste Buffer</th>
                    <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.order_items.map((item, i) => (
                    <tr
                      key={item.ingredient_id}
                      style={{ backgroundColor: i % 2 === 0 ? '#FEFAF4' : '#FDF6EC', borderTop: '1px solid #E8D5B7' }}
                    >
                      <td className="px-5 py-3 font-medium" style={{ color: '#3D2B1F' }}>{item.ingredient_name}</td>
                      <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>{item.current_stock} {item.unit}</td>
                      <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>{item.par_level} {item.unit}</td>
                      <td className="px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>
                        {item.recommended_order_quantity} {item.unit}
                      </td>
                      <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>
                        {item.waste_buffer_included > 0 ? `+${item.waste_buffer_included} ${item.unit}` : '—'}
                      </td>
                      <td className="px-5 py-3 font-semibold" style={{ color: '#C0392B' }}>
                        ${item.estimated_cost.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}