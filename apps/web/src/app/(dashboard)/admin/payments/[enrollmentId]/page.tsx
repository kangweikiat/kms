import { getEnrollmentPaymentDetails } from '../actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { PaymentStatusEnum, PaymentMethodEnum } from '@kms/database'
import { LogPaymentModal } from './_components/log-payment-modal'
import { AddAdhocChargeModal } from './_components/add-adhoc-charge-modal'
import { LogLumpsumPaymentModal } from './_components/log-lumpsum-payment-modal'
import { AdjustMonthlyFeesModal } from './_components/adjust-monthly-fees-modal'
import { CancelPaymentButton } from './_components/cancel-payment-button'
import { DeleteMiscFeeButton } from './_components/delete-misc-fee-button'
import { DownloadReceiptButton } from './_components/download-receipt-button'
import { GenerateReceiptButton } from './_components/generate-receipt-button'
import { PageLoadingProvider } from './_components/page-loading-provider'

export default async function StudentPaymentDetailsPage(props: {
    params: Promise<{ enrollmentId: string }>
}) {
    const { enrollmentId } = await props.params
    const res = await getEnrollmentPaymentDetails(enrollmentId)

    if (!res.success || !res.data) {
        return notFound()
    }

    const { data: enrollment } = res
    const student = enrollment.student

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const formatCurrency = (amount: number) => `RM ${amount.toFixed(2)}`
    const renderStatusBadge = (status: PaymentStatusEnum) => {
        if (status === 'PAID') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800"><CheckCircle2 className="w-3.5 h-3.5" /> PAID</span>
        if (status === 'PARTIAL') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> PARTIAL</span>
        if ((status as any) === 'WAIVED') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800"><CheckCircle2 className="w-3.5 h-3.5" /> WAIVED</span>
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800"><Clock className="w-3.5 h-3.5" /> UNPAID</span>
    }

    const startupFees = enrollment.miscFees.filter((m: any) => !m.isAdhoc)
    const miscFees = enrollment.miscFees.filter((m: any) => m.isAdhoc)

    // Check if the first month and all startup fees are paid
    let disableLumpsum = true;

    // Check first month
    if (enrollment.monthlyFeeInstances.length > 0) {
        const firstMonth = enrollment.monthlyFeeInstances[0].month;
        const firstMonthInstances = enrollment.monthlyFeeInstances.filter((m: any) => m.month === firstMonth);
        if (firstMonthInstances.some((m: any) => m.status !== 'PAID' && m.status !== 'WAIVED')) {
            disableLumpsum = false;
        }
    }

    // Check startup fees
    if (startupFees.some((m: any) => m.status !== 'PAID' && m.status !== 'WAIVED')) {
        disableLumpsum = false;
    }

    // Compute startup-only payable items for the lumpsum modal
    // First month school fee IS part of the startup package — subsequent months are auto-distributed by the backend
    const SIZE_KEYWORDS = ['uniform', 'pe attire', 'physical exercise attire']
    const lumpsumItems: { id: string; name: string; outstanding: number; priority: number; needsSize: boolean }[] = []
    const firstMonthNum = enrollment.monthlyFeeInstances.length > 0 ? enrollment.monthlyFeeInstances[0].month : null

    // First month school fee only (subsequent months excluded — backend auto-distributes excess there)
    enrollment.monthlyFeeInstances
        .filter((m: any) => m.month === firstMonthNum)
        .forEach((m: any) => {
            const paid = m.payments.reduce((s: number, p: any) => s + p.amountPaid, 0)
            const outstanding = Math.max(0, m.amountDue - paid)
            if (outstanding > 0) {
                lumpsumItems.push({
                    id: m.id,
                    name: `${MONTH_NAMES[(m.month ?? 1) - 1]} School Fee`,
                    outstanding,
                    priority: 1,
                    needsSize: false
                })
            }
        })

    enrollment.bookInstances.forEach((bi: any) => {
        const paid = bi.payments.reduce((s: number, p: any) => s + p.amountPaid, 0)
        const outstanding = Math.max(0, bi.amountDue - paid)
        if (outstanding > 0) {
            lumpsumItems.push({
                id: bi.id,
                name: `${bi.feeItem?.name || 'Book'} (${bi.version})`,
                outstanding,
                priority: 4,
                needsSize: false
            })
        }
    })

    enrollment.miscFees
        .filter((m: any) => !m.isAdhoc)
        .forEach((m: any) => {
            const paid = m.payments.reduce((s: number, p: any) => s + p.amountPaid, 0)
            const outstanding = Math.max(0, m.amountDue - paid)
            if (outstanding > 0) {
                const n = m.name.toUpperCase()
                let priority = 4
                if (n.includes('DEPOSIT')) priority = 2
                else if (n.includes('INSURANCE') || n.includes('UNIFORM') || n.includes('DEPOSIT FEE') || n.includes('EVENT') || n.includes('CHILDCARE BAG') || n.includes('PHOTO') || n.includes('PE ATTIRE') || n.includes('PHYSICAL EXERCISE ATTIRE')) priority = 3
                lumpsumItems.push({
                    id: m.id,
                    name: m.name,
                    outstanding,
                    priority,
                    needsSize: SIZE_KEYWORDS.some(k => n.includes(k.toUpperCase()))
                })
            }
        })

    lumpsumItems.sort((a, b) => a.priority - b.priority)

    // Calculate contextual outstanding balances
    let startupOutstanding = 0;
    let monthlyOutstanding = 0;
    let miscOutstanding = 0;

    // 1. Monthly fees
    enrollment.monthlyFeeInstances.forEach((m: any) => {
        const paid = m.payments.reduce((s: number, p: any) => s + p.amountPaid, 0);
        monthlyOutstanding += Math.max(0, m.amountDue - paid);
    });

    // 2. Book instances (Startup)
    enrollment.bookInstances.forEach((m: any) => {
        const paid = m.payments.reduce((s: number, p: any) => s + p.amountPaid, 0);
        startupOutstanding += Math.max(0, m.amountDue - paid);
    });

    // 3. Misc fees (Startup vs Adhoc)
    enrollment.miscFees.forEach((m: any) => {
        const paid = m.payments.reduce((s: number, p: any) => s + p.amountPaid, 0);
        if (m.isAdhoc) {
            miscOutstanding += Math.max(0, m.amountDue - paid);
        } else {
            startupOutstanding += Math.max(0, m.amountDue - paid);
        }
    });

    const renderMiscFee = (misc: any) => {
        const paid = misc.payments.reduce((s: number, p: any) => s + p.amountPaid, 0)
        const outstanding = Math.max(0, misc.amountDue - paid)

        return (
            <div key={misc.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="font-semibold text-gray-900">{misc.name}</div>
                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4 items-center">
                        <span>Due: {formatCurrency(misc.amountDue)}</span>
                        <span className="text-green-600">Paid: {formatCurrency(paid)}</span>
                        {outstanding > 0 && <span className="text-red-500 font-medium">Outstanding: {formatCurrency(outstanding)}</span>}
                    </div>
                    {misc.payments.length > 0 && (
                        <div className="mt-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5">
                            <div className="font-medium text-gray-700">Payment History:</div>
                            {misc.payments.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between text-gray-600 group">
                                    <span>{new Date(p.paidAt).toLocaleDateString()} via {p.method}</span>
                                    <div className="flex items-center">
                                        <span className="font-medium text-green-700">+{formatCurrency(p.amountPaid)}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CancelPaymentButton paymentId={p.id} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {renderStatusBadge(misc.status)}
                    {misc.status !== 'PAID' && misc.status !== 'WAIVED' && (
                        <LogPaymentModal
                            enrollmentId={enrollment.id}
                            miscFeeId={misc.id}
                            itemName={misc.name}
                            amountDue={outstanding}
                        />
                    )}
                    {misc.isAdhoc && misc.status === 'UNPAID' && misc.payments.length === 0 && (
                        <DeleteMiscFeeButton miscFeeId={misc.id} itemName={misc.name} />
                    )}
                </div>
            </div>
        )
    }

    return (
        <PageLoadingProvider>
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/payments"
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                            <div className="text-sm text-gray-500">
                                {enrollment.enrollmentLevel} • {enrollment.programType.replace(/_/g, ' ')} • {enrollment.academicYear}
                            </div>
                        </div>
                    </div>
                    <LogLumpsumPaymentModal
                        enrollmentId={enrollment.id}
                        disabled={disableLumpsum}
                        lumpsumItems={lumpsumItems}
                        monthlyOutstanding={monthlyOutstanding}
                    />
                </div>

                <div className="space-y-6">
                    {/* UNRECEIPTED PAYMENTS */}
                    {(enrollment as any).payments && (enrollment as any).payments.length > 0 && (
                        <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-amber-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-amber-900">Unreceipted Payments</h2>
                                    <p className="text-sm text-amber-700 mt-0.5">These payments have been logged but no receipt has been issued yet.</p>
                                </div>
                                <GenerateReceiptButton
                                    enrollmentId={enrollment.id}
                                    unreceiptedPayments={(enrollment as any).payments}
                                />
                            </div>
                            <div className="divide-y divide-amber-100">
                                {(enrollment as any).payments.map((p: any) => {
                                    let desc = p.note || 'Payment'
                                    if (p.monthlyFeeInstance) desc = `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][p.monthlyFeeInstance.month - 1]} School Fee`
                                    else if (p.miscFee) desc = p.miscFee.name
                                    else if (p.bookInstance) desc = `${p.bookInstance.feeItem.name} (${p.bookInstance.version})`
                                    return (
                                        <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                                            <div>
                                                <div className="text-sm font-medium text-amber-900">{desc}</div>
                                                <div className="text-xs text-amber-600">{new Date(p.paidAt).toLocaleDateString()} · {p.method.replace('_', ' ')}</div>
                                            </div>
                                            <span className="text-sm font-semibold text-amber-800">RM {p.amountPaid.toFixed(2)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* RECEIPTS HISTORY */}
                    {enrollment.receipts && enrollment.receipts.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Receipts History</h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {enrollment.receipts.map((receipt: any) => {
                                    let hasStartup = false;
                                    let hasMonthly = false;
                                    let hasMisc = false;

                                    receipt.payments.forEach((p: any) => {
                                        if (p.bookInstanceId || (p.miscFee && !p.miscFee.isAdhoc)) {
                                            hasStartup = true;
                                        }
                                        if (p.monthlyFeeInstanceId) {
                                            hasMonthly = true;
                                        }
                                        if (p.miscFee && p.miscFee.isAdhoc) {
                                            hasMisc = true;
                                        }
                                    });

                                    // Removed the displayBalance because the PDF takes care of it natively through historical snapshots now

                                    return (
                                        <div key={receipt.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900">{receipt.receiptNo}</div>
                                                <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4 items-center">
                                                    <span>Date: {new Date(receipt.paymentDate).toLocaleDateString()}</span>
                                                    <span>Method: {receipt.paymentMethod}</span>
                                                    <span className="font-medium text-gray-900">Total: {formatCurrency(receipt.amount)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <DownloadReceiptButton
                                                    receiptNo={receipt.receiptNo}
                                                    receiptDetails={{
                                                        ...receipt,
                                                        studentName: student.name,
                                                        enrollmentLevel: enrollment.enrollmentLevel,
                                                        programType: enrollment.programType
                                                    }}
                                                    enrollment={enrollment}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* STARTUP FEES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Startup Fees</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {startupFees.length === 0 && <div className="p-6 text-gray-500 text-sm">No items found.</div>}
                            {startupFees.map(renderMiscFee)}
                        </div>
                    </div>

                    {/* MISCELLANEOUS FEES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Miscellaneous Fees</h2>
                            <AddAdhocChargeModal enrollmentId={enrollment.id} />
                        </div>
                        <div className="divide-y divide-gray-100">
                            {miscFees.length === 0 && <div className="p-6 text-gray-500 text-sm">No items found.</div>}
                            {miscFees.map(renderMiscFee)}
                        </div>
                    </div>

                    {/* MONTHLY FEES */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Monthly Fees</h2>
                            <AdjustMonthlyFeesModal
                                enrollmentId={enrollment.id}
                                monthlyFeeInstances={enrollment.monthlyFeeInstances}
                            />
                        </div>
                        <div className="divide-y divide-gray-100">
                            {enrollment.monthlyFeeInstances.length === 0 && <div className="p-6 text-gray-500 text-sm">No items found.</div>}
                            {enrollment.monthlyFeeInstances.map((inst: any) => {
                                const paid = inst.payments.reduce((s: number, p: any) => s + p.amountPaid, 0)
                                const outstanding = Math.max(0, inst.amountDue - paid)

                                return (
                                    <div key={inst.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-900">
                                                {inst.feeItem.name} — {MONTH_NAMES[inst.month - 1]}
                                            </div>
                                            {inst.adjustmentType && (
                                                <div className="mt-0.5 text-xs text-blue-700 font-medium">
                                                    {inst.adjustmentType === 'WAIVE' && '🚫 Waived'}
                                                    {inst.adjustmentType === 'PERCENT' && `📉 ${inst.adjustmentPercent}% of original`}
                                                    {inst.adjustmentType === 'FIXED_AMOUNT' && `📌 Fixed at RM ${Number(inst.adjustmentFixedAmount).toFixed(2)}`}
                                                    {inst.adjustmentReason && (
                                                        <span className="text-gray-400 font-normal"> • {inst.adjustmentReason}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-4 items-center">
                                                <span>Due: {formatCurrency(inst.amountDue)}</span>
                                                <span className="text-green-600">Paid: {formatCurrency(paid)}</span>
                                                {outstanding > 0 && <span className="text-red-500 font-medium">Outstanding: {formatCurrency(outstanding)}</span>}
                                            </div>
                                            {inst.payments.length > 0 && (
                                                <div className="mt-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5">
                                                    <div className="font-medium text-gray-700">Payment History:</div>
                                                    {inst.payments.map((p: any) => (
                                                        <div key={p.id} className="flex items-center justify-between text-gray-600 group">
                                                            <span>{new Date(p.paidAt).toLocaleDateString()} via {p.method}</span>
                                                            <div className="flex items-center">
                                                                <span className="font-medium text-green-700">+{formatCurrency(p.amountPaid)}</span>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <CancelPaymentButton paymentId={p.id} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {renderStatusBadge(inst.status)}
                                            {inst.status !== 'PAID' && (
                                                <LogPaymentModal
                                                    enrollmentId={enrollment.id}
                                                    monthlyFeeInstanceId={inst.id}
                                                    itemName={MONTH_NAMES[inst.month - 1]}
                                                    amountDue={outstanding}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </PageLoadingProvider>
    )
}
