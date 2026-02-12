'use client'

import { useState, useMemo } from 'react'
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { format, startOfMonth, parseISO } from 'date-fns'

interface EnrollmentGrowthChartProps {
    data: {
        date: string
    }[]
    intakeYear: number
}

type ViewType = 'day' | 'month'

export function EnrollmentGrowthChart({ data, intakeYear }: EnrollmentGrowthChartProps) {
    const [viewType, setViewType] = useState<ViewType>('day')

    // Process data based on selection
    const chartData = useMemo(() => {
        // 1. Sort by date
        const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        if (sortedData.length === 0) return []

        // 2. Aggregate
        const aggregated: Record<string, number> = {}

        sortedData.forEach(item => {
            const date = parseISO(item.date)
            let key = ''

            if (viewType === 'day') {
                key = format(date, 'yyyy-MM-dd')
            } else {
                key = format(startOfMonth(date), 'yyyy-MM-01')
            }

            aggregated[key] = (aggregated[key] || 0) + 1
        })

        // 3. Convert to Cumulative Array
        // For 2026, we assume a base of 200. For future years (2027), we start at 0.
        let runningTotal = intakeYear === 2026 ? 200 : 0

        const result = Object.entries(aggregated)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([dateKey, count]) => {
                runningTotal += count
                return {
                    date: dateKey,
                    students: runningTotal,
                }
            })

        return result
    }, [data, viewType, intakeYear])

    return (
        <div className="h-[350px] w-full flex flex-col">
            {/* Controls */}
            <div className="flex items-center justify-end mb-4">
                {/* View Type Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewType('day')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewType === 'day'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Days
                    </button>
                    <button
                        onClick={() => setViewType('month')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewType === 'month'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Months
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(str) => {
                                    const d = parseISO(str)
                                    return viewType === 'day' ? format(d, 'd MMM') : format(d, 'MMM yyyy')
                                }}
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: '#6b7280' }}
                                tickLine={false}
                                axisLine={false}
                                domain={['dataMin - 10', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '8px',
                                    border: 'none',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                }}
                                labelFormatter={(label) => format(parseISO(label), viewType === 'day' ? 'MMMM d, yyyy' : 'MMMM yyyy')}
                            />
                            <Area
                                type="monotone"
                                dataKey="students"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorStudents)"
                                name="Cumulative Enrollment"
                                animationDuration={1000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p>No enrollment data found.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
