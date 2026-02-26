'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// @ts-ignore
export function GeneratePdfButton({ classData, enrollments }) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGeneratePdf = () => {
        setIsGenerating(true)

        try {
            const doc = new jsPDF()

            // Add Title
            doc.setFontSize(18)
            doc.text(`Class List: ${classData.name}`, 14, 20)

            // Add Subtitle (Year & Level)
            doc.setFontSize(12)
            doc.text(`Academic Year: ${classData.academicYear.year} | Level: ${classData.level}`, 14, 28)

            // Add Teacher info if any
            const teacherName = classData.teacher?.user?.name || 'Not assigned'
            doc.text(`Teacher: ${teacherName}`, 14, 34)

            // Prepare table data
            const tableData = enrollments.map((enrollment: any, index: number) => {
                const s = enrollment.student
                // Determine new vs returning
                const status = (s._count?.enrollments === 1) ? 'New' : 'Returning'

                // Format Program
                const programClean = enrollment.programType.replace(/_/g, ' ')

                // Helper to capitalize
                const capitalize = (str: string) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '-'

                return [
                    index + 1,
                    s.name,
                    capitalize(s.gender),
                    capitalize(s.race),
                    status,
                    programClean
                ]
            })

            // Generate Table
            // @ts-ignore - jspdf-autotable attaches to jsPDF instance
            doc.autoTable({
                startY: 40,
                head: [['No.', 'Student Name', 'Gender', 'Race', 'Status', 'Program']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] }, // Tailwind blue-500
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 10 },
                    1: { cellWidth: 50 },
                }
            })

            // Save PDF
            doc.save(`Class_${classData.name}_${classData.academicYear.year}.pdf`)
        } catch (error) {
            console.error('Failed to generate PDF:', error)
            alert('Failed to generate PDF. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <button
            onClick={handleGeneratePdf}
            disabled={isGenerating || enrollments.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isGenerating ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Download className="w-4 h-4" />
                    Download PDF
                </>
            )}
        </button>
    )
}
