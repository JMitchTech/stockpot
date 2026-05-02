import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo1.png'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    restaurant_name: '',
    preferred_language: 'en'
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'vi', label: 'Vietnamese' },
    { value: 'zh', label: 'Mandarin' },
    { value: 'ko', label: 'Korean' },
    { value: 'el', label: 'Greek' },
    { value: 'it', label: 'Italian' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/register', form)
      localStorage.setItem('stockpot_token', res.data.access_token)
      localStorage.setItem('stockpot_user', JSON.stringify({
        email: res.data.email,
        role: res.data.role,
        restaurant_id: res.data.restaurant_id
      }))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#FDF6EC' }}>
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <img src={logo} alt="Stockpot" className="h-9" />
        </div>

        <div className="rounded-2xl shadow-md p-8" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#3D2B1F' }}>Create your account</h2>
          <p className="text-sm mb-6" style={{ color: '#6B4F3A' }}>Let's get your kitchen set up</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D2B1F' }}>Restaurant Name</label>
              <input
                type="text"
                value={form.restaurant_name}
                onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                placeholder="Tony's Italian Kitchen"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D2B1F' }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                placeholder="you@restaurant.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D2B1F' }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#3D2B1F' }}>Preferred Language</label>
              <select
                value={form.preferred_language}
                onChange={(e) => setForm({ ...form, preferred_language: e.target.value })}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ border: '1px solid #E8D5B7', backgroundColor: 'white', color: '#3D2B1F' }}
              >
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
              style={{ backgroundColor: '#C0392B' }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#6B4F3A' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: '#C0392B' }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#E8D5B7' }}>
          Cook with passion. Manage with clarity.
        </p>
      </div>
    </div>
  )
}