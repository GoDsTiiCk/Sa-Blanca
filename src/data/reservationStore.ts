export type ReservationShift =
  | 'turno-1'
  | 'turno-2'
  | 'turno-3'

export type ReservationStatus =
  | 'Pendiente'
  | 'Confirmada'
  | 'Cancelada'
  | 'Completada'

export type ReservationClient = {
  name: string
  dni: string
  phone: string
  email: string
  address: string
}

export type ReservationService = {
  id: string
  name: string
  price: number
}

export type ReservationPricing = {
  pricingVersionId: string
  pricingEffectiveFrom: string
  room: number
  cleaning: number
  attendanceSurcharge: number
  services: ReservationService[]
  dj: number
  catering: number
  total: number
}

export type ReservationCancellation = {
  cancelledAt: string
  cancelledBy: string
  notes: string
}

export type ReservationDeletion = {
  deletedAt: string
  deletedBy: string
  notes: string
}

export type ReservationDeposit = {
  amount: number
  returned: boolean
  returnedAt?: string
  returnedBy?: string
  notes?: string
}

export type Reservation = {
  id: string
  createdAt: string

  date: string

  client: ReservationClient

  partyType: string

  guests: number

  shifts: ReservationShift[]

  /**
   * Texto preparado para mostrar
   * rápidamente en listados y detalles.
   */
  shift: string

  holiday: boolean
  holidayName?: string

  pricing: ReservationPricing

  amountPaid: number
  amountPending: number

  /**
   * Fianza de la reserva.
   *
   * Es independiente de la facturación:
   * no forma parte de pricing.total.
   */
  deposit?: ReservationDeposit

  status: ReservationStatus

  customerNotes: string
  internalNotes: string

  /**
   * Historial de cancelación.
   *
   * Una reserva puede estar cancelada
   * sin estar eliminada.
   */
  cancellation?: ReservationCancellation

  /**
   * Historial de eliminación.
   *
   * La reserva no se borra físicamente:
   * queda registrada para mantener
   * trazabilidad.
   */
  deletion?: ReservationDeletion
}

export type CreateReservationInput = {
  date: string

  client: ReservationClient

  partyType: string

  guests: number

  shifts: ReservationShift[]

  holiday: boolean
  holidayName?: string

  pricing: ReservationPricing

  amountPaid: number

  /**
   * Importe de la fianza.
   * Si no se indica, se guarda como 0 €.
   */
  depositAmount?: number

  customerNotes: string
  internalNotes: string
}

const STORAGE_KEY =
  'sa-blanca-reservations'

const EVENT_NAME =
  'sa-blanca-reservations-updated'

function canUseStorage() {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !==
      'undefined'
  )
}

function notifyChanges() {
  if (!canUseStorage()) {
    return
  }

  window.dispatchEvent(
    new CustomEvent(EVENT_NAME),
  )
}

function createReservationId(
  reservations: Reservation[],
) {
  let highestNumber = 0

  reservations.forEach(
    (reservation) => {
      const match =
        reservation.id.match(
          /^RSV-(\d+)$/,
        )

      if (!match) {
        return
      }

      const number =
        Number(match[1])

      if (
        Number.isFinite(number) &&
        number > highestNumber
      ) {
        highestNumber = number
      }
    },
  )

  return `RSV-${String(
    highestNumber + 1,
  ).padStart(3, '0')}`
}

/**
 * Devuelve TODAS las reservas almacenadas,
 * incluidas las eliminadas.
 *
 * Esta función se utiliza para:
 * - auditoría
 * - historial
 * - generación segura de IDs
 */
export function getAllReservations(): Reservation[] {
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

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as Reservation[]
  } catch {
    return []
  }
}

/**
 * Devuelve únicamente las reservas
 * activas dentro de la aplicación.
 *
 * Las reservas eliminadas permanecen
 * almacenadas, pero no aparecen en:
 * - Reservas
 * - Calendario
 * - disponibilidad
 * - listados
 * - etc.
 */
export function getReservations(): Reservation[] {
  return getAllReservations().filter(
    (reservation) =>
      !reservation.deletion,
  )
}

export function saveReservations(
  reservations: Reservation[],
) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(reservations),
  )

  notifyChanges()
}

