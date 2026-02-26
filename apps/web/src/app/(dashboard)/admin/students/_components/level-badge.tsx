interface LevelBadgeProps {
    level: string
    className?: string
}

export function LevelBadge({ level, className = '' }: LevelBadgeProps) {
    const getBadgeStyle = (lvl: string) => {
        const lowerLvl = lvl.toLowerCase()
        if (lowerLvl === 'm2') return 'bg-purple-100 text-purple-800'
        if (lowerLvl === 'm3') return 'bg-green-100 text-green-800'
        if (lowerLvl === 'm4') return 'bg-red-100 text-red-800'
        if (lowerLvl === 'm5') return 'bg-blue-100 text-blue-800'
        if (lowerLvl === 'm6') return 'bg-yellow-100 text-yellow-800'
        return 'bg-gray-100 text-gray-800'
    }

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase transition ${getBadgeStyle(level)} ${className}`}>
            {level}
        </span>
    )
}
