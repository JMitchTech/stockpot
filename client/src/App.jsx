import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Menu from './pages/Menu'
import Ingredients from './pages/Ingredients'
import Waste from './pages/Waste'
import Purchasing from './pages/Purchasing'
import Vendors from './pages/Vendors'
import Reports from './pages/Reports'
import Scan from './pages/Scan'

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('stockpot_token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/menu" element={<PrivateRoute><Menu /></PrivateRoute>} />
        <Route path="/ingredients" element={<PrivateRoute><Ingredients /></PrivateRoute>} />
        <Route path="/waste" element={<PrivateRoute><Waste /></PrivateRoute>} />
        <Route path="/purchasing" element={<PrivateRoute><Purchasing /></PrivateRoute>} />
        <Route path="/vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
        <Route path="/scan" element={<PrivateRoute><Scan /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}