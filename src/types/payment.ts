export type PaymentMethod =
  | 'Efectivo'
  | 'Tarjeta'
  | 'Transferencia'
  | 'Bizum'

export type PaymentStatus =
  | 'Pendiente'
  | 'Parcial'
  | 'Pagado'

export type PaymentType =
  | 'Reserva'
  | 'Fianza'

export type Payment = {
  id: string

  reservationId: string

  amount: number

  method: PaymentMethod

  type: PaymentType

  status: PaymentStatus

  paymentDate: string

  notes?: string

  createdAt: string

  updatedAt: string
}