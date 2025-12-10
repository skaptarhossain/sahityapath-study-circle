import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | number): string {
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: Date | number): string {
  return new Intl.DateTimeFormat('bn-BD', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getRelativeTime(date: Date | number): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'এইমাত্র'
  if (diffMin < 60) return `${diffMin} মিনিট আগে`
  if (diffHour < 24) return `${diffHour} ঘণ্টা আগে`
  if (diffDay === 1) return 'গতকাল'
  if (diffDay < 7) return `${diffDay} দিন আগে`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} সপ্তাহ আগে`
  return formatDate(then)
}

export function generateCode(length: number = 6): string {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase()
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.substring(0, length) + '...' : str
}
