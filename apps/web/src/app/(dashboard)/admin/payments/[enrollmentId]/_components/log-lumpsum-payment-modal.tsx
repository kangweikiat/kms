'use client'

import { useState, useMemo } from 'react'
import { Plus, X, Ruler, CheckCircle2, Circle, CheckSquare, Square } from 'lucide-react'
import { logLumpsumPayment } from '../../actions'
import { usePageRefresh } from './page-loading-provider'
import * as Dialog from '@radix-ui/react-dialog'

type LumpsumItem = {
    id: string
    name: string
    outstanding: number
    priority: number
    needsSize: boolean
}

// Simulates the backend distribution algorithm — purely frontend, no DB call
function simulateCoverage(items: LumpsumItem[], amountPaid: number) {
    let remaining = amountPaid
    return items.map(item => {
        if (remaining <= 0) return { ...item, amountCovered: 0, fullyPaid: false }
        const covered = Math.min(item.outstanding, remaining)
        remaining -= covered
        return { ...item, amountCovered: covered, fullyPaid: covered >= item.outstanding }
    })
}

export function LogLumpsumPaymentModal({
    enrollmentId,
    disabled = false,
    lumpsumItems = [],
    monthlyOutstanding = 0
}: {
    enrollmentId: string
    disabled?: boolean
    lumpsumItems?: LumpsumItem[]
    monthlyOutstanding?: number
}) {
    const [open, setOpen] = useState(false)
    const [amount, setAmount] = useState<number>(NaN)
    const [method, setMethod] = useState<'CASH' | 'ONLINE_TRANSFER' | 'TNG'>('CASH')
    const [note, setNote] = useState('')
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({})
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { refreshPage, isRefreshing } = usePageRefresh()
    const isLoading = isSubmitting || isRefreshing

    const isManualMode = selectedIds.size > 0

    // Items actively participating in the distribution
    const activeItems = useMemo(() => {
        if (!isManualMode) return lumpsumItems
        return lumpsumItems.filter(i => selectedIds.has(i.id))
    }, [lumpsumItems, selectedIds, isManualMode])

    const totalOutstanding = lumpsumItems.reduce((s, i) => s + i.outstanding, 0)
    const activeOutstanding = activeItems.reduce((s, i) => s + i.outstanding, 0)

    // Coverage preview — only over active items
    const coverage = useMemo(() => {
        const validAmount = !isNaN(amount) && amount > 0 ? amount : 0
        return simulateCoverage(activeItems, validAmount)
    }, [activeItems, amount])

    // Map coverage back by id for quick lookup
    const coverageById = useMemo(() => {
        const map: Record<string, { amountCovered: number; fullyPaid: boolean }> = {}
        coverage.forEach(c => { map[c.id] = { amountCovered: c.amountCovered, fullyPaid: c.fullyPaid } })
        return map
    }, [coverage])

    function toggleItem(id: string) {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function handleOpen(val: boolean) {
        if (!val) {
            setItemNotes({})
            setSelectedIds(new Set())
            setAmount(NaN)
        }
        setOpen(val)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!amount || isNaN(amount) || amount <= 0) return

        setIsSubmitting(true)
        const res = await logLumpsumPayment({
            enrollmentId,
            amountPaid: amount,
            method,
            note: note || undefined,
            itemNotes: Object.keys(itemNotes).length > 0 ? itemNotes : undefined,
            selectedItemIds: isManualMode ? Array.from(selectedIds) : undefined
        })

        if (res.success) {
            setOpen(false)
            setAmount(NaN)
            setNote('')
            setItemNotes({})
            setSelectedIds(new Set())
            refreshPage()
        } else {
            alert(res.error)
        }
        setIsSubmitting(false)
    }

    return (
        <Dialog.Root open={open} onOpenChange={handleOpen}>
            <Dialog.Trigger asChild>
                <button
                    disabled={disabled}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-semibold"
                >
                    <Plus className="w-4 h-4" />
                    Pay Package / Lumpsum
                </button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]" />
                <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-xl shadow-xl z-[10000] overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                        <Dialog.Title className="text-lg font-bold text-gray-900">
                            Pay Package / Lumpsum
                        </Dialog.Title>
                        <Dialog.Close className="text-gray-400 hover:text-gray-600 p-1">
                            <X className="w-5 h-5" />
                        </Dialog.Close>
                    </div>

                    <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                        <div className="p-6 space-y-5">

                            {/* ── AMOUNT FIELD ── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Amount to Pay
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">RM</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        required
                                        autoFocus
                                        value={isNaN(amount) ? '' : amount}
                                        onChange={e => setAmount(parseFloat(e.target.value))}
                                        className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-base"
                                        placeholder="0.00"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAmount(activeOutstanding)}
                                    className="mt-1.5 text-xs text-blue-600 hover:underline"
                                >
                                    {isManualMode
                                        ? `Fill selected items total (RM ${activeOutstanding.toFixed(2)})`
                                        : `Fill full outstanding amount (RM ${totalOutstanding.toFixed(2)})`
                                    }
                                </button>

                                {/* Excess → monthly fees banner */}
                                {!isNaN(amount) && amount > activeOutstanding && activeOutstanding > 0 && monthlyOutstanding > 0 && (
                                    <div className="mt-2 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
                                        <span className="text-blue-500 text-base leading-none">ℹ️</span>
                                        <span>
                                            Excess <strong>RM {(Math.min(amount - activeOutstanding, monthlyOutstanding)).toFixed(2)}</strong> will auto-distribute to outstanding monthly school fees
                                            {' '}(RM {monthlyOutstanding.toFixed(2)} remaining).
                                        </span>
                                    </div>
                                )}

                                {/* True overpayment — nothing left to absorb the excess */}
                                {!isNaN(amount) && amount > activeOutstanding && activeOutstanding > 0 && monthlyOutstanding === 0 && (
                                    <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                                        <span className="text-amber-500 text-base leading-none">⚠️</span>
                                        <span>
                                            Exceeds {isManualMode ? 'selected' : 'total'} outstanding by{' '}
                                            <strong>RM {(amount - activeOutstanding).toFixed(2)}</strong>.
                                            Only <strong>RM {activeOutstanding.toFixed(2)}</strong> will be applied.
                                            The excess will <strong>not</strong> be recorded.
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── ITEM LIST ── */}
                            {lumpsumItems.length > 0 && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-600">
                                            {isManualMode
                                                ? `Paying ${selectedIds.size} selected item${selectedIds.size > 1 ? 's' : ''} (manual)`
                                                : 'Auto-distribute (tap items to select specific ones)'}
                                        </span>
                                        {isManualMode && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedIds(new Set())}
                                                className="text-xs text-blue-500 hover:underline"
                                            >
                                                Clear selection
                                            </button>
                                        )}
                                    </div>

                                    <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                                        {lumpsumItems.map((item) => {
                                            const isSelected = selectedIds.has(item.id)
                                            const cov = coverageById[item.id]
                                            const isCovered = cov && cov.amountCovered > 0
                                            const isPartial = isCovered && !cov.fullyPaid
                                            const isActive = !isManualMode || isSelected

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`px-4 py-3 transition-colors duration-150 cursor-pointer select-none ${
                                                        isSelected
                                                            ? cov?.fullyPaid ? 'bg-green-50' : isPartial ? 'bg-amber-50' : 'bg-blue-50'
                                                            : isActive && cov?.fullyPaid ? 'bg-green-50'
                                                            : isActive && isPartial ? 'bg-amber-50'
                                                            : 'bg-white hover:bg-gray-50'
                                                    }`}
                                                    onClick={() => toggleItem(item.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {/* Checkbox */}
                                                        <div className="shrink-0 text-gray-400">
                                                            {isSelected
                                                                ? <CheckSquare className="w-4 h-4 text-blue-500" />
                                                                : <Square className="w-4 h-4 text-gray-300" />
                                                            }
                                                        </div>

                                                        {/* Coverage icon */}
                                                        {isActive && (
                                                            cov?.fullyPaid
                                                                ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                                                : isPartial
                                                                ? <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                                                                : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                                                        )}

                                                        <span className={`text-sm font-medium flex-1 ${
                                                            !isActive ? 'text-gray-300' : cov?.fullyPaid ? 'text-green-800' : isPartial ? 'text-amber-800' : 'text-gray-700'
                                                        }`}>
                                                            {item.name}
                                                        </span>

                                                        <span className={`text-sm shrink-0 ${
                                                            !isActive ? 'text-gray-300' : isCovered ? (cov.fullyPaid ? 'text-green-700 font-semibold' : 'text-amber-700 font-semibold') : 'text-gray-400'
                                                        }`}>
                                                            {isActive && isCovered
                                                                ? <>RM {cov.amountCovered.toFixed(2)}{isPartial && <span className="text-xs font-normal ml-1 opacity-70">/ {item.outstanding.toFixed(2)}</span>}</>
                                                                : `RM ${item.outstanding.toFixed(2)}`
                                                            }
                                                        </span>
                                                    </div>

                                                    {/* Size input — only for covered+selected items with needsSize */}
                                                    {item.needsSize && isActive && isCovered && (
                                                        <div className="mt-2 ml-14" onClick={e => e.stopPropagation()}>
                                                            <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                                                                <Ruler className="w-3 h-3" />
                                                                Size (will appear on receipt)
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={itemNotes[item.id] || ''}
                                                                onChange={e => setItemNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                placeholder="e.g. Size: M"
                                                                className="w-full px-3 py-1.5 border border-blue-300 bg-blue-50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}

                                        <div className="px-4 py-2.5 bg-gray-50 flex justify-between items-center">
                                            <span className="text-sm font-semibold text-gray-700">Total Outstanding</span>
                                            <span className="text-sm font-semibold text-gray-700">RM {totalOutstanding.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── PAYMENT METHOD ── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                <select
                                    value={method}
                                    onChange={e => setMethod(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="ONLINE_TRANSFER">Online Transfer</option>
                                    <option value="TNG">TnG</option>
                                </select>
                            </div>

                            {/* ── REFERENCE NOTE ── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Note (Optional)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="e.g. Reference #12345"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 flex justify-end gap-3 border-t border-gray-100 shrink-0 bg-white">
                            <Dialog.Close asChild>
                                <button type="button" className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                                    Cancel
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={isLoading || !amount || isNaN(amount) || amount <= 0}
                                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                {isLoading ? 'Processing...' : 'Record Payment'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
