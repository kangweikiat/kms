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
                />
            </div>

            <div className="space-y-6">
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
    )
}
