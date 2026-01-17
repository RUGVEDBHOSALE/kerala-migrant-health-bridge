import { useState } from 'react'
import api from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

export default function WorkerSearch({ onSelectWorker }) {
    const [searchId, setSearchId] = useState('')
    const [worker, setWorker] = useState(null)
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSearch = async (e) => {
        e.preventDefault()
        if (!searchId.trim()) return

        setLoading(true)
        setError('')
        setWorker(null)
        setHistory([])

        try {
            // Fetch worker and history
            const [workerRes, historyRes] = await Promise.all([
                api.get(`/workers/${searchId}`),
                api.get(`/workers/${searchId}/history`)
            ])

            setWorker(workerRes.data.worker)
            setHistory(historyRes.data.history || [])
        } catch (err) {
            setError(err.response?.data?.error || 'Worker not found')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectForPrescription = () => {
        if (worker && onSelectWorker) {
            onSelectWorker(worker)
        }
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🔍 Search Worker by ID</h3>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
                <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value.toUpperCase())}
                    className="input-field flex-1"
                    placeholder="Enter Unique ID (e.g., MHB-2024-001)"
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" /> : 'Search'}
                </button>
            </form>

            {/* Demo IDs */}
            <div className="mb-4 flex flex-wrap gap-2">
                <span className="text-white/50 text-sm">Try:</span>
                {['MHB-2024-001', 'MHB-2024-002', 'MHB-2024-003'].map(id => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setSearchId(id)}
                        className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                    >
                        {id}
                    </button>
                ))}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 mb-4">
                    {error}
                </div>
            )}

            {/* Worker Card (Read-Only) */}
            {worker && (
                <div className="bg-white/5 rounded-xl p-5 border border-white/10 animate-slide-up">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">👷</span>
                                <h4 className="text-xl font-bold text-white">{worker.name}</h4>
                            </div>
                            <p className="text-sm text-green-400 font-mono">{worker.unique_id}</p>
                        </div>
                        <button
                            onClick={handleSelectForPrescription}
                            className="btn-primary text-sm"
                        >
                            📝 New Prescription
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <p className="text-white/50 text-xs uppercase mb-1">Age</p>
                            <p className="text-white">{worker.age || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-xs uppercase mb-1">Gender</p>
                            <p className="text-white">{worker.gender || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-xs uppercase mb-1">Origin</p>
                            <p className="text-white">{worker.origin_state || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-xs uppercase mb-1">District</p>
                            <p className="text-white">{worker.current_district || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Medical History (Read-Only) */}
                    {history.length > 0 && (
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <h5 className="text-sm font-semibold text-white/80 mb-3">
                                📋 Medical History ({history.length} records)
                            </h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {history.map((record) => (
                                    <div
                                        key={record.id}
                                        className="bg-white/5 rounded-lg p-3 text-sm"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-white font-medium">{record.diagnosis}</span>
                                            <span className="text-white/50 text-xs">
                                                {new Date(record.created_at).toLocaleDateString('en-IN')}
                                            </span>
                                        </div>
                                        <p className="text-white/60 text-xs">
                                            By: {record.doctor_name || 'Unknown'} • {record.hospital_name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {history.length === 0 && (
                        <p className="text-white/50 text-sm text-center py-4 border-t border-white/10 mt-4">
                            No previous medical records found
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}
