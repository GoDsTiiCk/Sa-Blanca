export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'finished'

export const reservationStatusLabels: Record<
  ReservationStatus,
  string
> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  finished: 'Finalizada',
}

export function mapStoredReservationStatus(
  status: string,
): ReservationStatus {
  switch (status) {
    case 'Confirmada':
      return 'confirmed'
    case 'Cancelada':
      return 'cancelled'
    case 'Completada':
      return 'finished'
    case 'Pendiente':
    default:
      return 'pending'
  }
}