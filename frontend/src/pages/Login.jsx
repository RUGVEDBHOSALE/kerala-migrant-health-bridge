import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [portalType, setPortalType] = useState('doctor')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const result = await login(email, password)

        if (result.success) {
            navigate(result.user.role === 'doctor' ? '/doctor' : '/government')
        } else {
            setError(result.error)
        }

        setLoading(false)
    }

    const fillDemoCredentials = () => {
        if (portalType === 'doctor') {
            setEmail('doctor@hospital.kerala.gov.in')
            setPassword('doctor123')
        } else {
            setEmail('health.officer@kerala.gov.in')
            setPassword('gov123')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl relative z-10 border border-gray-100">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                        <span className="text-white text-4xl font-bold">+</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-1">Kerala Migrant Health Bridge</h1>
                    <p className="text-slate-500 text-sm">Healthcare Management System</p>
                </div>

                {/* Portal Toggle */}
                <div className="flex rounded-xl bg-blue-50 p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => setPortalType('doctor')}
                        className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${portalType === 'doctor'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        👨‍⚕️ Doctor Portal
                    </button>
                    <button
                        type="button"
                        onClick={() => setPortalType('government')}
                        className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${portalType === 'government'
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'text-slate-600 hover:text-slate-800'
                            }`}
                    >
                        🏛️ Government Portal
                    </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            placeholder={portalType === 'doctor' ? 'doctor@hospital.kerala.gov.in' : 'health.officer@kerala.gov.in'}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <LoadingSpinner size="sm" /> : <>Sign In</>}
                    </button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={fillDemoCredentials}
                        className="w-full text-center text-sm text-slate-500 hover:text-blue-500 transition-colors"
                    >
                        📋 Fill Demo Credentials
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        {portalType === 'doctor'
                            ? 'doctor@hospital.kerala.gov.in / doctor123'
                            : 'health.officer@kerala.gov.in / gov123'
                        }
                    </p>
                </div>

                {/* Security Notice */}
                <p className="text-center text-xs text-slate-400 mt-6">
                    🔒 Secure login protected by JWT authentication
                </p>
            </div>
        </div>
    )
}
