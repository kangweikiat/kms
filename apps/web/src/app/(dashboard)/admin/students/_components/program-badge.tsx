import { ProgramType } from '@kms/database'

interface ProgramBadgeProps {
    type: string // Using string to be flexible with prisma output, but conceptually ProgramType
}

export function ProgramBadge({ type }: ProgramBadgeProps) {
    const getStyle = (type: string) => {
        switch (type) {
            case 'FULL_DAY':
                return 'bg-yellow-100 text-yellow-800'
            case 'HALF_DAY_MORNING':
                return 'bg-blue-100 text-blue-800'
            case 'HALF_DAY_AFTERNOON':
                return 'bg-orange-100 text-orange-800'
            case 'MORNING_STAY_BACK':
                return 'bg-purple-100 text-purple-800'
            case 'AFTERNOON_STAY_BACK':
                return 'bg-pink-100 text-pink-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getLabel = (type: string) => {
        switch (type) {
            case 'FULL_DAY':
                return '8:00 am to 5:30 pm'
            case 'HALF_DAY_MORNING':
                return '8am to 12pm'
            case 'HALF_DAY_AFTERNOON':
                return '12:30 pm to 4:30 pm'
            case 'MORNING_STAY_BACK':
                return '8am to 2pm'
            case 'AFTERNOON_STAY_BACK':
                return 'Afternoon + Stay Back' // Legacy/Unused
            default:
                return type.replace(/_/g, ' ')
        }
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStyle(type)}`}>
            {getLabel(type)}
        </span>
    )
}
