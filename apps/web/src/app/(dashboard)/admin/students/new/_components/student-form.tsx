'use client'

import { useState, useActionState } from 'react'
import { createStudent, updateStudent } from '../../actions'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Student } from '@kms/database'

interface StudentFormProps {
    student?: Student & {
        programType: string
    }
}

export function StudentForm({ student }: StudentFormProps) {
    // Determine initial program category based on student.programType
    const initialCategory = student?.programType === 'FULL_DAY' ? 'FULL' : 'HALF'
    const [programCategory, setProgramCategory] = useState<'FULL' | 'HALF'>(initialCategory)

    const initialSession = student?.programType.includes('MORNING') ? 'MORNING' : 'AFTERNOON'
    const initialStayBack = student?.programType.includes('STAY_BACK')

    // Bind the action if updating, otherwise use create
    const actionFn = student ? updateStudent.bind(null, student.id) : createStudent
    const [state, action, isPending] = useActionState(actionFn, null)

    return (
        <form action={action} className="space-y-6">
            {state?.error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                    {state.error}
                </div>
            )}
            {/* 1. Student Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Student Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
                        <input name="firstName" required type="text" defaultValue={student?.firstName} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
                        <input name="lastName" required type="text" defaultValue={student?.lastName} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Doe" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">IC / MyKid Number <span className="text-red-500">*</span></label>
                        <input name="icNo" required type="text" defaultValue={student?.icNo} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 150214-10-1234" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                        <input name="dob" required type="date" defaultValue={student?.dob ? new Date(student.dob).toISOString().split('T')[0] : ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
                        <select name="gender" required defaultValue={student?.gender} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Race <span className="text-red-500">*</span></label>
                        <select name="race" required defaultValue={student?.race} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="">Select Race</option>
                            <option value="Malay">Malay</option>
                            <option value="Chinese">Chinese</option>
                            <option value="Indian">Indian</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Residential Address</label>
                        <textarea name="address" rows={3} defaultValue={student?.address || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Full residential address" />
                    </div>
                </div>
            </div>

            {/* 2. Enrollment Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Enrollment Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Intake Year <span className="text-red-500">*</span></label>
                        <select name="enrollmentYear" required defaultValue={student?.enrollmentYear || 2026} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Level <span className="text-red-500">*</span></label>
                        <select name="enrollmentLevel" required defaultValue={student?.enrollmentLevel} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="M2">M2 (2 Years)</option>
                            <option value="M3">M3 (3 Years)</option>
                            <option value="M4">M4 (4 Years)</option>
                            <option value="M5">M5 (5 Years)</option>
                            <option value="M6">M6 (6 Years)</option>
                        </select>
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
                                    <span className="text-sm text-gray-700">Full Day (8:00 AM - 6:00 PM)</span>
                                </label>
                            </div>
                        </div>

                        {programCategory === 'HALF' && (
                            <>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Session <span className="text-red-500">*</span></label>
                                    <select name="session" defaultValue={initialSession} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option value="MORNING">Morning (8:00 AM - 12:00 PM)</option>
                                        <option value="AFTERNOON">Afternoon (1:00 PM - 5:00 PM)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Stay Back Option</label>
                                    <div className="flex items-center gap-4 mt-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" name="stayBack" value="yes" defaultChecked={initialStayBack} className="text-blue-600 focus:ring-blue-500 rounded" />
                                            <span className="text-sm text-gray-700">Stay Back Required</span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500">Only applicable for Half Day programs.</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Transport Required?</label>
                        <div className="flex items-center gap-4 mt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="transport" value="yes" defaultChecked={student?.transport === true} className="text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700">Yes</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="transport" value="no" defaultChecked={student?.transport !== true} className="text-blue-600 focus:ring-blue-500" />
                                <span className="text-sm text-gray-700">No</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Parent / Guardian Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Parent / Guardian Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Father's Name</label>
                        <input name="fatherName" type="text" defaultValue={student?.fatherName || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Father's IC / Passport</label>
                        <input name="fatherIc" type="text" defaultValue={student?.fatherIc || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mother's Name</label>
                        <input name="motherName" type="text" defaultValue={student?.motherName || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mother's IC / Passport</label>
                        <input name="motherIc" type="text" defaultValue={student?.motherIc || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* 4. Emergency Contact */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Emergency Contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Contact Name</label>
                        <input name="emergencyName" type="text" defaultValue={student?.emergencyName || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                        <input name="emergencyPhone" type="tel" defaultValue={student?.emergencyPhone || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Contact Address</label>
                        <textarea name="emergencyAddress" rows={2} defaultValue={student?.emergencyAddress || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 pb-12">
                <Link
                    href="/admin/students"
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
                            {student ? 'Updating...' : 'Registering...'}
                        </>
                    ) : (
                        student ? 'Update Student' : 'Register Student'
                    )}
                </button>
            </div>
        </form>
    )
}
