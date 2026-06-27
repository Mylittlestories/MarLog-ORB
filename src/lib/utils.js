import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getUTCDateInputValue(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function getUTCTimeInputValue(date = new Date()) {
  return date.toISOString().slice(11, 16)
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  })
}

export function formatTime(timeStr) {
  return timeStr || '—'
}

export function formatDateTime(dateStr, timeStr) {
  return `${formatDate(dateStr)} ${formatTime(timeStr)}`
}

export function generateEntryNumber() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
}

export function validateIMO(imo) {
  if (!imo) return false
  const cleaned = String(imo).replace(/[^0-9]/g, '')
  if (!/^\d{7}$/.test(cleaned)) return false

  const digits = cleaned.split('').map(Number)
  const checksum = digits.slice(0, 6).reduce((sum, digit, index) => sum + digit * (7 - index), 0) % 10
  return checksum === digits[6]
}

export function isNonNegativeNumber(value) {
  if (value === '' || value === null || value === undefined) return true
  const number = Number(value)
  return Number.isFinite(number) && number >= 0
}

export function formatPosition(lat, lon) {
  if (!lat || !lon) return '—'
  return `${lat}, ${lon}`
}
