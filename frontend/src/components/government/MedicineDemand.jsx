import { useState, useEffect } from 'react'
import api from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

export default function MedicineDemand() {
    const [requests, setRequests] = useState([])
    const [stats, setStats] = useState({})
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchRequests()
    }, [filter])

    const fetchRequests = async () => {
        try {
            const params = filter !== 'all' ? { status: filter } : {}
            const response = await api.get('/medicine/requests', { params })
            setRequests(response.data.requests || [])
            setStats(response.data.stats || {})
        } catch (error) {
            console.error('Error fetching requests:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/medicine/request/${id}`, { status })
            fetchRequests()
        } catch (error) {
            console.error('Error updating status:', error)
        }
    }

    const statusColors = {
        pending: 'badge-pending',
        approved: 'badge-moderate',
        fulfilled: 'badge-safe',
        rejected: 'badge-danger'
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-2">💊 Medicine Demand Management</h2>
                <p className="text-white/60">Review and manage medicine requisition requests from hospitals</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-card">
                    <div className="text-2xl font-bold text-blue-400">{stats.pending || 0}</div>
                    <div className="text-white/60 text-sm">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="text-2xl font-bold text-yellow-400">{stats.approved || 0}</div>
                    <div className="text-white/60 text-sm">Approved</div>
                </div>
                <div className="stat-card">
                    <div className="text-2xl font-bold text-green-400">{stats.fulfilled || 0}</div>
                    <div className="text-white/60 text-sm">Fulfilled</div>
                </div>
                <div className="stat-card">
                    <div className="text-2xl font-bold text-red-400">{stats.rejected || 0}</div>
                    <div className="text-white/60 text-sm">Rejected</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'fulfilled', 'rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === status
                                ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="glass-card p-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12 text-white/50">
                        No requests found
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(request => (
                            <div key={request.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xl">🏥</span>
                                            <div>
                                                <p className="text-white font-semibold">{request.hospital_name}</p>
                                                <p className="text-white/50 text-sm">{request.district}</p>
                                            </div>
                                            <span className={`badge ${statusColors[request.status]}`}>
                                                {request.status}
                                            </span>
                                        </div>

                                        <div className="mt-3">
                                            <p className="text-white/50 text-xs uppercase mb-2">Requested Medicines:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(typeof request.medicines === 'string'
                                                    ? JSON.parse(request.medicines)
                                                    : request.medicines
                                                ).map((med, i) => (
                                                    <span key={i} className="px-3 py-1 rounded-lg bg-white/10 text-white text-sm">
                                                        {med.name} × {med.quantity}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-white/40 text-xs mt-3">
                                            Requested by: {request.doctor_name || 'Unknown'} • {new Date(request.created_at).toLocaleString()}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    {request.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => updateStatus(request.id, 'approved')}
                                                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm font-medium"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => updateStatus(request.id, 'rejected')}
                                                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm font-medium"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                    {request.status === 'approved' && (
                                        <button
                                            onClick={() => updateStatus(request.id, 'fulfilled')}
                                            className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 text-sm font-medium"
                                        >
                                            Mark Fulfilled
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
