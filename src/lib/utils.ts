import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format Indian Currency: e.g. 124500 -> ₹1,24,500
 */
export function formatINR(amount: number): string {
  const rounded = Math.round(amount)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rounded)
}

/**
 * Mask Indian phone numbers: e.g. +91 98765 43210 -> +91 98••• ••210
 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  const clean = phone.replace(/\s+/g, '')
  if (clean.length >= 10) {
    const start = clean.slice(0, clean.length - 7)
    const end = clean.slice(-3)
    return `${start} ••• ••${end}`
  }
  return phone
}

/**
 * Format IST Date: e.g. "Thu, 17 Oct · 7:00 pm"
 */
export function formatISTDateTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const dayName = days[date.getDay()]
  const dayNum = date.getDate()
  const monthName = months[date.getMonth()]
  
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`
  
  return `${dayName}, ${dayNum} ${monthName} · ${hours}:${minStr} ${ampm}`
}

export function formatISTDate(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`
}
