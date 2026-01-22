import { useState } from 'react'
import api from '../../services/api'

const CAMP_TYPES = [
    'General Checkup',
    'Dengue Checkup',
    'COVID-19',
    'Malaria Screening',
    'Eye Camp',
    'Dental Camp',
    'Vaccination Drive',
    'Blood Donation'
]

export default function HealthCampModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        camp_name: '',
        camp_type: 'General Checkup',
        location_name: '',
        latitude: '',
        longitude: '',
        maps_link: '',
        scheduled_date: '',
        description: ''
    })

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const payload = {
                ...formData,
                latitude: formData.latitude ? parseFloat(formData.latitude) : null,
                longitude: formData.longitude ? parseFloat(formData.longitude) : null
            }

            await api.post('/health-camps', payload)

            // Reset form and close modal
            setFormData({
                camp_name: '',
                camp_type: 'General Checkup',
                location_name: '',
                latitude: '',
                longitude: '',
                maps_link: '',
                scheduled_date: '',
                description: ''
            })
            onSuccess?.()
            onClose()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create health camp')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">🏕️</span>
                        <h2 className="text-xl font-bold text-white">Setup Health Camp</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Camp Name */}
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Camp Name *</label>
                        <input
                            type="text"
                            name="camp_name"
                            value={formData.camp_name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Dengue Awareness Camp"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                        />
                    </div>

                    {/* Camp Type */}
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Camp Type *</label>
                        <select
                            name="camp_type"
                            value={formData.camp_type}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                        >
                            {CAMP_TYPES.map(type => (
                                <option key={type} value={type} className="bg-slate-800">
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Location Name */}
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Location Name *</label>
                        <input
                            type="text"
                            name="location_name"
                            value={formData.location_name}
                            onChange={handleChange}
                            required
                            placeholder="e.g., Ernakulam Town Hall"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-white/70 text-sm mb-1">Latitude</label>
                            <input
                                type="number"
                                step="any"
                                name="latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                placeholder="e.g., 9.9816"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-white/70 text-sm mb-1">Longitude</label>
                            <input
                                type="number"
                                step="any"
                                name="longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                placeholder="e.g., 76.2999"
                                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                            />
                        </div>
                    </div>
                    <p className="text-white/40 text-xs">
                        💡 Tip: Get coordinates from Google Maps by right-clicking on a location
                    </p>

                    {/* Google Maps Link */}
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Google Maps Link (optional)</label>
                        <input
                            type="url"
                            name="maps_link"
                            value={formData.maps_link}
                            onChange={handleChange}
                            placeholder="https://maps.google.com/..."
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none"
                        />
                    </div>

                    {/* Date & Time */}
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Date & Time *</label>
                        <input
                            type="datetime-local"
                            name="scheduled_date"
                            value={formData.scheduled_date}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-cyan-400 focus:outline-none"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-white/70 text-sm mb-1">Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Additional details about the camp..."
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-cyan-400 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : '🏕️ Create Camp'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
