'use client'

import { useState } from 'react'
import { Banknote, Calculator, CheckCircle2 } from 'lucide-react'
import { LevelBadge } from '../../students/_components/level-badge'

type FeePackagesClientProps = {
    activeYear: any | null
}

export function FeePackagesClient({ activeYear }: FeePackagesClientProps) {
    // We can also filter by Level to make it even cleaner
    const [selectedLevel, setSelectedLevel] = useState<string>('ALL')

    if (!activeYear) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 p-6">
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <Banknote className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Academic Years</h3>
                    <p className="mt-2 text-sm text-gray-500">Enable an academic year to view its fee packages.</p>
                </div>
            </div>
        )
    }

    // Extract unique levels for the current year to build filter tabs
    const uniqueLevels = Array.from(new Set(activeYear.feePackages.map((p: any) => p.level))) as string[]

    const filteredPackages = activeYear.feePackages.filter((pkg: any) =>
        selectedLevel === 'ALL' || pkg.level === selectedLevel
    )

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Banknote className="w-6 h-6 text-blue-600" />
                    Fee Packages
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    A comprehensive overview of all active fee packages for parents and administrators.
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="space-y-1.5 flex-1 max-w-xs">
                        <label className="text-sm font-medium text-gray-700">Academic Year</label>
                        <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-900 font-medium">
                            {activeYear.year}
                        </div>
                    </div>

                    <div className="space-y-1.5 flex-1">
                        <label className="text-sm font-medium text-gray-700">Level</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedLevel('ALL')}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${selectedLevel === 'ALL'
                                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                All Levels
                            </button>
                            {uniqueLevels.sort().map(level => (
                                <button
                                    key={level}
                                    onClick={() => setSelectedLevel(level)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors ${selectedLevel === level
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages Grid */}
            <div className="space-y-6">
                {filteredPackages.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">No fee packages found matching the selected filters.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 align-items-stretch">
                        {filteredPackages.map((pkg: any) => {
                            // Calculate Preview
                            let oneTimeTotal = 0
                            let monthlyTotal = 0
                            let returningWaiverTotal = 0
                            const upfrontMonths = pkg.collectionRule?.upfrontMonths || 1

                            pkg.feePackageItems.forEach((item: any) => {
                                const amount = item.unitAmount ?? item.feeItem.defaultAmount
                                const lineTotal = amount * item.quantity

                                if (item.feeItem.chargeType === 'ONE_TIME') {
                                    oneTimeTotal += lineTotal
                                    if (item.feeItem.isWaivableForReturningStudents) {
                                        returningWaiverTotal += lineTotal
                                    }
                                } else {
                                    monthlyTotal += lineTotal
                                }
                            })

                            const upfrontMonthlyTotal = monthlyTotal * upfrontMonths
                            const totalNewStudent = oneTimeTotal + upfrontMonthlyTotal
                            const totalReturningStudent = totalNewStudent - returningWaiverTotal

                            return (
                                <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                                    {/* Header */}
                                    <div className=" bg-gray-50 p-5 border-b border-gray-100 h-[120px]">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-900 line-clamp-1 truncate mr-2" title={pkg.name}>{pkg.name}</h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
                                                {pkg.billingPeriod.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <LevelBadge level={pkg.level} />
                                            <span className="text-sm font-medium text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm truncate">
                                                {pkg.programType.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        {pkg.description && (
                                            <p className="mt-2 text-xs text-gray-500 line-clamp-2">{pkg.description}</p>
                                        )}
                                    </div>

                                    {/* Body - Fee Items */}
                                    <div className="p-5 flex-1 break-inside-avoid">
                                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Fee Breakdown</h4>

                                        <div className="space-y-4">
                                            {/* One Time Fees */}
                                            <div>
                                                <h5 className="text-xs font-semibold text-gray-500 mb-2">One-Time / Annual Fees</h5>
                                                <div className="space-y-2">
                                                    {pkg.feePackageItems.filter((i: any) => i.feeItem.chargeType === 'ONE_TIME').map((item: any) => (
                                                        <div key={item.id} className="flex justify-between text-sm items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-700">{item.feeItem.name}</span>
                                                                {item.feeItem.isWaivableForReturningStudents && (
                                                                    <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200" title="Waived for returning students">Waivable</span>
                                                                )}
                                                                {item.quantity > 1 && <span className="text-gray-400 text-xs">x{item.quantity}</span>}
                                                            </div>
                                                            <span className="font-medium text-gray-900">
                                                                RM {((item.unitAmount ?? item.feeItem.defaultAmount) * item.quantity).toFixed(2)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Monthly Fees */}
                                            <div>
                                                <h5 className="text-xs font-semibold text-gray-500 mb-2">Monthly Fees</h5>
                                                <div className="space-y-2">
                                                    {pkg.feePackageItems.filter((i: any) => i.feeItem.chargeType === 'MONTHLY').map((item: any) => (
                                                        <div key={item.id} className="flex justify-between text-sm items-center">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-700">{item.feeItem.name}</span>
                                                                {item.quantity > 1 && <span className="text-gray-400 text-xs">x{item.quantity}</span>}
                                                            </div>
                                                            <span className="font-medium text-gray-900">
                                                                RM {((item.unitAmount ?? item.feeItem.defaultAmount) * item.quantity).toFixed(2)} <span className="text-gray-400 font-normal text-xs">/mo</span>
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer - Upfront Calculation */}
                                    <div className="bg-blue-50/50 p-5 mt-auto border-t border-blue-100">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Calculator className="w-4 h-4 text-blue-600" />
                                            <h4 className="font-semibold text-blue-900 text-sm">Initial Setup</h4>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600 max-w-[140px] leading-tight">New Student<br /><span className="text-xs">({upfrontMonths} mo + Annual)</span></span>
                                                <span className="font-bold text-gray-900 text-base">RM {totalNewStudent.toFixed(2)}</span>
                                            </div>

                                            {returningWaiverTotal > 0 && (
                                                <div className="flex justify-between items-center text-sm pt-2 border-t border-blue-100/50">
                                                    <div className="flex items-center gap-1.5 text-green-700">
                                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                                        <span className="font-medium">Returning Student</span>
                                                    </div>
                                                    <span className="font-bold text-green-700">RM {totalReturningStudent.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
