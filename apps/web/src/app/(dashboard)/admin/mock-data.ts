import { subDays, subYears, addDays } from 'date-fns'

// Configuration
const TOTAL_STUDENTS = 299
const START_DATE = new Date('2026-01-01')

// Class Levels and Colors
const LEVELS = [
    { name: 'M2', age: 2 },
    { name: 'M3', age: 3 },
    { name: 'M4', age: 4 },
    { name: 'M5', age: 5 },
    { name: 'M6', age: 6 },
]

const COLORS = ['Red', 'Blue', 'Yellow', 'Green']

// Generate Classes
export const mockClasses = LEVELS.flatMap(level =>
    COLORS.map(color => ({
        id: `${level.name}-${color}`,
        name: `${level.name} ${color}`,
        level: level.name
    }))
)

// Generate Students
const generateMockStudents = () => {
    const students = []

    // ------------------------------------------------------------------
    // 2026 Intake (Current Academic Year)
    // Distributed Registration:
    // - Starts June 2025 (Early Birds)
    // - Peaks Nov/Dec 2025 (Year End Rush)
    // - Continues Jan 2026 (Start of Term)
    // ------------------------------------------------------------------

    // 1. Early Registration (June 2025 - Dec 2025)
    const earlyRegConfig = [
        { month: 5, year: 2025, count: 3 },   // June: ~3 students
        { month: 6, year: 2025, count: 10 },  // July: ~10 students
        { month: 7, year: 2025, count: 15 },  // Aug
        { month: 8, year: 2025, count: 20 },  // Sep
        { month: 9, year: 2025, count: 35 },  // Oct
        { month: 10, year: 2025, count: 45 }, // Nov (Peak)
        { month: 11, year: 2025, count: 40 }, // Dec
    ]

    earlyRegConfig.forEach(config => {
        const daysInMonth = new Date(config.year, config.month + 1, 0).getDate()

        // Distribute 'count' students randomly across the month
        for (let i = 0; i < config.count; i++) {
            const day = Math.floor(Math.random() * daysInMonth) + 1
            const date = new Date(config.year, config.month, day)
            // Add some variation to time of day just in case
            date.setHours(9 + Math.floor(Math.random() * 8))
            students.push(createRandomStudent(date, 2026))
        }
    })

    // 2. Start of Term (Jan 2026)
    // The "Late Joiners" or "Just in time" crowd
    const daysInJan = 31
    for (let i = 1; i <= daysInJan; i++) {
        const date = new Date(2026, 0, i)
        const isMonday = date.getDay() === 1
        // Fewer daily joiners now since many joined earlier
        const dailyJoiners = Math.floor(Math.random() * (isMonday ? 4 : 2))

        for (let j = 0; j < dailyJoiners; j++) {
            students.push(createRandomStudent(date, 2026))
        }
    }

    // 3. Stragglers (Feb - May 2026)
    for (let m = 1; m < 5; m++) {
        const days = new Date(2026, m + 1, 0).getDate()
        for (let d = 1; d <= days; d++) {
            if (Math.random() > 0.95) { // Rare joiner
                students.push(createRandomStudent(new Date(2026, m, d), 2026))
            }
        }
    }

    // ------------------------------------------------------------------
    // 2027 Intake (Next Academic Year)
    // ------------------------------------------------------------------
    // Parents start registering from June 2026 onwards for 2027
    // Keeping this to show correct "intakeYear" functionality if we re-enable filters later
    for (let m = 5; m < 12; m++) { // June to Dec
        const days = new Date(2026, m + 1, 0).getDate()
        for (let d = 1; d <= days; d++) {
            const chance = m > 8 ? 0.2 : 0.05
            if (Math.random() < chance) {
                const date = new Date(2026, m, d)
                students.push(createRandomStudent(date, 2027))
            }
        }
    }

    return students.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

function createRandomStudent(createdAt: Date, intakeYear: number) {
    const ageRand = Math.random()
    let age = 4
    if (ageRand < 0.15) age = 2
    else if (ageRand < 0.3) age = 3
    else if (ageRand < 0.6) age = 4
    else if (ageRand < 0.85) age = 5
    else age = 6

    const referenceDate = new Date(intakeYear, 0, 1)
    const dob = subYears(referenceDate, age)

    return {
        id: `student-${Math.random().toString(36).substr(2, 9)}`,
        dob: dob,
        createdAt: createdAt,
        intakeYear: intakeYear
    }
}

export const mockStudents = generateMockStudents()
