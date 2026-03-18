'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface DownloadReceiptButtonProps {
    receiptNo: string
    receiptDetails: any
    enrollment?: any // Full enrollment snapshot for precise historical global balance
}

export function DownloadReceiptButton({ receiptNo, receiptDetails, enrollment }: DownloadReceiptButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const loadImage = (url: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = 'Anonymous'
            img.onload = () => resolve(img)
            img.onerror = reject
            img.src = url
        })
    }

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            // Dynamically import jspdf
            const jsPDF = (await import('jspdf')).default
            const autoTable = (await import('jspdf-autotable')).default

            const doc = new jsPDF({ format: 'a5', orientation: 'landscape' })

            // ----- HEADER -----
            try {
                const logoImg = await loadImage('/images/logo/receipt-logo.png')
                doc.addImage(logoImg, 'PNG', 20, 8, 40, 12)
            } catch (err) {
                console.warn('Failed to load logo', err)
            }

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(8)
            doc.setTextColor(107, 114, 128) // text-gray-500
            doc.text('Tadika Maria Cemerlang (JM0676003-T)', 20, 27)
            doc.text('No. 1, Jalan Seri Orkid 3, Taman Seri Orkid, 81300 Skudai, Johor.', 20, 32)
            doc.text('Tel: 016-773 4401', 20, 37)

            // Top Right Block
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(18)
            doc.setTextColor(17, 24, 39) // text-gray-900
            doc.text('SCHOOL FEES RECEIPT', 190, 16, { align: 'right' })

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(107, 114, 128) // text-gray-500
            doc.text('Official Receipt Number:', 190, 27, { align: 'right' })

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(17, 24, 39) // text-gray-900
            doc.text(receiptNo, 190, 31, { align: 'right' })

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(107, 114, 128) // text-gray-500
            doc.text('Date:', 190, 36, { align: 'right' })

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8)
            doc.setTextColor(17, 24, 39) // text-gray-900
            doc.text(new Date(receiptDetails.paymentDate).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }), 190, 40, { align: 'right' })

            // Divider
            doc.setDrawColor(229, 231, 235) // border-gray-200
            doc.setLineWidth(0.5)
            doc.line(20, 42, 190, 42)

            // ----- BILLED TO -----
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            doc.setTextColor(17, 24, 39) // text-gray-900
            doc.text(`Name: ${receiptDetails.studentName}`, 20, 48)
            doc.text(`Class: ${receiptDetails.enrollmentLevel}`, 190, 48, { align: 'right' })

            // ----- TABLE SETUP -----
            const categories = {
                REGISTRATION: { description: [], amount: 0, balance: 0 },
                SCHOOL: { description: [], amount: 0, balance: 0 },
                BOOK: { description: [], amount: 0, balance: 0 },
                STARTUP: { description: [], amount: 0, balance: 0 },
                OTHER: { description: [], amount: 0, balance: 0 }
            }

            const isHistoricalOrCurrentPayment = (pp: any) => {
                if (pp.receiptId === receiptDetails.id) return true;
                return new Date(pp.createdAt).getTime() <= new Date(receiptDetails.createdAt).getTime();
            };

            receiptDetails.payments.forEach((p: any) => {
                let cat = 'OTHER'
                let detail = p.note || ''
                let balance = 0

                if (p.monthlyFeeInstance) {
                    cat = 'SCHOOL'
                    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                    detail = `${months[p.monthlyFeeInstance.month - 1]} School Fee`

                    const totalPaidForInstance = p.monthlyFeeInstance.payments
                        .filter(isHistoricalOrCurrentPayment)
                        .reduce((sum: number, pp: any) => sum + pp.amountPaid, 0)
                    balance = Math.max(0, p.monthlyFeeInstance.amountDue - totalPaidForInstance)
                }
                else if (p.bookInstance) {
                    cat = 'BOOK'
                    detail = `${p.bookInstance.feeItem.name} v${p.bookInstance.version}`
                    const totalPaidForInstance = p.bookInstance.payments
                        .filter(isHistoricalOrCurrentPayment)
                        .reduce((sum: number, pp: any) => sum + pp.amountPaid, 0)
                    balance = Math.max(0, p.bookInstance.amountDue - totalPaidForInstance)
                }
                else if (p.miscFee) {
                    const n = p.miscFee.name.toUpperCase()
                    if (n.includes('REGISTRATION FEE')) {
                        cat = 'REGISTRATION'
                    }
                    else if (n.includes('BOOK MATERIALS')) {
                        cat = 'BOOK'
                    }
                    else if (n.includes('INSURANCE') || n.includes('UNIFORM') || n.includes('DEPOSIT FEE') || n.includes('EVENT') || n.includes('CHILDCARE BAG') || n.includes('PHOTO') || n.includes('PE ATTIRE')) {
                        cat = 'STARTUP'
                    }
                    detail = p.miscFee.name
                    if (p.note) detail = `${p.miscFee.name} (${p.note})`
                    const totalPaidForInstance = p.miscFee.payments
                        .filter(isHistoricalOrCurrentPayment)
                        .reduce((sum: number, pp: any) => sum + pp.amountPaid, 0)
                    balance = Math.max(0, p.miscFee.amountDue - totalPaidForInstance)
                }

                if (detail && !(categories as any)[cat].description.includes(detail)) {
                    (categories as any)[cat].description.push(detail);
                }
                (categories as any)[cat].amount += p.amountPaid;

                // If there are multiple items in the same category, their balances sum up here.
                (categories as any)[cat].balance += balance;
            });

            // Calculate exact total remaining balance for items paid in this receipt
            let receiptItemsRemainingBalance = 0;
            Object.values(categories).forEach(cat => receiptItemsRemainingBalance += cat.balance);

            let historicalStartupOutstanding = 0;
            let historicalMiscOutstanding = 0;

            if (enrollment) {
                let historicalStartupDue = 0;
                let historicalStartupPaid = 0;
                let historicalMiscDue = 0;
                let historicalMiscPaid = 0;

                enrollment.bookInstances?.forEach((bi: any) => {
                    historicalStartupDue += bi.amountDue;
                    const paid = bi.payments.filter(isHistoricalOrCurrentPayment).reduce((s:number, p:any) => s + p.amountPaid, 0);
                    historicalStartupPaid += paid;
                });

                enrollment.miscFees?.forEach((mf: any) => {
                    const mfCreatedTime = mf.createdAt ? new Date(mf.createdAt).getTime() : new Date(enrollment.createdAt).getTime();
                    if (mfCreatedTime <= new Date(receiptDetails.createdAt).getTime()) {
                        if (mf.isAdhoc) {
                            historicalMiscDue += mf.amountDue;
                            const paid = mf.payments.filter(isHistoricalOrCurrentPayment).reduce((s:number, p:any) => s + p.amountPaid, 0);
                            historicalMiscPaid += paid;
                        } else {
                            historicalStartupDue += mf.amountDue;
                            const paid = mf.payments.filter(isHistoricalOrCurrentPayment).reduce((s:number, p:any) => s + p.amountPaid, 0);
                            historicalStartupPaid += paid;
                        }
                    }
                });

                historicalStartupOutstanding = Math.max(0, historicalStartupDue - historicalStartupPaid);
                historicalMiscOutstanding = Math.max(0, historicalMiscDue - historicalMiscPaid);
            }

            const hasSchoolFee = categories.SCHOOL.amount > 0;
            const hasStartup = categories.STARTUP.amount > 0 || categories.BOOK.amount > 0 || categories.REGISTRATION.amount > 0;
            const hasMisc = categories.OTHER.amount > 0;

            let finalRemainingBalance = 0;
            
            if (hasSchoolFee) {
                finalRemainingBalance += categories.SCHOOL.balance;
            }
            if (hasStartup) {
                finalRemainingBalance += enrollment ? historicalStartupOutstanding : (categories.STARTUP.balance + categories.BOOK.balance + categories.REGISTRATION.balance);
            }
            if (hasMisc) {
                finalRemainingBalance += enrollment ? historicalMiscOutstanding : categories.OTHER.balance;
            }

            const formatMoney = (val: number) => val > 0 ? val.toFixed(2) : '-'

            const fullTableBody = [
                ['REGISTRATION FEE', categories.REGISTRATION.description.join(', '), formatMoney(categories.REGISTRATION.amount)],
                ['SCHOOL FEE', categories.SCHOOL.description.join(', '), formatMoney(categories.SCHOOL.amount)],
                ['BOOK & MATERIAL', categories.BOOK.description.join(', '), formatMoney(categories.BOOK.amount)],
                ['START UP', categories.STARTUP.description.join(', '), formatMoney(categories.STARTUP.amount)],
                ['OTHER', categories.OTHER.description.join(', '), formatMoney(categories.OTHER.amount)]
            ]

            // Filter out purely empty aesthetic rows that have no amount paid
            const activeTableBody = fullTableBody.filter(row => row[2] !== '-')

            autoTable(doc, {
                startY: 56,
                margin: { left: 20, right: 20, bottom: 5 },
                theme: 'plain',
                headStyles: {
                    fillColor: [249, 250, 251], // bg-gray-50
                    textColor: [107, 114, 128], // text-gray-500
                    fontStyle: 'bold',
                    cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
                    fontSize: 8
                },
                bodyStyles: {
                    textColor: [17, 24, 39], // text-gray-900
                    fontSize: 8,
                    cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }
                },
                willDrawCell: (data: any) => {
                    if (data.section === 'body') {
                        doc.setDrawColor(243, 244, 246) // border-gray-100
                        doc.setLineWidth(0.5)
                        const y = data.cell.y + data.cell.height
                        doc.line(data.cell.x, y, data.cell.x + data.cell.width, y)
                    }
                },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },     // ITEM
                    1: { cellWidth: 'auto' },                    // DESCRIPTION
                    2: { cellWidth: 35, halign: 'right' }        // AMOUNT
                },
                head: [['ITEM', 'DESCRIPTION', 'AMOUNT (RM)']],
                body: activeTableBody
            })

            // ----- TOTAL BOX -----
            const finalY = (doc as any).lastAutoTable.finalY + 8

            // Highlight Box
            doc.setFillColor(249, 250, 251) // bg-gray-50
            doc.rect(130, finalY, 60, 16, 'F')

            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(107, 114, 128) // text-gray-500
            doc.text('Total Paid', 135, finalY + 10)

            doc.setFont('helvetica', 'bold')
            doc.setFontSize(14)
            doc.setTextColor(37, 99, 235) // text-blue-600
            doc.text(`RM ${receiptDetails.amount.toFixed(2)}`, 185, finalY + 11, { align: 'right' })

            // Extra Remaining Balance Display if there's any pending
            // We use 0.01 to avoid floating-point imprecision when remaining balance is technically zero (e.g. 0.00000000001)
            if (finalRemainingBalance > 0.01) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(8)
                doc.setTextColor(220, 38, 38) // red-600
                doc.text(
                    `Remaining Balance Due: RM ${finalRemainingBalance.toFixed(2)}`,
                    190,
                    finalY + 22,
                    { align: 'right' }
                )
            }

            // ----- FOOTER -----
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7)
            doc.setTextColor(156, 163, 175) // text-gray-400
            doc.text('* Payment mode cannot be re-classified or re-directed.', 20, finalY + 6)
            doc.text('* Please bring this receipt along as proof of payment.', 20, finalY + 10)
            doc.text('* Payment made are non-refundable.', 20, finalY + 14)

            // Save PDF
            doc.save(`Receipt-${receiptNo}.pdf`)
        } catch (error) {
            console.error('Failed to generate PDF', error)
            alert('Failed to generate receipt PDF')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isGenerating ? 'Generating...' : 'Download Receipt'}
        </button>
    )
}
