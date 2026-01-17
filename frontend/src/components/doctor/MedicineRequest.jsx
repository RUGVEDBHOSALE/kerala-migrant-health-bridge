import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import LoadingSpinner from '../common/LoadingSpinner'

const COMMON_MEDICINES = [
    'Paracetamol', 'Artemether', 'Chloroquine', 'Ciprofloxacin',
    'Amoxicillin', 'ORS Sachets', 'IV Fluids', 'Antipyretics',
    'Azithromycin', 'Doxycycline', 'Metronidazole', 'Cetirizine'
]

const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
    'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
]

export default function MedicineRequest() {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [medicines, setMedicines] = useState([{ name: '', quantity: '' }])
    const [district, setDistrict] = useState('')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const addMedicine = () => {
        setMedicines([...medicines, { name: '', quantity: '' }])
    }

    const removeMedicine = (index) => {
        if (medicines.length > 1) {
            setMedicines(medicines.filter((_, i) => i !== index))
        }
    }

    const updateMedicine = (index, field, value) => {
        const updated = [...medicines]
        updated[index][field] = value
        setMedicines(updated)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const validMedicines = medicines.filter(m => m.name.trim() && m.quantity)

            if (validMedicines.length === 0) {
                throw new Error('At least one medicine with quantity is required')
            }

            if (!district) {
                throw new Error('Please select a district')
            }

            await api.post('/medicine/request', {
                medicines: validMedicines.map(m => ({
                    name: m.name.trim(),
                    quantity: parseInt(m.quantity)
                })),
                district,
                notes
            })

            setSuccess(true)

            setTimeout(() => {
                setMedicines([{ name: '', quantity: '' }])
                setDistrict('')
                setNotes('')
                setSuccess(false)
                navigate('/doctor')
            }, 2000)

        } catch (err) {
            setError(err.message || err.response?.data?.error || 'Failed to submit request')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="glass-card p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">💊 Medicine Requisition</h2>
                        <p className="text-white/60 text-sm">
                            Request medicine supplies from the government health department
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/doctor')}
                        className="btn-secondary"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="glass-card p-6 mb-6 border-2 border-green-500/50 bg-green-500/10">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">✅</span>
                        <div>
                            <p className="text-white font-semibold text-lg">Request Submitted Successfully!</p>
                            <p className="text-white/60 text-sm">The health department will review your request.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hospital Info */}
                <div className="glass-card p-6 border-l-4 border-green-500">
                    <p className="text-white/50 text-sm mb-1">Requesting From:</p>
                    <p className="text-white font-semibold">{user?.hospitalName || 'Unknown Hospital'}</p>
                    <p className="text-white/60 text-sm">{user?.name}</p>
                </div>

                {/* District Selection */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">📍 Delivery District</h3>
                    <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="input-field"
                        required
                    >
                        <option value="">Select District</option>
                        {KERALA_DISTRICTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Medicine List */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">💊 Medicines Required</h3>
                        <button
                            type="button"
                            onClick={addMedicine}
                            className="text-sm text-green-400 hover:text-green-300"
                        >
                            + Add Medicine
                        </button>
                    </div>

                    {/* Quick Select */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className="text-white/50 text-sm">Quick add:</span>
                        {COMMON_MEDICINES.map(m => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => {
                                    if (!medicines.some(med => med.name === m)) {
                                        setMedicines([...medicines.filter(med => med.name), { name: m, quantity: '' }])
                                    }
                                }}
                                className="text-xs px-2 py-1 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                            >
                                {m}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {medicines.map((med, index) => (
                            <div key={index} className="flex gap-3 bg-white/5 rounded-xl p-4">
                                <input
                                    type="text"
                                    value={med.name}
                                    onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                                    className="input-field flex-1"
                                    placeholder="Medicine name"
                                />
                                <input
                                    type="number"
                                    value={med.quantity}
                                    onChange={(e) => updateMedicine(index, 'quantity', e.target.value)}
                                    className="input-field w-32"
                                    placeholder="Quantity"
                                    min="1"
                                />
                                {medicines.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMedicine(index)}
                                        className="text-red-400 hover:text-red-300 px-2"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">📝 Additional Notes</h3>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="input-field min-h-24"
                        placeholder="Any urgent requirements or special instructions..."
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400">
                        {error}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading || success}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg"
                >
                    {loading ? <LoadingSpinner size="sm" /> : success ? '✅ Submitted!' : '📤 Submit Request'}
                </button>
            </form>
        </div>
    )
}