/**
 * Busca una reserva activa.
 */
export function getReservationById(
  id: string,
): Reservation | undefined {
  return getReservations().find(
    (reservation) =>
      reservation.id === id,
  )
}

/**
 * Busca una reserva incluyendo
 * reservas eliminadas.
 *
 * Útil para auditoría e historial.
 */
export function getAnyReservationById(
  id: string,
): Reservation | undefined {
  return getAllReservations().find(
    (reservation) =>
      reservation.id === id,
  )
}

export function createReservation(
  input: CreateReservationInput,
): Reservation {
  const reservations =
    getAllReservations()

  /*
   * Comprobamos nuevamente la
   * disponibilidad justo antes de
   * guardar.
   *
   * Las reservas canceladas y
   * eliminadas no bloquean turnos.
   */
  const occupied =
    getOccupiedShifts(input.date)

  const conflict =
    input.shifts.find((shift) =>
      occupied.includes(shift),
    )

  if (conflict) {
    throw new Error(
      `El ${getShiftLabel(
        conflict,
      )} ya está ocupado para esta fecha.`,
    )
  }

  const id =
    createReservationId(
      reservations,
    )

  const amountPaid =
    Math.max(
      0,
      Math.min(
        input.amountPaid,
        input.pricing.total,
      ),
    )

  const reservation: Reservation = {
    id,

    createdAt:
      new Date().toISOString(),

    date: input.date,

    client: {
      ...input.client,
    },

    partyType:
      input.partyType,

    guests:
      input.guests,

    shifts: [
      ...input.shifts,
    ],

    shift:
      input.shifts
        .map(getShiftLabel)
        .join(' + '),

    holiday:
      input.holiday,

    holidayName:
      input.holidayName,

    /*
     * Guardamos una copia de los
     * precios utilizados en el momento
     * de crear la reserva.
     */
    pricing: {
      ...input.pricing,

      services:
        input.pricing.services.map(
          (service) => ({
            ...service,
          }),
        ),
    },

    amountPaid,

    amountPending:
      Math.max(
        0,
        input.pricing.total -
          amountPaid,
      ),

    deposit: {
      amount: Math.max(
        0,
        Number(
          input.depositAmount ??
            input.pricing.room +
            100,
        ),
      ),
      returned: false,
    },

    status:
      'Pendiente',

    customerNotes:
      input.customerNotes,

    internalNotes:
      input.internalNotes,
  }

  saveReservations([
    ...reservations,
    reservation,
  ])

  return reservation
}

export function updateReservation(
  reservation: Reservation,
) {
  const reservations =
    getAllReservations()

  const existing =
    reservations.find(
      (item) =>
        item.id === reservation.id,
    )

  if (!existing) {
    throw new Error(
      'No se ha encontrado la reserva que se intenta actualizar.',
    )
  }

  /*
   * Una reserva eliminada no puede
   * modificarse mediante la edición
   * normal.
   */
  if (existing.deletion) {
    throw new Error(
      'La reserva está eliminada y no puede modificarse.',
    )
  }

  const updated =
    reservations.map(
      (item) =>
        item.id === reservation.id
          ? reservation
          : item,
    )

  saveReservations(updated)

  return reservation
}

/**
 * Cancela una reserva.
 *
 * OBLIGATORIO:
 * - motivo/observación
 * - nombre de quien cancela
 *
 * La reserva NO se elimina.
 */
export function cancelReservation(
  id: string,
  notes: string,
  cancelledBy: string,
): Reservation {
  const cleanNotes =
    notes.trim()

  const cleanCancelledBy =
    cancelledBy.trim()

  if (!cleanNotes) {
    throw new Error(
      'Debes indicar una observación para cancelar la reserva.',
    )
  }

  if (!cleanCancelledBy) {
    throw new Error(
      'Debes indicar quién ha cancelado la reserva.',
    )
  }

  const reservations =
    getAllReservations()

  const existing =
    reservations.find(
      (reservation) =>
        reservation.id === id,
    )

  if (!existing) {
    throw new Error(
      'No se ha encontrado la reserva.',
    )
  }

  if (existing.deletion) {
    throw new Error(
      'La reserva ya está eliminada.',
    )
  }

  if (existing.status === 'Cancelada') {
    throw new Error(
      'La reserva ya está cancelada.',
    )
  }

  if (existing.status === 'Completada') {
    throw new Error(
      'Una reserva completada no puede cancelarse.',
    )
  }

  const updatedReservation: Reservation = {
    ...existing,

    status: 'Cancelada',

    cancellation: {
      cancelledAt:
        new Date().toISOString(),

      cancelledBy:
        cleanCancelledBy,

      notes:
        cleanNotes,
    },
  }

  const updated =
    reservations.map(
      (reservation) =>
        reservation.id === id
          ? updatedReservation
          : reservation,
    )

  saveReservations(updated)

  return updatedReservation
}

