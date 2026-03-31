'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ReceiptRow {
    date: string
    receiptNo: string
    studentName: string
    className: string
    method: string
    amount: number
    amountFormatted: string
}

interface ExportReceiptsButtonProps {
    receipts: ReceiptRow[];
    monthLabel: string;
}

export function ExportReceiptsButton({ receipts, monthLabel }: ExportReceiptsButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            const jsPDF = (await import('jspdf')).default
            const autoTable = (await import('jspdf-autotable')).default

            const doc = new jsPDF()

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(16)
            doc.text(`Receipts Register - ${monthLabel || 'All View'}`, 14, 20)
            
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.text(`Generated on ${new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}`, 14, 26)

            const body = receipts.map(r => [
                r.date, r.receiptNo, r.studentName, r.className, r.method, r.amountFormatted
            ])

            let totalCash = 0;
            let totalOnline = 0;
            let totalTng = 0;
            let grandTotal = 0;

            receipts.forEach(r => {
                grandTotal += r.amount
                if (r.method === 'CASH') totalCash += r.amount
                else if (r.method === 'TNG') totalTng += r.amount
                else totalOnline += r.amount // Assumes BANK_TRANSFER, ONLINE, ONLINE_TRANSFER
            })

            autoTable(doc, {
                startY: 32,
                theme: 'striped',
                headStyles: { fillColor: [55, 65, 81] },
                columnStyles: {
                    5: { halign: 'right' } // Amount
                },
                head: [['Date', 'Receipt No', 'Student Name', 'Class/Program', 'Method', 'Amount (RM)']],
                body,
            })

            const finalY = (doc as any).lastAutoTable.finalY + 12
            
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(10)
            doc.text(`Total Cash: RM ${totalCash.toFixed(2)}`, 14, finalY)
            doc.text(`Total TnG: RM ${totalTng.toFixed(2)}`, 14, finalY + 6)
            doc.text(`Total Online/Bank: RM ${totalOnline.toFixed(2)}`, 14, finalY + 12)
            
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(12)
            doc.text(`Grand Total: RM ${grandTotal.toFixed(2)}`, 14, finalY + 22)

            const safeFilename = monthLabel ? `Receipts_Register_${monthLabel.replace(/\s+/g, '_')}` : 'Receipts_Register'
            doc.save(`${safeFilename}.pdf`)
            
        } catch (error) {
            console.error('Failed to generate PDF', error)
            alert('Failed to generate PDF')
        } finally {
            setIsGenerating(false)
        }
    }

    if (receipts.length === 0) return null

    return (
        <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 shadow-sm text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <Download className="w-4 h-4 text-gray-500" />}
            {isGenerating ? 'Exporting...' : 'Export to PDF'}
        </button>
    )
}
