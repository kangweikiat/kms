'use client'

import { useState, useTransition } from 'react'
import { assignStudentToClass } from '../../actions'
import { toast } from 'sonner'
import { Plus, X, Search, Loader2 } from 'lucide-react'

// Simple type for the students we pass in
type AvailableStudent = {
    id: string
    isNewStudent: boolean
    programType: string
    student: {
        id: string
        name: string
        gender: string
        race: string
    }
}

interface AssignStudentModalProps {
    classId: string
    availableStudents: AvailableStudent[]
    isFull: boolean
}

export function AssignStudentModal({ classId, availableStudents, isFull }: AssignStudentModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isPending, startTransition] = useTransition()

    const filteredStudents = availableStudents.filter(s =>
        s.student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAssign = (enrollmentId: string) => {
        startTransition(async () => {
            const result = await assignStudentToClass(classId, enrollmentId)
            if (result.success) {
                toast.success('Student assigned to class successfully')
                setIsOpen(false)
            } else {
                toast.error(result.error)
            }
        })
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                disabled={isFull || availableStudents.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Plus className="w-4 h-4" />
                Assign Student
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Assign Student to Class</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by student name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {filteredStudents.length === 0 ? (
                                <p className="text-center text-sm text-gray-500 py-8">
                                    {searchQuery ? 'No students found matching your search.' : 'No available students to assign.'}
                                </p>
                            ) : (
                                <ul className="space-y-2">
                                    {filteredStudents.map((enrollment) => (
                                        <li
                                            key={enrollment.id}
                                            className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-blue-100 hover:bg-blue-50/50 transition"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900">{enrollment.student.name}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 uppercase">
                                                        {enrollment.student.gender}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 uppercase">
                                                        {enrollment.programType.replace(/_/g, ' ')}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${enrollment.student.race.toLowerCase() === 'malay' ? 'bg-green-100 text-green-800' :
                                                            enrollment.student.race.toLowerCase() === 'chinese' ? 'bg-yellow-100 text-yellow-800' :
                                                                enrollment.student.race.toLowerCase() === 'indian' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {enrollment.student.race}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${enrollment.isNewStudent ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                                                    >
                                                        {enrollment.isNewStudent ? 'New' : 'Old'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAssign(enrollment.id)}
                                                disabled={isPending}
                                                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition disabled:opacity-50"
                                            >
                                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Assign'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
