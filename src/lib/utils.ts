import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmt(n: number, digits = 0) {
  return n.toFixed(digits).padStart(digits + 2, '0')
}

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}