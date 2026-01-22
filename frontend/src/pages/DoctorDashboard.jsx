import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/common/Navbar'
import WorkerSearch from '../components/doctor/WorkerSearch'
import PrescriptionForm from '../components/doctor/PrescriptionForm'
import MedicineRequest from '../components/doctor/MedicineRequest'
import api from '../services/api'

export default function DoctorDashboard() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [stats, setStats] = useState(null)
    const [recentPrescriptions, setRecentPrescriptions] = useState([])
    const [selectedWorker, setSelectedWorker] = useState(null)

    useEffect(() => {
        fetchStats()

        // Socket connection for real-time updates
        const socket = io('http://localhost:3001')
        socket.on('connect', () => console.log('Connected to server'))

        return () => socket.disconnect()
    }, [])

    const fetchStats = async () => {
        try {
            const response = await api.get('/cases/stats?timeRange=24h')
            setStats(response.data)
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleWorkerSelect = (worker) => {
        setSelectedWorker(worker)
        navigate('/doctor/prescription')
    }

    // Main Dashboard View
    const DashboardHome = () => (
        <div className="space-y-6 animate-fade-in">
            {/* Welcome Section */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    Welcome, {user?.name}! 👨‍⚕️
                </h2>
                <p className="text-slate-500">
                    {user?.hospitalName} • {new Date().toLocaleDateString('en-IN', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                    <div className="text-3xl mb-2">📋</div>
                    <div className="text-2xl font-bold text-slate-800">{stats?.todayCases || 0}</div>
                    <div className="text-slate-500 text-sm">Cases Today</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                    <div className="text-3xl mb-2">👷</div>
                    <div className="text-2xl font-bold text-slate-800">{stats?.activeWorkers || 0}</div>
                    <div className="text-slate-500 text-sm">Active Workers</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                    <div className="text-3xl mb-2">🏥</div>
                    <div className="text-2xl font-bold text-slate-800">{stats?.totalCases || 0}</div>
                    <div className="text-slate-500 text-sm">Total Cases</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                    <div className="text-3xl mb-2">💊</div>
                    <div className="text-2xl font-bold text-slate-800">{stats?.byDiagnosis?.length || 0}</div>
                    <div className="text-slate-500 text-sm">Disease Types</div>
                </div>
            </div>

            {/* Worker Search */}
            <WorkerSearch onSelectWorker={handleWorkerSelect} />

            {/* Top Diagnoses */}
            {stats?.byDiagnosis?.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 Top Diagnoses (Last 7 Days)</h3>
                    <div className="space-y-3">
                        {stats.byDiagnosis.slice(0, 5).map((item, index) => (
                            <div key={item.diagnosis} className="flex items-center gap-3">
                                <span className="text-slate-400 font-mono text-sm w-6">{index + 1}.</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-slate-700 text-sm">{item.diagnosis}</span>
                                        <span className="text-slate-500 text-sm">{item.count} cases</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                                            style={{ width: `${(item.count / stats.byDiagnosis[0].count) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <div className="min-h-screen p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                <Navbar title="Doctor Portal" portalType="doctor" />

                <Routes>
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/prescription" element={
                        <PrescriptionForm
                            worker={selectedWorker}
                            onClearWorker={() => setSelectedWorker(null)}
                        />
                    } />
                    <Route path="/request" element={<MedicineRequest />} />
                </Routes>
            </div>
        </div>
    )
}
