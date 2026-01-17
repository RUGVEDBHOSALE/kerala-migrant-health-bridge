import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import DoctorDashboard from './pages/DoctorDashboard'
import GovernmentDashboard from './pages/GovernmentDashboard'
import LoadingSpinner from './components/common/LoadingSpinner'

// Protected Route Component
function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (allowedRole && user.role !== allowedRole) {
        return <Navigate to={user.role === 'doctor' ? '/doctor' : '/government'} replace />
    }

    return children
}

function App() {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <Routes>
            <Route path="/login" element={
                user ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/government'} replace /> : <Login />
            } />

            <Route path="/doctor/*" element={
                <ProtectedRoute allowedRole="doctor">
                    <DoctorDashboard />
                </ProtectedRoute>
            } />

            <Route path="/government/*" element={
                <ProtectedRoute allowedRole="government">
                    <GovernmentDashboard />
                </ProtectedRoute>
            } />

            <Route path="/" element={
                user ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/government'} replace /> : <Navigate to="/login" replace />
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
