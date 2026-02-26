'use client'

import { useState, useActionState } from 'react'
import { createStudent, updateStudent } from '../../actions'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Student, Enrollment } from '@kms/database'

interface StudentFormProps {
    // @ts-ignore
    student?: Student & {
        enrollments: Enrollment[]
    }
    targetYear?: number
    availableYears?: { year: number; status: string; id: string }[]
}

export function StudentForm({ student, targetYear, availableYears = [] }: StudentFormProps) {
    // Get specific enrollment if targetYear is provided, otherwise fallback to latest
    const matchedEnrollment = targetYear
        ? student?.enrollments?.find(e => e.academicYear === targetYear)
        : null

    const currentEnrollment = matchedEnrollment || student?.enrollments?.[0]

    // Determine initial program category based on currentEnrollment
    const initialCategory = currentEnrollment?.programType === 'FULL_DAY' ? 'FULL' : 'HALF'
    const [programCategory, setProgramCategory] = useState<'FULL' | 'HALF'>(initialCategory)

    const initialSession = currentEnrollment?.programType.includes('MORNING') ? 'MORNING' : 'AFTERNOON'
    const [session, setSession] = useState<'MORNING' | 'AFTERNOON'>(initialSession)
    const initialStayBack = currentEnrollment?.programType.includes('STAY_BACK')

    // Bind the action if updating, otherwise use create
    const actionFn = student ? updateStudent.bind(null, student.id) : createStudent
    const [state, action, isPending] = useActionState(actionFn, null)

    const [nationality, setNationality] = useState(student?.nationality && student.nationality !== 'Malaysian' ? 'Others' : (student?.nationality || 'Malaysian'))

    // Fallback: if no availableYears passed, provide a sensible default or just the single target year
    const years = availableYears.length > 0 ? availableYears : [{ year: 2026, status: 'ACTIVE', id: 'default' }]

    // Override the default year in select to be targetYear if provided, else currentEnrollment year
    const defaultYear = targetYear || currentEnrollment?.academicYear || 2026

    // Lock the year if an enrollment already exists for this year
    const isEnrollmentLocked = currentEnrollment?.academicYear === defaultYear

    return (
        <form action={action} className="space-y-6">
            <input type="hidden" name="targetYear" value={defaultYear} />
            {isEnrollmentLocked && <input type="hidden" name="enrollmentYear" value={defaultYear} />}

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
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                        <input name="name" required type="text" defaultValue={state?.fields?.name || student?.name || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">IC / MyKid <span className="text-red-500">*</span></label>
                        <input name="icNo" required type="text" defaultValue={state?.fields?.icNo || student?.icNo || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 150101-01-1234" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                        <input
                            name="dob"
                            required
                            type="date"
                            defaultValue={state?.fields?.dob || (student?.dob ? new Date(student.dob).toISOString().split('T')[0] : '')}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
                        <select name="gender" required defaultValue={state?.fields?.gender || student?.gender || 'MALE'} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Race <span className="text-red-500">*</span></label>
                        <select name="race" required defaultValue={state?.fields?.race || student?.race || 'MALAY'} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="MALAY">Malay</option>
                            <option value="CHINESE">Chinese</option>
                            <option value="INDIAN">Indian</option>
                            <option value="OTHERS">Others</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Religion</label>
                        <input name="religion" type="text" defaultValue={state?.fields?.religion || student?.religion || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Islam" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nationality</label>
                        <select
                            name="nationality"
                            value={nationality}
                            onChange={(e) => setNationality(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="Malaysian">Malaysian</option>
                            <option value="Others">Others</option>
                        </select>
                    </div>

                    {nationality === 'Others' && (
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <input
                                name="nationalityOther"
                                type="text"
                                defaultValue={state?.fields?.nationalityOther || (student?.nationality && student.nationality !== 'Malaysian' ? student.nationality : '')}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Please specify nationality"
                                required
                            />
                        </div>
                    )}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Address</label>
                        <textarea name="address" rows={2} defaultValue={state?.fields?.address || student?.address || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* 2. Enrollment Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Enrollment Details {targetYear && <span className="text-gray-500 font-normal text-sm">(For {targetYear})</span>}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {!isEnrollmentLocked && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Intake Year <span className="text-red-500">*</span></label>
                            <select
                                name="enrollmentYear"
                                required
                                defaultValue={defaultYear}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            >
                                {years.map((y) => (
                                    <option key={y.id} value={y.year}>
                                        {y.year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {/* If we force the year, we should ensure the form submits it correctly even if disabled 
                            (disabled inputs dont submit). So typically we keep it enabled or use hidden input if locked.
                        */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Level <span className="text-red-500">*</span></label>
                        <select name="enrollmentLevel" required defaultValue={state?.fields?.enrollmentLevel || currentEnrollment?.enrollmentLevel} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="M2">M2 (2 Years)</option>
                            <option value="M3">M3 (3 Years)</option>
                            <option value="M4">M4 (4 Years)</option>
                            <option value="M5">M5 (5 Years)</option>
                            <option value="M6">M6 (6 Years)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Remarks</label>
                    <textarea
                        name="remarks"
                        rows={3}
                        defaultValue={state?.fields?.remarks || currentEnrollment?.remarks || ''}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Any additional information about the student..."
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
                                            <input type="checkbox" name="stayBack" value="yes" defaultChecked={initialStayBack} className="text-blue-600 focus:ring-blue-500 rounded" />
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
                            <input type="radio" name="transport" value="yes" defaultChecked={currentEnrollment?.transport === true} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">Yes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="transport" value="no" defaultChecked={currentEnrollment?.transport !== true && currentEnrollment?.transport !== undefined} className="text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm text-gray-700">No</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* 3. Parent / Guardian Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">
                    Parent / Guardian Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Father's Name</label>
                        <input name="fatherName" type="text" defaultValue={state?.fields?.fatherName || student?.fatherName || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Father's IC / Passport</label>
                        <input name="fatherIc" type="text" defaultValue={state?.fields?.fatherIc || student?.fatherIc || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Father's Occupation</label>
                        <input name="fatherOccupation" type="text" defaultValue={state?.fields?.fatherOccupation || student?.fatherOccupation || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2 mt-4">
                        <label className="text-sm font-medium text-gray-700">Mother's Name</label>
                        <input name="motherName" type="text" defaultValue={state?.fields?.motherName || student?.motherName || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mother's IC / Passport</label>
                        <input name="motherIc" type="text" defaultValue={state?.fields?.motherIc || student?.motherIc || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mother's Occupation</label>
                        <input name="motherOccupation" type="text" defaultValue={state?.fields?.motherOccupation || student?.motherOccupation || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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
                        <input name="emergencyName" type="text" defaultValue={state?.fields?.emergencyName || student?.emergencyName || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                        <input name="emergencyPhone" type="tel" defaultValue={state?.fields?.emergencyPhone || student?.emergencyPhone || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                    </div>
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Contact Address</label>
                        <textarea name="emergencyAddress" rows={2} defaultValue={state?.fields?.emergencyAddress || student?.emergencyAddress || ''} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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
