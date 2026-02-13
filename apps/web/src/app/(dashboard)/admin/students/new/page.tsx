import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { StudentForm } from './_components/student-form'

export default function NewStudentPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/students"
                    className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">New Student Intake</h1>
                    <p className="text-gray-500">Register a new student for the academic year</p>
                </div>
            </div>

            <StudentForm />
        </div>
    )
}
