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
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
            </div>

            <div className="glass-card w-full max-w-md p-8 animate-fade-in relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-2xl shadow-green-500/30 mb-4">
                        <span className="text-white text-4xl font-bold">+</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-1">Kerala Migrant Health Bridge</h1>
                    <p className="text-white/60 text-sm">Healthcare Management System</p>
                </div>

                {/* Portal Toggle */}
                <div className="flex rounded-xl bg-white/10 p-1 mb-6">
                    <button
                        type="button"
                        onClick={() => setPortalType('doctor')}
                        className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${portalType === 'doctor'
                                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                                : 'text-white/70 hover:text-white'
                            }`}
                    >
                        👨‍⚕️ Doctor Portal
                    </button>
                    <button
                        type="button"
                        onClick={() => setPortalType('government')}
                        className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all ${portalType === 'government'
                                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg'
                                : 'text-white/70 hover:text-white'
                            }`}
                    >
                        🏛️ Government Portal
                    </button>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder={portalType === 'doctor' ? 'doctor@hospital.kerala.gov.in' : 'health.officer@kerala.gov.in'}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {loading ? <LoadingSpinner size="sm" /> : <>Sign In</>}
                    </button>
                </form>

                {/* Demo Credentials */}
                <div className="mt-6 pt-6 border-t border-white/10">
                    <button
                        type="button"
                        onClick={fillDemoCredentials}
                        className="w-full text-center text-sm text-white/60 hover:text-white transition-colors"
                    >
                        📋 Fill Demo Credentials
                    </button>
                    <p className="text-center text-xs text-white/40 mt-2">
                        {portalType === 'doctor'
                            ? 'doctor@hospital.kerala.gov.in / doctor123'
                            : 'health.officer@kerala.gov.in / gov123'
                        }
                    </p>
                </div>

                {/* Security Notice */}
                <p className="text-center text-xs text-white/40 mt-6">
                    🔒 Secure login protected by JWT authentication
                </p>
            </div>
        </div>
    )
}
