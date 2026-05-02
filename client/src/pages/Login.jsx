import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import logo from '../assets/logo1.png'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('stockpot_token', res.data.access_token)
      localStorage.setItem('stockpot_user', JSON.stringify({
        email: res.data.email,
        role: res.data.role,
        restaurant_id: res.data.restaurant_id
      }))
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#FDF6EC' }}>
      <div className="w-full max-w-md">

        <div className="flex justify-center mb-8">
          <img src={logo} alt="Stockpot" className="h-36" />
        </div>

        <div className="rounded-2xl shadow-md p-8" style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}>
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#3D2B1F' }}>Welcome back</h2>
          <p className="text-gray-400 text-sm mb-6">Sign in to your restaurant</p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                placeholder="you@restaurant.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C0392B] hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            No account?{' '}
            <Link to="/register" className="text-[#C0392B] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Created by Wizardwerks Enterprise Labs
        </p>
      </div>
    </div>
  )
}