import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    description: string
    icon: LucideIcon
    className?: string
}

export function StatCard({ title, value, description, icon: Icon, className }: StatCardProps) {
    return (
        <div className={`p-6 bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">{description}</p>
        </div>
    )
}
