/**
 * Get the current date as a string in YYYY-MM-DD format using local timezone
 * This prevents timezone offset issues when using toISOString() which uses UTC
 */
export function getLocalDateString(date?: Date): string {
    const d = date || new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Get today's date as a string in YYYY-MM-DD format using local timezone
 */
export function getTodayDateString(): string {
    return getLocalDateString()
}

