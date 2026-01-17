import LoadingSpinner from '../common/LoadingSpinner'

export default function DashboardStats({ stats, loading }) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="stat-card flex items-center justify-center min-h-28">
                        <LoadingSpinner size="sm" />
                    </div>
                ))}
            </div>
        )
    }

    const statCards = [
        {
            icon: '📊',
            value: stats?.totalCases || 0,
            label: 'Total Cases (7 Days)',
            trend: '+12%',
            trendUp: true
        },
        {
            icon: '🔥',
            value: stats?.todayCases || 0,
            label: 'Cases Today',
            trend: stats?.todayCases > 10 ? 'High' : 'Normal',
            trendUp: stats?.todayCases > 10
        },
        {
            icon: '👷',
            value: stats?.activeWorkers || 0,
            label: 'Workers Treated',
            trend: 'Active',
            trendUp: false
        },
        {
            icon: '🗺️',
            value: stats?.byDistrict?.length || 0,
            label: 'Districts Affected',
            trend: `of 14`,
            trendUp: null
        }
    ]

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
                <div key={i} className="stat-card">
                    <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{stat.icon}</span>
                        {stat.trendUp !== null && (
                            <span className={`badge ${stat.trendUp ? 'badge-danger' : 'badge-safe'}`}>
                                {stat.trend}
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">
                        {stat.value.toLocaleString()}
                    </div>
                    <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
            ))}
        </div>
    )
}
