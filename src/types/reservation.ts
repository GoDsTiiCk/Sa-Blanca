import type { ReservationService } from './service'
import type { PaymentStatus } from './payment'
import type { PriceBreakdown, ShiftType } from './pricing'

export type PartyType =
  | 'Cumpleaños-Infantil'
  | 'Cumpleaños-Adulto'
  | 'Comunión'
  | 'Boda'
  | 'Aniversario'
  | 'Fiesta-Privada'
  | 'Evento-Corportativo'
  | 'Otro'

export type ReservationStatus =
  | 'Pendiente'
  | 'Confirmado'
  | 'Cancelado'
  | 'Finalizado'

export interface Reservation {
  id: string

  eventDate: string
  partyType: PartyType
  guests: number
  shift: ShiftType

  clientId: string

  isHoliday: boolean
  holidayName?: string

  pricing: PriceBreakdown

  services: ReservationService[]

  amountPaid: number
  amountPending: number

  paymentStatus: PaymentStatus

  reservationDate: string
  paymentDate?: string
  depositRefundDate?: string

  reservationStatus: ReservationStatus

  customerNotes?: string
  internalNotes?: string

  createdAt: string
  updatedAt: string
}