/**
 * Marca una reserva como eliminada.
 *
 * IMPORTANTE:
 * La reserva DEBE estar previamente
 * cancelada.
 *
 * No se elimina físicamente del
 * almacenamiento para conservar
 * el historial y la trazabilidad.
 */
export function deleteReservation(
  id: string,
  notes: string,
  deletedBy: string,
): Reservation {
  const cleanNotes =
    notes.trim()

  const cleanDeletedBy =
    deletedBy.trim()

  if (!cleanNotes) {
    throw new Error(
      'Debes indicar una observación para eliminar la reserva.',
    )
  }

  if (!cleanDeletedBy) {
    throw new Error(
      'Debes indicar quién ha eliminado la reserva.',
    )
  }

  const reservations =
    getAllReservations()

  const existing =
    reservations.find(
      (reservation) =>
        reservation.id === id,
    )

  if (!existing) {
    throw new Error(
      'No se ha encontrado la reserva.',
    )
  }

  if (existing.deletion) {
    throw new Error(
      'La reserva ya está eliminada.',
    )
  }

  /*
   * ESTA ES LA PROTECCIÓN PRINCIPAL:
   *
   * Nunca se puede eliminar una
   * reserva que no haya sido cancelada.
   */
  if (existing.status !== 'Cancelada') {
    throw new Error(
      'No se puede eliminar una reserva que no esté cancelada. Primero debes cancelarla indicando el motivo y quién la cancela.',
    )
  }

  const updatedReservation: Reservation = {
    ...existing,

    deletion: {
      deletedAt:
        new Date().toISOString(),

      deletedBy:
        cleanDeletedBy,

      notes:
        cleanNotes,
    },
  }

  const updated =
    reservations.map(
      (reservation) =>
        reservation.id === id
          ? updatedReservation
          : reservation,
    )

  saveReservations(updated)

  return updatedReservation
}

/**
 * Comprueba los turnos ocupados.
 *
 * Una reserva cancelada o eliminada
 * NO bloquea el turno.
 */
export function getOccupiedShifts(
  date: string,
): ReservationShift[] {
  const reservations =
    getReservations()

  const occupied =
    new Set<ReservationShift>()

  reservations
    .filter(
      (reservation) =>
        reservation.date === date &&
        reservation.status !==
          'Cancelada' &&
        !reservation.deletion,
    )
    .forEach(
      (reservation) => {
        reservation.shifts.forEach(
          (shift) => {
            occupied.add(shift)
          },
        )
      },
    )

  return Array.from(occupied)
}

export function getReservationsForDate(
  date: string,
): Reservation[] {
  return getReservations().filter(
    (reservation) =>
      reservation.date === date,
  )
}

export function subscribeToReservations(
  callback: () => void,
) {
  if (!canUseStorage()) {
    return () => {}
  }

  const customHandler = () => {
    callback()
  }

  const storageHandler = (
    event: StorageEvent,
  ) => {
    if (
      event.key === STORAGE_KEY
    ) {
      callback()
    }
  }

  window.addEventListener(
    EVENT_NAME,
    customHandler,
  )

  window.addEventListener(
    'storage',
    storageHandler,
  )

  return () => {
    window.removeEventListener(
      EVENT_NAME,
      customHandler,
    )

    window.removeEventListener(
      'storage',
      storageHandler,
    )
  }
}

/**
 * Devuelve la fianza de una reserva.
 *
 * Las reservas antiguas que no tengan
 * todavía el campo deposit se consideran
 * automáticamente como fianza 0 €.
 */
