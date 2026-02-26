'use client'

import { useState, useTransition } from 'react'
import { assignStudentsToClass } from '../../actions'
import { toast } from 'sonner'
import { Plus, X, Search, Loader2, CheckSquare, Square } from 'lucide-react'

// Simple type for the students we pass in
type AvailableStudent = {
    id: string
    isNewStudent: boolean
    programType: string
    transport: boolean
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

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const filteredStudents = availableStudents.filter(s =>
        s.student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleStudent = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const toggleAll = () => {
        if (selectedIds.size === filteredStudents.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filteredStudents.map(s => s.id)))
        }
    }

    const handleAssign = () => {
        if (selectedIds.size === 0) return

        startTransition(async () => {
            const result = await assignStudentsToClass(classId, Array.from(selectedIds))
            if (result.success) {
                toast.success(`Successfully assigned ${selectedIds.size} student(s) to class.`)
                setIsOpen(false)
                setSelectedIds(new Set())
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

                        {filteredStudents.length > 0 && (
                            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === filteredStudents.length && filteredStudents.length > 0}
                                        onChange={toggleAll}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                    />
                                    Select All
                                </label>
                                <span className="text-sm text-gray-500">
                                    {selectedIds.size} selected
                                </span>
                            </div>
                        )}

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
                                            className={`flex items-center p-3 border rounded-lg transition cursor-pointer ${selectedIds.has(enrollment.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-100 hover:bg-gray-50'}`}
                                            onClick={() => toggleStudent(enrollment.id)}
                                        >
                                            <div className="pr-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(enrollment.id)}
                                                    onChange={() => { }} // Handled by li onClick
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer pointer-events-none"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{enrollment.student.name}</p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize ${enrollment.student.race.toLowerCase() === 'malay' ? 'bg-green-100 text-green-800' :
                                                            enrollment.student.race.toLowerCase() === 'chinese' ? 'bg-yellow-100 text-yellow-800' :
                                                                enrollment.student.race.toLowerCase() === 'indian' ? 'bg-purple-100 text-purple-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {enrollment.student.race}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 uppercase">
                                                        {enrollment.student.gender}
                                                    </span>
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${enrollment.isNewStudent ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                                                    >
                                                        {enrollment.isNewStudent ? 'New' : 'Old'}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 uppercase">
                                                        {enrollment.programType.replace(/_/g, ' ')}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${enrollment.transport ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {enrollment.transport ? 'Transport' : 'No Transport'}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button
                                onClick={handleAssign}
                                disabled={isPending || selectedIds.size === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium w-full sm:w-auto justify-center"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign Selected'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
