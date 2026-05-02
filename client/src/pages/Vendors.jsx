import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function Vendors() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [form, setForm] = useState({
    name: '',
    rep_name: '',
    phone: '',
    email: '',
    delivery_days: '',
    payment_terms: '',
    min_order: ''
  })

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = () => {
    api.get('/vendors/')
      .then(res => setVendors(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchOrders = async (vendorId) => {
    setLoadingOrders(true)
    try {
      const res = await api.get(`/vendors/${vendorId}/orders`)
      setOrders(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleSelectVendor = (vendor) => {
    setSelectedVendor(vendor)
    fetchOrders(vendor.id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/vendors/', {
        name: form.name,
        rep_name: form.rep_name || null,
        phone: form.phone || null,
        email: form.email || null,
        delivery_days: form.delivery_days || null,
        payment_terms: form.payment_terms || null,
        min_order: form.min_order ? parseFloat(form.min_order) : null
      })
      setForm({
        name: '', rep_name: '', phone: '', email: '',
        delivery_days: '', payment_terms: '', min_order: ''
      })
      setShowForm(false)
      fetchVendors()
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Vendors</h1>
            <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
              Supplier contacts and order history
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setSelectedVendor(null) }}
            className="text-sm text-white px-4 py-2 rounded-lg transition"
            style={{ backgroundColor: '#C0392B' }}
          >
            {showForm ? 'Cancel' : 'Add Vendor'}
          </button>
        </div>

        {/* Add vendor form */}
        {showForm && (
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#1B2A4A' }}>New Vendor</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Company Name', placeholder: 'Sysco Foods', required: true },
                { key: 'rep_name', label: 'Rep Name', placeholder: 'Tony Marchetti' },
                { key: 'phone', label: 'Phone', placeholder: '555-234-5678' },
                { key: 'email', label: 'Email', placeholder: 'tony@sysco.com' },
                { key: 'delivery_days', label: 'Delivery Days', placeholder: 'Monday, Wednesday, Friday' },
                { key: 'payment_terms', label: 'Payment Terms', placeholder: 'Net 30' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>{field.label}</label>
                  <input
                    type="text"
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#3D2B1F' }}>Minimum Order ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.min_order}
                  onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                  placeholder="150.00"
                />
              </div>
              <div className="col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm text-white px-6 py-2 rounded-lg disabled:opacity-50"
                  style={{ backgroundColor: '#1B2A4A' }}
                >
                  {saving ? 'Saving...' : 'Save Vendor'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">

          {/* Vendor list */}
          <div className="col-span-1 space-y-2">
            {loading ? (
              <p className="text-sm" style={{ color: '#6B4F3A' }}>Loading vendors...</p>
            ) : vendors.length === 0 ? (
              <div className="text-center py-10" style={{ color: '#6B4F3A' }}>
                <p className="text-sm">No vendors yet.</p>
              </div>
            ) : vendors.map(vendor => (
              <button
                key={vendor.id}
                onClick={() => handleSelectVendor(vendor)}
                className="w-full text-left px-4 py-3 rounded-xl transition"
                style={{
                  backgroundColor: selectedVendor?.id === vendor.id ? '#1B2A4A' : '#FEFAF4',
                  color: selectedVendor?.id === vendor.id ? 'white' : '#3D2B1F',
                  border: '1px solid #E8D5B7'
                }}
              >
                <p className="font-medium text-sm">{vendor.name}</p>
                {vendor.rep_name && (
                  <p className="text-xs mt-0.5 opacity-70">{vendor.rep_name}</p>
                )}
              </button>
            ))}
          </div>

          {/* Vendor detail */}
          <div className="col-span-2">
            {!selectedVendor ? (
              <div className="flex items-center justify-center h-full rounded-2xl"
                style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7', minHeight: '200px' }}>
                <p className="text-sm" style={{ color: '#6B4F3A' }}>Select a vendor to view details</p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Contact info */}
                <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
                  <h2 className="text-sm font-semibold mb-3" style={{ color: '#1B2A4A' }}>{selectedVendor.name}</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedVendor.rep_name && (
                      <div>
                        <span style={{ color: '#6B4F3A' }}>Rep: </span>
                        <span style={{ color: '#3D2B1F' }}>{selectedVendor.rep_name}</span>
                      </div>
                    )}
                    {selectedVendor.phone && (
                      <div>
                        <span style={{ color: '#6B4F3A' }}>Phone: </span>
                        <span style={{ color: '#3D2B1F' }}>{selectedVendor.phone}</span>
                      </div>
                    )}
                    {selectedVendor.email && (
                      <div>
                        <span style={{ color: '#6B4F3A' }}>Email: </span>
                        <span style={{ color: '#3D2B1F' }}>{selectedVendor.email}</span>
                      </div>
                    )}
                    {selectedVendor.delivery_days && (
                      <div>
                        <span style={{ color: '#6B4F3A' }}>Delivers: </span>
                        <span style={{ color: '#3D2B1F' }}>{selectedVendor.delivery_days}</span>
                      </div>
                    )}
                    {selectedVendor.payment_terms && (
                      <div>
                        <span style={{ color: '#6B4F3A' }}>Terms: </span>
                        <span style={{ color: '#3D2B1F' }}>{selectedVendor.payment_terms}</span>
                      </div>
                    )}
                    {selectedVendor.min_order && (
                      <div>
                        <span style={{ color: '#6B4F3A' }}>Min Order: </span>
                        <span style={{ color: '#3D2B1F' }}>${selectedVendor.min_order}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order history */}
                <div className="rounded-2xl p-5 shadow-sm" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
                  <h2 className="text-sm font-semibold mb-3" style={{ color: '#1B2A4A' }}>Order History</h2>
                  {loadingOrders ? (
                    <p className="text-sm" style={{ color: '#6B4F3A' }}>Loading orders...</p>
                  ) : orders.length === 0 ? (
                    <p className="text-sm" style={{ color: '#6B4F3A' }}>No orders placed yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.map(order => (
                        <div
                          key={order.id}
                          className="px-4 py-3 rounded-xl text-sm"
                          style={{ backgroundColor: '#FDF6EC', border: '1px solid #E8D5B7' }}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span style={{ color: '#6B4F3A' }}>
                              {order.ordered_at?.slice(0, 10)}
                            </span>
                            <div className="flex items-center gap-3">
                              <span
                                className="text-xs px-2 py-1 rounded-full"
                                style={{
                                  backgroundColor: order.status === 'delivered' ? '#D1FAE5' : '#FEF3C7',
                                  color: order.status === 'delivered' ? '#065F46' : '#92400E'
                                }}
                              >
                                {order.status}
                              </span>
                              <span className="font-semibold" style={{ color: '#1B2A4A' }}>
                                ${order.total_cost?.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {order.lines?.map(line => (
                            <div key={line.id} className="flex justify-between text-xs" style={{ color: '#6B4F3A' }}>
                              <span>{line.ingredient_name}</span>
                              <span>{line.quantity_ordered} units @ ${line.unit_cost}/unit</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}