export function getReservationDeposit(
  reservation: Reservation,
): ReservationDeposit {
  return {
    amount: Math.max(
      0,
      Number(reservation.deposit?.amount ?? 0),
    ),
    returned:
      reservation.deposit?.returned === true,
    returnedAt:
      reservation.deposit?.returnedAt,
    returnedBy:
      reservation.deposit?.returnedBy,
    notes:
      reservation.deposit?.notes,
  }
}

/**
 * Marca la fianza como devuelta.
 *
 * OBLIGATORIO:
 * - observación
 * - nombre de quien realiza la devolución
 */
export function returnReservationDeposit(
  id: string,
  notes: string,
  returnedBy: string,
): Reservation {
  const cleanNotes = notes.trim()
  const cleanReturnedBy = returnedBy.trim()

  if (!cleanNotes) {
    throw new Error(
      'Debes indicar una observación para devolver la fianza.',
    )
  }

  if (!cleanReturnedBy) {
    throw new Error(
      'Debes indicar quién ha devuelto la fianza.',
    )
  }

  const reservations = getAllReservations()

  const existing = reservations.find(
    (reservation) =>
      reservation.id === id,
  )

  if (!existing) {
    throw new Error(
      'No se ha encontrado la reserva.',
    )
  }

  if (existing.deletion) {
    throw new Error(
      'La reserva está eliminada y no puede modificarse.',
    )
  }

  const currentDeposit =
    getReservationDeposit(existing)

  const depositAmount =
    currentDeposit.amount > 0
      ? currentDeposit.amount
      : Math.max(
          0,
          Number(existing.pricing.room) + 100,
        )

  if (depositAmount <= 0) {
    throw new Error(
      'Esta reserva no tiene una fianza registrada.',
    )
  }

  if (currentDeposit.returned) {
    throw new Error(
      'La fianza de esta reserva ya figura como devuelta.',
    )
  }

  const updatedReservation: Reservation = {
    ...existing,
    deposit: {
      ...currentDeposit,
      amount: depositAmount,
      returned: true,
      returnedAt:
        new Date().toISOString(),
      returnedBy: cleanReturnedBy,
      notes: cleanNotes,
    },
  }

  const updated = reservations.map(
    (reservation) =>
      reservation.id === id
        ? updatedReservation
        : reservation,
  )

  saveReservations(updated)

  return updatedReservation
}

/**
 * Actualiza el importe de la fianza.
 *
 * Si la fianza ya ha sido devuelta,
 * no se permite cambiar su importe.
 */
export function updateReservationDepositAmount(
  id: string,
  amount: number,
): Reservation {
  const reservations = getAllReservations()

  const existing = reservations.find(
    (reservation) =>
      reservation.id === id,
  )

  if (!existing) {
    throw new Error(
      'No se ha encontrado la reserva.',
    )
  }

  if (existing.deletion) {
    throw new Error(
      'La reserva está eliminada y no puede modificarse.',
    )
  }

  const currentDeposit =
    getReservationDeposit(existing)

  if (currentDeposit.returned) {
    throw new Error(
      'No se puede modificar una fianza que ya ha sido devuelta.',
    )
  }

  const cleanAmount = Math.max(
    0,
    Number.isFinite(amount) ? amount : 0,
  )

  const updatedReservation: Reservation = {
    ...existing,
    deposit: {
      ...currentDeposit,
      amount: cleanAmount,
      returned: false,
    },
  }

  const updated = reservations.map(
    (reservation) =>
      reservation.id === id
        ? updatedReservation
        : reservation,
  )

  saveReservations(updated)

  return updatedReservation
}

export function getReservationTotal(
  reservation: Reservation,
) {
  return reservation.pricing.total
}

export function getReservationPending(
  reservation: Reservation,
) {
  return Math.max(
    0,
    reservation.pricing.total -
      reservation.amountPaid,
  )
}

function getShiftLabel(
  shift: ReservationShift,
) {
  const labels: Record<
    ReservationShift,
    string
  > = {
    'turno-1': 'Turno 1',
    'turno-2': 'Turno 2',
    'turno-3': 'Turno 3',
  }

  return labels[shift]
}