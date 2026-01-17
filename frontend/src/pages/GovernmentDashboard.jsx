import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/common/Navbar'
import DashboardStats from '../components/government/DashboardStats'
import DiseaseTrends from '../components/government/DiseaseTrends'
import MedicineDemand from '../components/government/MedicineDemand'
import HeatmapView from '../components/maps/HeatmapView'
import PredictiveTab from '../components/maps/PredictiveTab'
import api from '../services/api'

export default function GovernmentDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [heatmapData, setHeatmapData] = useState([])
    const [trends, setTrends] = useState([])
    const [loading, setLoading] = useState(true)
    const [liveUpdates, setLiveUpdates] = useState([])

    useEffect(() => {
        fetchAllData()

        // Socket connection for real-time updates
        const socket = io('http://localhost:3001')

        socket.on('connect', () => {
            console.log('Connected to real-time server')
            socket.emit('joinRoom', 'government')
        })

        socket.on('newCase', (data) => {
            console.log('New case received:', data)
            setLiveUpdates(prev => [data, ...prev].slice(0, 10))
            fetchAllData() // Refresh stats
        })

        socket.on('newMedicineRequest', (data) => {
            console.log('New medicine request:', data)
            setLiveUpdates(prev => [{ ...data, type: 'medicine' }, ...prev].slice(0, 10))
        })

        const interval = setInterval(fetchAllData, 30000) // Refresh every 30 seconds

        return () => {
            socket.disconnect()
            clearInterval(interval)
        }
    }, [])

    const fetchAllData = async () => {
        try {
            const [statsRes, heatmapRes, trendsRes] = await Promise.all([
                api.get('/cases/stats?timeRange=7d'),
                api.get('/cases/heatmap?timeRange=7d'),
                api.get('/cases/trends')
            ])

            setStats(statsRes.data)
            setHeatmapData(heatmapRes.data.heatmapData || [])
            setTrends(trendsRes.data.trends || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Main Overview
    const Overview = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome & Live Indicator */}
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            Public Health Dashboard 🏛️
                        </h2>
                        <p className="text-white/60">
                            Real-time monitoring of migrant worker health across Kerala
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/30">
                        <span className="w-2 h-2 rounded-full bg-green-500 live-indicator"></span>
                        <span className="text-green-400 text-sm font-medium">Live Updates</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <DashboardStats stats={stats} loading={loading} />

            {/* Live Updates Feed */}
            {liveUpdates.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">⚡ Live Feed</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {liveUpdates.map((update, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 animate-slide-up">
                                <span className="text-xl">
                                    {update.type === 'medicine' ? '💊' : '🏥'}
                                </span>
                                <div className="flex-1">
                                    <p className="text-white text-sm">
                                        {update.type === 'medicine'
                                            ? `Medicine request from ${update.hospitalName}`
                                            : `New ${update.diagnosis} case in ${update.district}`
                                        }
                                    </p>
                                    <p className="text-white/50 text-xs">
                                        {new Date(update.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Disease Trends Chart */}
            <DiseaseTrends trends={trends} stats={stats} />

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                    onClick={() => navigate('/government/heatmap')}
                    className="stat-card flex flex-col items-center gap-2 hover:bg-white/20"
                >
                    <span className="text-3xl">🗺️</span>
                    <span className="text-white font-medium">Heatmap</span>
                </button>
                <button
                    onClick={() => navigate('/government/predictions')}
                    className="stat-card flex flex-col items-center gap-2 hover:bg-white/20"
                >
                    <span className="text-3xl">🔮</span>
                    <span className="text-white font-medium">Predictions</span>
                </button>
                <button
                    onClick={() => navigate('/government/medicine')}
                    className="stat-card flex flex-col items-center gap-2 hover:bg-white/20"
                >
                    <span className="text-3xl">💊</span>
                    <span className="text-white font-medium">Medicine</span>
                </button>
                <button
                    onClick={() => fetchAllData()}
                    className="stat-card flex flex-col items-center gap-2 hover:bg-white/20"
                >
                    <span className="text-3xl">🔄</span>
                    <span className="text-white font-medium">Refresh</span>
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <Navbar title="Government Portal" portalType="government" />

                <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="/heatmap" element={<HeatmapView data={heatmapData} />} />
                    <Route path="/predictions" element={<PredictiveTab stats={stats} />} />
                    <Route path="/medicine" element={<MedicineDemand />} />
                </Routes>
            </div>
        </div>
    )
}
