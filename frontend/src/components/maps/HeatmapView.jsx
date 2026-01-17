import { useState, useCallback, useMemo } from 'react'
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api'

const KERALA_CENTER = { lat: 10.8505, lng: 76.2711 }
const KERALA_BOUNDS = {
    north: 12.8,
    south: 8.2,
    west: 74.8,
    east: 77.6
}

const mapContainerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '16px'
}

const darkMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'water', elementType: 'geometry.fill', stylers: [{ color: '#0e1626' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255d87' }] },
]

const libraries = ['visualization']

export default function HeatmapView({ data = [] }) {
    const [map, setMap] = useState(null)
    const [timeRange, setTimeRange] = useState('7d')

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries
    })

    const onLoad = useCallback((map) => {
        setMap(map)

        // Fit to Kerala bounds
        const bounds = new window.google.maps.LatLngBounds(
            { lat: KERALA_BOUNDS.south, lng: KERALA_BOUNDS.west },
            { lat: KERALA_BOUNDS.north, lng: KERALA_BOUNDS.east }
        )
        map.fitBounds(bounds)
    }, [])

    const heatmapData = useMemo(() => {
        if (!isLoaded || !window.google) return []

        return data.map(point => ({
            location: new window.google.maps.LatLng(point.lat, point.lng),
            weight: point.weight || 1
        }))
    }, [data, isLoaded])

    // Fallback if no API key
    const renderFallbackMap = () => (
        <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4">🗺️ Disease Heatmap - Kerala</h2>

            {/* SVG Map of Kerala */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 min-h-96">
                <svg viewBox="0 0 200 400" className="w-full h-80 mx-auto">
                    {/* Simplified Kerala outline */}
                    <path
                        d="M 100 20 Q 140 60 130 120 Q 120 180 110 220 Q 100 260 85 300 Q 70 340 80 380 Q 60 360 50 320 Q 40 280 50 240 Q 60 200 70 160 Q 80 120 90 80 Q 100 40 100 20"
                        fill="rgba(34, 197, 94, 0.2)"
                        stroke="rgba(34, 197, 94, 0.6)"
                        strokeWidth="2"
                    />

                    {/* Case markers based on data */}
                    {data.slice(0, 20).map((point, i) => {
                        const x = 50 + (point.lng - 76) * 50
                        const y = 400 - (point.lat - 8) * 80
                        const radius = Math.min(point.weight * 5, 20)
                        const color = point.weight > 5 ? '#ef4444' : point.weight > 2 ? '#eab308' : '#22c55e'

                        return (
                            <circle
                                key={i}
                                cx={Math.max(30, Math.min(170, x))}
                                cy={Math.max(30, Math.min(370, y))}
                                r={radius}
                                fill={color}
                                fillOpacity="0.6"
                                className="animate-pulse"
                            />
                        )
                    })}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-black/50 rounded-lg p-3">
                    <p className="text-white text-xs mb-2">Intensity</p>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-white/70">Low</span>
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-white/70">Medium</span>
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-white/70">High</span>
                    </div>
                </div>

                {/* Stats overlay */}
                <div className="absolute top-4 right-4 bg-black/50 rounded-lg p-3">
                    <p className="text-white font-semibold">{data.length} Hotspots</p>
                    <p className="text-white/60 text-xs">Last {timeRange}</p>
                </div>
            </div>

            <p className="text-white/50 text-sm mt-4 text-center">
                💡 Add VITE_GOOGLE_MAPS_API_KEY to .env for interactive Google Maps
            </p>
        </div>
    )

    if (loadError) {
        return renderFallbackMap()
    }

    if (!isLoaded) {
        return (
            <div className="glass-card p-6">
                <div className="flex items-center justify-center h-96">
                    <div className="text-white">Loading map...</div>
                </div>
            </div>
        )
    }

    // Check if API key is available
    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        return renderFallbackMap()
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="glass-card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">🗺️ Disease Surveillance Heatmap</h2>
                        <p className="text-white/60">Real-time visualization of case distribution across Kerala</p>
                    </div>

                    {/* Time Range Filter */}
                    <div className="flex gap-2">
                        {['24h', '7d', '30d'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${timeRange === range
                                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                    }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="glass-card p-4 overflow-hidden">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={KERALA_CENTER}
                    zoom={7}
                    onLoad={onLoad}
                    options={{
                        styles: darkMapStyle,
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                >
                    {heatmapData.length > 0 && (
                        <HeatmapLayer
                            data={heatmapData}
                            options={{
                                radius: 30,
                                opacity: 0.7,
                                gradient: [
                                    'rgba(0, 255, 0, 0)',
                                    'rgba(0, 255, 0, 1)',
                                    'rgba(255, 255, 0, 1)',
                                    'rgba(255, 165, 0, 1)',
                                    'rgba(255, 0, 0, 1)'
                                ]
                            }}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* Legend & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4">
                    <h4 className="text-white font-medium mb-3">Legend</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-500"></div>
                            <span className="text-white/70 text-sm">Safe (0-2 cases)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                            <span className="text-white/70 text-sm">Moderate (3-5 cases)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-500"></div>
                            <span className="text-white/70 text-sm">High Density (6+ cases)</span>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-4">
                    <h4 className="text-white font-medium mb-2">Total Hotspots</h4>
                    <p className="text-3xl font-bold text-green-400">{data.length}</p>
                    <p className="text-white/50 text-sm">Active in last {timeRange}</p>
                </div>

                <div className="glass-card p-4">
                    <h4 className="text-white font-medium mb-2">High Risk Areas</h4>
                    <p className="text-3xl font-bold text-red-400">
                        {data.filter(d => d.weight > 5).length}
                    </p>
                    <p className="text-white/50 text-sm">Require immediate attention</p>
                </div>
            </div>
        </div>
    )
}
