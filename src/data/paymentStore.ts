import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentType,
} from '../types/payment'

import {
  getReservationById,
  getReservationPending,
  updateReservation,
} from './reservationStore'

const STORAGE_KEY =
  'sa-blanca-payments'

const EVENT_NAME =
  'sa-blanca-payments-updated'

function canUseStorage() {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  )
}

export function getPayments(): Payment[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const stored =
      window.localStorage.getItem(
        STORAGE_KEY,
      )

    if (!stored) {
      return []
    }

    const parsed =
      JSON.parse(stored)

    return Array.isArray(parsed)
      ? (parsed as Payment[])
      : []
  } catch {
    return []
  }
}

function savePayments(
  payments: Payment[],
) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(payments),
  )

  window.dispatchEvent(
    new CustomEvent(EVENT_NAME),
  )
}

function createPaymentId() {
  return `PAY-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`
}

export function getPaymentsByReservation(
  reservationId: string,
) {
  return getPayments().filter(
    (payment) =>
      payment.reservationId ===
      reservationId,
  )
}

export function getPaymentStatus(
  paid: number,
  total: number,
): PaymentStatus {
  if (paid <= 0) {
    return 'Pendiente'
  }

  if (paid >= total) {
    return 'Pagado'
  }

  return 'Parcial'
}

export function registerPayment(input: {
  reservationId: string
  amount: number
  method: PaymentMethod
  type: PaymentType
  paymentDate: string
  notes?: string
}) {
  const reservation =
    getReservationById(
      input.reservationId,
    )

  if (!reservation) {
    throw new Error(
      'No se ha encontrado la reserva.',
    )
  }

  const pending =
    getReservationPending(
      reservation,
    )

  if (input.amount <= 0) {
    throw new Error(
      'El importe debe ser mayor que 0.',
    )
  }

  if (input.amount > pending) {
    throw new Error(
      'El importe supera el pendiente de la reserva.',
    )
  }

  const now =
    new Date().toISOString()

  const payment: Payment = {
    id: createPaymentId(),

    reservationId:
      input.reservationId,

    amount: input.amount,

    method: input.method,

    type: input.type,

    status: getPaymentStatus(
      reservation.amountPaid +
        input.amount,
      reservation.pricing.total,
    ),

    paymentDate:
      input.paymentDate,

    notes: input.notes,

    createdAt: now,

    updatedAt: now,
  }

  const payments = [
    ...getPayments(),
    payment,
  ]

  savePayments(payments)

  const amountPaid =
    reservation.amountPaid +
    input.amount

  updateReservation({
    ...reservation,

    amountPaid,

    amountPending:
      Math.max(
        reservation.pricing.total -
          amountPaid,
        0,
      ),

    status:
      reservation.status,
  })

  return payment
}

export function subscribeToPayments(
  callback: () => void,
) {
  if (!canUseStorage()) {
    return () => {}
  }

  const handler = () => {
    callback()
  }

  window.addEventListener(
    EVENT_NAME,
    handler,
  )

  window.addEventListener(
    'storage',
    handler,
  )

  return () => {
    window.removeEventListener(
      EVENT_NAME,
      handler,
    )

    window.removeEventListener(
      'storage',
      handler,
    )
  }
}