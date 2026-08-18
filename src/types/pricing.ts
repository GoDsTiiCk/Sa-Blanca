export type ShiftType = 'morning' | 'afternoon' | 'night'

export interface Shift {
  id: ShiftType
  name: string
  startTime: string
  endTime: string
}

export interface PricingRule {
  id: string
  name: string
  days: number[]
  shift: ShiftType
  roomPrice: number
  cleaningPrice: number
  active: boolean
}

export interface PriceBreakdown {
  roomPrice: number
  cleaningPrice: number
  attendanceSurcharge: number
  servicesTotal: number
  subtotal: number
  total: number
}