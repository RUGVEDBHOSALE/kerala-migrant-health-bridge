import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`
            fetchUser()
        } else {
            setLoading(false)
        }
    }, [token])

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me')
            setUser(response.data.user)
        } catch (error) {
            console.error('Auth error:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password })
            const { token: newToken, user: userData } = response.data

            localStorage.setItem('token', newToken)
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            setToken(newToken)
            setUser(userData)

            return { success: true, user: userData }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            }
        }
    }

    const logout = () => {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
        setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
