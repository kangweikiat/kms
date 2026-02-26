import Link from 'next/link'

interface ClassBadgeProps {
    classData: {
        id: string
        name: string
    }
    className?: string
}

export function ClassBadge({ classData, className = '' }: ClassBadgeProps) {
    const getBadgeStyle = (name: string) => {
        const lowerName = name.toLowerCase()

        if (lowerName.includes('blue') || lowerName.includes('biru')) {
            return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200'
        }
        if (lowerName.includes('red') || lowerName.includes('merah')) {
            return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200'
        }
        if (lowerName.includes('green') || lowerName.includes('hijau')) {
            return 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200'
        }
        if (lowerName.includes('yellow') || lowerName.includes('kuning')) {
            return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200'
        }
        if (lowerName.includes('pink') || lowerName.includes('merah jambu')) {
            return 'bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-200'
        }
        if (lowerName.includes('purple') || lowerName.includes('ungu')) {
            return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200'
        }
        if (lowerName.includes('orange') || lowerName.includes('jingga')) {
            return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200'
        }
        if (lowerName.includes('teal')) {
            return 'bg-teal-100 text-teal-800 hover:bg-teal-200 border-teal-200'
        }
        if (lowerName.includes('indigo')) {
            return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200'
        }
        if (lowerName.includes('cyan')) {
            return 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border-cyan-200'
        }

        // Fallback or generic class style
        return 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200'
    }

    const style = getBadgeStyle(classData.name)

    return (
        <Link
            href={`/admin/classes/${classData.id}`}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition ${style} ${className}`}
        >
            {classData.name}
        </Link>
    )
}
