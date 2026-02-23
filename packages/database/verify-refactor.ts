import { prisma } from './src'

async function main() {
    console.log('🔄 Starting Verification...')

    // 1. Create a Test Student with Enrollment
    console.log('\n1. Creating Test Student...')
    const student = await prisma.student.create({
        data: {
            firstName: 'Test',
            lastName: 'Student',
            icNo: 'TEST-IC-' + Date.now(),
            dob: new Date(),
            gender: 'Male',
            race: 'Malay',
            enrollments: {
                create: {
                    academicYear: 2026,
                    enrollmentLevel: 'M2',
                    programType: 'HALF_DAY_MORNING',
                    status: 'ACTIVE',
                }
            }
        },
        include: {
            enrollments: true
        }
    })

    console.log(`✅ Student Created: ${student.firstName} ${student.lastName} (${student.id})`)

    if (student.enrollments.length !== 1) {
        throw new Error(`❌ Expected 1 enrollment, found ${student.enrollments.length}`)
    }
    const firstEnrollment = student.enrollments[0]
    if (firstEnrollment.academicYear !== 2026 || firstEnrollment.status !== 'ACTIVE') {
        throw new Error(`❌ Enrollment data mismatch: ${JSON.stringify(firstEnrollment)}`)
    }
    console.log('✅ Initial Enrollment Verified')


    // 2. Add a Second Enrollment (simulating "Enroll New Year")
    console.log('\n2. Adding Second Enrollment (2027)...')
    const secondEnrollment = await prisma.enrollment.create({
        data: {
            studentId: student.id,
            academicYear: 2027,
            enrollmentLevel: 'M3',
            programType: 'FULL_DAY',
            status: 'ACTIVE'
        }
    })

    const updatedStudent = await prisma.student.findUnique({
        where: { id: student.id },
        include: { enrollments: { orderBy: { academicYear: 'asc' } } }
    })

    if (updatedStudent?.enrollments.length !== 2) {
        throw new Error(`❌ Expected 2 enrollments, found ${updatedStudent?.enrollments.length}`)
    }
    console.log('✅ Second Enrollment Verified')
    console.log('   Enrollments:', updatedStudent.enrollments.map(e => `${e.academicYear} (${e.enrollmentLevel})`).join(', '))

    // 3. Cleanup
    console.log('\n3. Cleaning up...')
    // Delete enrollments first if cascade isn't set up (though it should be via relation)
    // Actually Prisma handles cascade delete if configured in schema, check schema.
    // Schema: student Student @relation(fields: [studentId], references: [id])
    // It doesn't explicitly say onDelete: Cascade, so we might need to delete enrollments first.

    await prisma.enrollment.deleteMany({
        where: { studentId: student.id }
    })
    await prisma.student.delete({
        where: { id: student.id }
    })
    console.log('✅ Cleanup Complete')

    console.log('\n✨ VERIFICATION SUCCESSFUL! The refactor supports multiple enrollments correctly.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
