import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import VoiceRecorder from './VoiceRecorder'
import LoadingSpinner from '../common/LoadingSpinner'

const COMMON_DIAGNOSES = [
    'Dengue Fever', 'Malaria', 'Typhoid', 'Respiratory Infection',
    'Gastroenteritis', 'Skin Infection', 'Heat Stroke', 'Dehydration',
    'Viral Fever', 'Tuberculosis'
]

const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
    'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
]

export default function PrescriptionForm({ worker, onClearWorker }) {
    const { user } = useAuth()
    const navigate = useNavigate()

    const [diagnosis, setDiagnosis] = useState('')
    const [medications, setMedications] = useState([{ name: '', dosage: '', frequency: '' }])
    const [district, setDistrict] = useState(worker?.current_district || '')
    const [voiceData, setVoiceData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const addMedication = () => {
        setMedications([...medications, { name: '', dosage: '', frequency: '' }])
    }

    const removeMedication = (index) => {
        if (medications.length > 1) {
            setMedications(medications.filter((_, i) => i !== index))
        }
    }

    const updateMedication = (index, field, value) => {
        const updated = [...medications]
        updated[index][field] = value
        setMedications(updated)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const validMedications = medications.filter(m => m.name.trim())

            if (!diagnosis.trim()) {
                throw new Error('Diagnosis is required')
            }

            if (validMedications.length === 0) {
                throw new Error('At least one medication is required')
            }

            // Upload voice note if exists
            let voiceNoteUrl = null
            if (voiceData?.audioBlob) {
                const formData = new FormData()
                formData.append('audio', voiceData.audioBlob, 'voice-note.webm')
                const uploadRes = await api.post('/uploads/voice-note', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                })
                voiceNoteUrl = uploadRes.data.url
            }

            // Submit case
            await api.post('/cases', {
                workerUniqueId: worker?.unique_id,
                diagnosis: diagnosis.trim(),
                medications: validMedications,
                voiceNoteUrl,
                district,
                latitude: worker?.latitude || 10.0 + Math.random(),
                longitude: worker?.longitude || 76.0 + Math.random()
            })

            setSuccess(true)

            // Reset form after 2 seconds
            setTimeout(() => {
                setDiagnosis('')
                setMedications([{ name: '', dosage: '', frequency: '' }])
                setVoiceData(null)
                setSuccess(false)
                if (onClearWorker) onClearWorker()
                navigate('/doctor')
            }, 2000)

        } catch (err) {
            setError(err.message || err.response?.data?.error || 'Failed to submit prescription')
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
                        <h2 className="text-2xl font-bold text-white mb-1">📝 New Prescription</h2>
                        <p className="text-white/60 text-sm">
                            Prescribing as: <span className="text-green-400">{user?.name}</span> • {user?.hospitalName}
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

            {/* Worker Info */}
            {worker && (
                <div className="glass-card p-4 mb-6 border-2 border-green-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">👷</span>
                            <div>
                                <p className="text-white font-semibold">{worker.name}</p>
                                <p className="text-green-400 text-sm font-mono">{worker.unique_id}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClearWorker}
                            className="text-white/60 hover:text-white text-sm"
                        >
                            Change Patient
                        </button>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {success && (
                <div className="glass-card p-6 mb-6 border-2 border-green-500/50 bg-green-500/10">
                    <div className="flex items-center gap-3">
                        <span className="text-4xl">✅</span>
                        <div>
                            <p className="text-white font-semibold text-lg">Prescription Submitted Successfully!</p>
                            <p className="text-white/60 text-sm">Redirecting to dashboard...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Prescription Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Diagnosis */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">🩺 Diagnosis</h3>

                    <input
                        type="text"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="input-field mb-3"
                        placeholder="Enter diagnosis"
                        required
                    />

                    <div className="flex flex-wrap gap-2">
                        <span className="text-white/50 text-sm">Quick select:</span>
                        {COMMON_DIAGNOSES.map(d => (
                            <button
                                key={d}
                                type="button"
                                onClick={() => setDiagnosis(d)}
                                className={`text-xs px-2 py-1 rounded-lg transition-colors ${diagnosis === d
                                        ? 'bg-green-500 text-white'
                                        : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
                                    }`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Medications */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">💊 Medications</h3>
                        <button
                            type="button"
                            onClick={addMedication}
                            className="text-sm text-green-400 hover:text-green-300"
                        >
                            + Add Medication
                        </button>
                    </div>

                    <div className="space-y-3">
                        {medications.map((med, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-3 bg-white/5 rounded-xl p-4">
                                <input
                                    type="text"
                                    value={med.name}
                                    onChange={(e) => updateMedication(index, 'name', e.target.value)}
                                    className="input-field flex-1"
                                    placeholder="Medicine name"
                                />
                                <input
                                    type="text"
                                    value={med.dosage}
                                    onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                                    className="input-field md:w-32"
                                    placeholder="Dosage"
                                />
                                <select
                                    value={med.frequency}
                                    onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                                    className="input-field md:w-40"
                                >
                                    <option value="">Frequency</option>
                                    <option value="OD">Once Daily (OD)</option>
                                    <option value="BD">Twice Daily (BD)</option>
                                    <option value="TDS">Thrice Daily (TDS)</option>
                                    <option value="QID">Four Times (QID)</option>
                                    <option value="SOS">As Needed (SOS)</option>
                                </select>
                                {medications.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMedication(index)}
                                        className="text-red-400 hover:text-red-300 px-2"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* District */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">📍 Location</h3>
                    <select
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="input-field"
                    >
                        <option value="">Select District</option>
                        {KERALA_DISTRICTS.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </div>

                {/* Voice Note */}
                <div className="glass-card p-6">
                    <VoiceRecorder onRecordingComplete={setVoiceData} />
                </div>

                {/* Doctor Attribution */}
                <div className="glass-card p-4 bg-white/5">
                    <p className="text-white/50 text-sm">
                        📋 This prescription will be attributed to: <span className="text-white">{user?.name}</span> ({user?.hospitalId || 'ID'}) • <span className="text-white">{user?.hospitalName}</span>
                    </p>
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
                    {loading ? <LoadingSpinner size="sm" /> : success ? '✅ Submitted!' : '📤 Submit Prescription'}
                </button>
            </form>
        </div>
    )
}
