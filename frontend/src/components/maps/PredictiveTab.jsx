const KERALA_DISTRICTS = [
    'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
    'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad',
    'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'
]

// Mock predictions based on case data
const generatePredictions = (stats) => {
    const diseases = ['Dengue Fever', 'Malaria', 'Typhoid', 'Respiratory Infection', 'Gastroenteritis']

    return KERALA_DISTRICTS.map(district => {
        const existingCases = stats?.byDistrict?.find(d => d.district === district)
        const caseCount = existingCases ? parseInt(existingCases.count) : Math.floor(Math.random() * 10)

        // Calculate risk based on case count and mock seasonal factors
        const baseRisk = Math.min(95, 20 + caseCount * 8 + Math.random() * 20)
        const disease = diseases[Math.floor(Math.random() * diseases.length)]

        return {
            district,
            disease,
            risk: Math.round(baseRisk),
            trend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
            expectedCases: Math.floor(caseCount * (1 + Math.random() * 0.5)),
            confidence: Math.round(70 + Math.random() * 25)
        }
    }).sort((a, b) => b.risk - a.risk)
}

export default function PredictiveTab({ stats }) {
    const predictions = generatePredictions(stats)
    const highRiskCount = predictions.filter(p => p.risk >= 70).length

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">🔮 Predictive Analytics</h2>
                        <p className="text-white/60">AI-powered outbreak forecasting powered by Vertex AI</p>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                        <span className="text-purple-400 text-sm font-medium">✨ AI Model v2.1</span>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card border-l-4 border-red-500">
                    <div className="text-3xl font-bold text-red-400">{highRiskCount}</div>
                    <div className="text-white/60 text-sm">High Risk Districts</div>
                    <div className="text-red-400/60 text-xs mt-1">Require immediate monitoring</div>
                </div>
                <div className="stat-card border-l-4 border-yellow-500">
                    <div className="text-3xl font-bold text-yellow-400">
                        {predictions.filter(p => p.risk >= 50 && p.risk < 70).length}
                    </div>
                    <div className="text-white/60 text-sm">Moderate Risk</div>
                    <div className="text-yellow-400/60 text-xs mt-1">Enhanced surveillance needed</div>
                </div>
                <div className="stat-card border-l-4 border-green-500">
                    <div className="text-3xl font-bold text-green-400">
                        {predictions.filter(p => p.risk < 50).length}
                    </div>
                    <div className="text-white/60 text-sm">Low Risk</div>
                    <div className="text-green-400/60 text-xs mt-1">Normal monitoring</div>
                </div>
            </div>

            {/* Featured Prediction */}
            {predictions.length > 0 && (
                <div className="glass-card p-6 border-2 border-red-500/30 bg-red-500/5">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">⚠️</span>
                        <div>
                            <h3 className="text-xl font-bold text-white">Highest Alert: {predictions[0].district}</h3>
                            <p className="text-red-400 text-sm">Immediate attention recommended</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-white/50 text-xs uppercase">Disease</p>
                            <p className="text-white font-semibold">{predictions[0].disease}</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-xs uppercase">Risk Level</p>
                            <p className="text-red-400 font-bold text-2xl">{predictions[0].risk}%</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-xs uppercase">Expected Cases (7 Days)</p>
                            <p className="text-white font-semibold">{predictions[0].expectedCases}+</p>
                        </div>
                        <div>
                            <p className="text-white/50 text-xs uppercase">Confidence</p>
                            <p className="text-white font-semibold">{predictions[0].confidence}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* All Predictions */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">📊 District-wise Predictions</h3>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left text-white/50 text-xs uppercase p-3">District</th>
                                <th className="text-left text-white/50 text-xs uppercase p-3">Disease Risk</th>
                                <th className="text-left text-white/50 text-xs uppercase p-3">Risk Level</th>
                                <th className="text-left text-white/50 text-xs uppercase p-3">Trend</th>
                                <th className="text-left text-white/50 text-xs uppercase p-3">Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            {predictions.map((pred, i) => (
                                <tr key={pred.district} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-3">
                                        <span className="text-white font-medium">{pred.district}</span>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-white/80">{pred.disease}</span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 bg-white/10 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${pred.risk >= 70 ? 'bg-red-500' : pred.risk >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                        }`}
                                                    style={{ width: `${pred.risk}%` }}
                                                ></div>
                                            </div>
                                            <span className={`font-bold ${pred.risk >= 70 ? 'text-red-400' : pred.risk >= 50 ? 'text-yellow-400' : 'text-green-400'
                                                }`}>
                                                {pred.risk}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className={`badge ${pred.trend === 'increasing' ? 'badge-danger' : 'badge-safe'}`}>
                                            {pred.trend === 'increasing' ? '↑ Rising' : '↓ Falling'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <span className="text-white/60">{pred.confidence}%</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Model Info */}
            <div className="glass-card p-4 bg-purple-500/5 border border-purple-500/20">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🤖</span>
                    <div>
                        <p className="text-white text-sm">
                            <span className="font-semibold">Vertex AI Integration:</span> This is a mock-up demonstrating the predictive analytics interface.
                            In production, connect to Vertex AI AutoML for real outbreak forecasting.
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                            Model considers: historical case data, seasonal patterns, migration flows, climate data
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
