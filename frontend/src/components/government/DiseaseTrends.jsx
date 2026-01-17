import { useEffect, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler)

export default function DiseaseTrends({ trends, stats }) {
    // Prepare data for bar chart (cases by district)
    const districtData = {
        labels: (stats?.byDistrict || []).slice(0, 8).map(d => d.district || 'Unknown'),
        datasets: [{
            label: 'Cases',
            data: (stats?.byDistrict || []).slice(0, 8).map(d => parseInt(d.count)),
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            borderRadius: 8,
        }]
    }

    // Prepare data for line chart (diagnosis trends)
    const diagnosisData = {
        labels: (stats?.byDiagnosis || []).slice(0, 6).map(d => d.diagnosis),
        datasets: [{
            label: 'Cases',
            data: (stats?.byDiagnosis || []).slice(0, 6).map(d => parseInt(d.count)),
            backgroundColor: 'rgba(13, 148, 136, 0.3)',
            borderColor: 'rgba(13, 148, 136, 1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
        }]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                cornerRadius: 8,
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: 'rgba(255, 255, 255, 0.6)' }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: 'rgba(255, 255, 255, 0.6)' }
            }
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cases by District */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📍 Cases by District</h3>
                <div className="h-64">
                    {stats?.byDistrict?.length > 0 ? (
                        <Bar data={districtData} options={options} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-white/50">
                            No district data available
                        </div>
                    )}
                </div>
            </div>

            {/* Cases by Diagnosis */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">🩺 Top Diagnoses</h3>
                <div className="h-64">
                    {stats?.byDiagnosis?.length > 0 ? (
                        <Line data={diagnosisData} options={options} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-white/50">
                            No diagnosis data available
                        </div>
                    )}
                </div>
            </div>

            {/* District Risk Overview */}
            <div className="glass-card p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">🚦 District Risk Levels</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {(stats?.byDistrict || []).slice(0, 14).map((district, i) => {
                        const count = parseInt(district.count)
                        const riskLevel = count > 10 ? 'danger' : count > 5 ? 'moderate' : 'safe'

                        return (
                            <div
                                key={district.district || i}
                                className={`p-3 rounded-xl text-center border ${riskLevel === 'danger'
                                        ? 'bg-red-500/10 border-red-500/30'
                                        : riskLevel === 'moderate'
                                            ? 'bg-yellow-500/10 border-yellow-500/30'
                                            : 'bg-green-500/10 border-green-500/30'
                                    }`}
                            >
                                <p className="text-white text-sm font-medium truncate">{district.district || 'Unknown'}</p>
                                <p className={`text-lg font-bold ${riskLevel === 'danger' ? 'text-red-400' : riskLevel === 'moderate' ? 'text-yellow-400' : 'text-green-400'
                                    }`}>
                                    {count}
                                </p>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
