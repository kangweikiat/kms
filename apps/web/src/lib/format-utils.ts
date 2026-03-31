import { format } from "date-fns"

/**
 * Format a number to Malaysian Ringgit (RM)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format a date object or string into dd/MM/yyyy
 */
export function formatDate(date: Date | string | number): string {
    if (!date) return ''
    const d = new Date(date)
    return format(d, 'dd/MM/yyyy')
}

/**
 * Format a date object or string into dd/MM/yyyy, HH:mm
 */
export function formatDateTime(date: Date | string | number): string {
    if (!date) return ''
    const d = new Date(date)
    return format(d, 'dd/MM/yyyy, HH:mm')
}
