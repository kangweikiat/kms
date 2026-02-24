'use client'

import { useState, useActionState } from 'react'
import { enrollStudent } from '../../../actions'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface EnrollmentFormProps {
    studentId: string
    studentName: string
    availableYears?: { year: number; id: string; status: string }[]
}

export function EnrollmentForm({ studentId, studentName, availableYears = [] }: EnrollmentFormProps) {
    const [programCategory, setProgramCategory] = useState<'FULL' | 'HALF'>('HALF')
    const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>('MORNING')

    const enrollStudentWithId = enrollStudent.bind(null, studentId)
    const [state, action, isPending] = useActionState(enrollStudentWithId, null)

    const years = availableYears.length > 0 ? availableYears : [{ year: 2027, id: '1', status: 'ACTIVE' }]
    const activeYear = years.find(y => y.status === 'ACTIVE') || years[0]

    return (
        <form action={action} className="space-y-6">
            {state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {state.error}
                </div>
            )}

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        New Enrollment for {studentName}
                    </h2>
                    <p className="text-sm text-gray-500">Register this student for a new academic year.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Intake Year <span className="text-red-500">*</span></label>
                        <select name="enrollmentYear" required defaultValue={activeYear.year} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            {years.map(y => (
                                <option key={y.id} value={y.year}>{y.year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Level <span className="text-red-500">*</span></label>
                        <select name="enrollmentLevel" required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="">Select Level</option>
                            <option value="M2">M2 (2 Years)</option>
                            <option value="M3">M3 (3 Years)</option>
                            <option value="M4">M4 (4 Years)</option>
                            <option value="M5">M5 (5 Years)</option>
                            <option value="M6">M6 (6 Years)</option>
                        </select>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Remarks</label>
                        <textarea
                            name="remarks"
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Any additional information..."
                        />
                    </div>

                    {/* Dynamic Program Type Selection */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Program Category <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="programCategory"
                                        value="HALF"
                                        checked={programCategory === 'HALF'}
                                        onChange={() => setProgramCategory('HALF')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Half Day</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="programCategory"
                                        value="FULL"
                                        checked={programCategory === 'FULL'}
                                        onChange={() => setProgramCategory('FULL')}
                                        className="text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Full Day (8:00 AM - 5:30 PM)</span>
                                </label>
                            </div>
                        </div>

                        {programCategory === 'HALF' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Session <span className="text-red-500">*</span></label>
                                    <select
                                        name="session"
                                        value={session}
                                        onChange={(e) => setSession(e.target.value as 'MORNING' | 'AFTERNOON')}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    >
                                        <option value="MORNING">Morning (8:00 AM - 12:00 PM)</option>
                                        <option value="AFTERNOON">Afternoon (12:30 PM - 4:30 PM)</option>
                                    </select>
                                </div>

                                {session === 'MORNING' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Stay Back Option</label>
                                        <div className="flex items-center gap-4 mt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" name="stayBack" value="yes" className="text-blue-600 focus:ring-blue-500 rounded" />
                                                <span className="text-sm text-gray-700">Extended (until 2:00 PM)</span>
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">Only applicable for Half Day Morning programs.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Transport Required?</label>
                        <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="transport" value="yes" className="text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="transport" value="no" defaultChecked className="text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700">No</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 pb-12">
                <Link
                    href={`/admin/students/${studentId}`}
                    className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Enrolling...
                        </>
                    ) : (
                        'Confirm Enrollment'
                    )}
                </button>
            </div>
        </form>
    )
}
