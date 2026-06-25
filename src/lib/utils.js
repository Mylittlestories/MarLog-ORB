import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
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
  const cleaned = imo.replace(/[^0-9]/g, '')
  return cleaned.length === 7
}

export function formatPosition(lat, lon) {
  if (!lat || !lon) return '—'
  return `${lat}, ${lon}`
}
