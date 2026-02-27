import { getEnrollmentPaymentDetails } from '../actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { PaymentStatusEnum, PaymentMethodEnum } from '@kms/database'
import { LogPaymentModal } from './_components/log-payment-modal'

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

    const formatCurrency = (amount: number) => `RM ${amount.toFixed(2)}`
    const renderStatusBadge = (status: PaymentStatusEnum) => {
        if (status === 'PAID') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800"><CheckCircle2 className="w-3.5 h-3.5" /> PAID</span>
        if (status === 'PARTIAL') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><Clock className="w-3.5 h-3.5" /> PARTIAL</span>
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800"><Clock className="w-3.5 h-3.5" /> UNPAID</span>
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
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

            <div className="space-y-6">
                {/* ONE TIME / MISC FEES */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">Startup & Miscellaneous Fees</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {enrollment.miscFees.length === 0 && <div className="p-6 text-gray-500 text-sm">No items found.</div>}
                        {enrollment.miscFees.map((misc: any) => {
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
                                                    <div key={p.id} className="flex items-center justify-between text-gray-600">
                                                        <span>{new Date(p.paidAt).toLocaleDateString()} via {p.method}</span>
                                                        <span className="font-medium text-green-700">+{formatCurrency(p.amountPaid)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {renderStatusBadge(misc.status)}
                                        {misc.status !== 'PAID' && (
                                            <LogPaymentModal
                                                enrollmentId={enrollment.id}
                                                miscFeeId={misc.id}
                                                itemName={misc.name}
                                                amountDue={outstanding}
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* MONTHLY FEES */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">Monthly Fees</h2>
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
                                            {inst.feeItem.name} — Month {inst.month}
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
                                                    <div key={p.id} className="flex items-center justify-between text-gray-600">
                                                        <span>{new Date(p.paidAt).toLocaleDateString()} via {p.method}</span>
                                                        <span className="font-medium text-green-700">+{formatCurrency(p.amountPaid)}</span>
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
                                                itemName={`Month ${inst.month}`}
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
