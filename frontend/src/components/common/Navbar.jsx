import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar({ title = 'Dashboard', portalType = 'doctor' }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const navLinks = portalType === 'doctor' ? [
        { path: '/doctor', label: 'Dashboard', icon: '🏠' },
        { path: '/doctor/prescription', label: 'New Prescription', icon: '📝' },
        { path: '/doctor/request', label: 'Medicine Request', icon: '💊' },
    ] : [
        { path: '/government', label: 'Overview', icon: '📊' },
        { path: '/government/heatmap', label: 'Heatmap', icon: '🗺️' },
        { path: '/government/predictions', label: 'Predictions', icon: '🔮' },
        { path: '/government/medicine', label: 'Medicine Demand', icon: '💊' },
    ]

    return (
        <nav className="bg-white p-4 mb-6 rounded-2xl shadow-md border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Logo and Title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-lg">+</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">{title}</h1>
                        <p className="text-xs text-slate-500">Kerala Migrant Health Bridge</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-wrap gap-2">
                    {navLinks.map((link) => (
                        <button
                            key={link.path}
                            onClick={() => navigate(link.path)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${location.pathname === link.path
                                    ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200'
                                    : 'text-slate-600 hover:bg-gray-50 hover:text-slate-800'
                                }`}
                        >
                            <span>{link.icon}</span>
                            <span className="hidden sm:inline">{link.label}</span>
                        </button>
                    ))}
                </div>

                {/* User Info and Logout */}
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                        <p className="text-xs text-slate-500">{user?.hospitalName || 'Health Department'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-4 rounded-xl transition-all"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    )
}
