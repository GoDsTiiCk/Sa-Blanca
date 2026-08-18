import { getReservations } from './reservationStore'

export type CleaningExpenseType =
  | 'Limpieza'
  | 'Otros'

export type CleaningRecord = {
  id: string
  reservationId: string
  type: CleaningExpenseType
  date: string
  responsible: string
  entryTime: string
  exitTime: string
  hours: number
  cost: number
  notes: string
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'sa-blanca-cleaning-records'
const EVENT_NAME = 'sa-blanca-cleaning-updated'

function canUseStorage() {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
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

function createId() {
  const random = Math.random()
    .toString(36)
    .slice(2, 8)

  return `CLN-${Date.now()}-${random}`
}

export function getCleaningRecords(): CleaningRecord[] {
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

    const parsed = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed as CleaningRecord[]
  } catch {
    return []
  }
}

export function saveCleaningRecords(
  records: CleaningRecord[],
) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(records),
  )

  notifyChanges()
}

export type CreateCleaningRecordInput = Omit<
  CleaningRecord,
  'id' | 'createdAt' | 'updatedAt' | 'hours'
>

export function createCleaningRecord(
  input: CreateCleaningRecordInput,
) {
  const records = getCleaningRecords()

  const now =
    new Date().toISOString()

  const record: CleaningRecord = {
    ...input,
    id: createId(),
    hours: calculateCleaningHours(
      input.entryTime,
      input.exitTime,
      input.type,
    ),
    createdAt: now,
    updatedAt: now,
  }

  saveCleaningRecords([
    ...records,
    record,
  ])

  return record
}

export function updateCleaningRecord(
  record: CleaningRecord,
) {
  const records = getCleaningRecords()

  const updated = records.map(
    (item) =>
      item.id === record.id
        ? {
            ...record,
            hours:
              calculateCleaningHours(
                record.entryTime,
                record.exitTime,
                record.type,
              ),
            updatedAt:
              new Date().toISOString(),
          }
        : item,
  )

  saveCleaningRecords(updated)

  return updated.find(
    (item) => item.id === record.id,
  )
}

export function deleteCleaningRecord(
  id: string,
) {
  saveCleaningRecords(
    getCleaningRecords().filter(
      (record) => record.id !== id,
    ),
  )
}

export function subscribeToCleaning(
  callback: () => void,
) {
  if (!canUseStorage()) {
    return () => {}
  }

  const customHandler = () => callback()

  const storageHandler = (
    event: StorageEvent,
  ) => {
    if (event.key === STORAGE_KEY) {
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

export function calculateCleaningHours(
  entryTime: string,
  exitTime: string,
  type: CleaningExpenseType,
) {
  if (
    type !== 'Limpieza' ||
    !entryTime ||
    !exitTime
  ) {
    return 0
  }

  const [entryHours, entryMinutes] =
    entryTime.split(':').map(Number)

  const [exitHours, exitMinutes] =
    exitTime.split(':').map(Number)

  if (
    !Number.isFinite(entryHours) ||
    !Number.isFinite(entryMinutes) ||
    !Number.isFinite(exitHours) ||
    !Number.isFinite(exitMinutes)
  ) {
    return 0
  }

  let entry =
    entryHours * 60 + entryMinutes

  let exit =
    exitHours * 60 + exitMinutes

  if (exit < entry) {
    exit += 24 * 60
  }

  return (exit - entry) / 60
}

export function formatCleaningHours(
  hours: number,
) {
  const totalMinutes = Math.round(
    hours * 60,
  )

  const wholeHours = Math.floor(
    totalMinutes / 60,
  )

  const minutes = totalMinutes % 60

  if (minutes === 0) {
    return `${wholeHours} h`
  }

  return `${wholeHours} h ${minutes
    .toString()
    .padStart(2, '0')} min`
}

export function getCleaningSummary() {
  const records = getCleaningRecords()

  return {
    totalCost: records.reduce(
      (sum, record) =>
        sum + Number(record.cost || 0),
      0,
    ),
    totalHours: records.reduce(
      (sum, record) =>
        sum + Number(record.hours || 0),
      0,
    ),
    cleaningRecords: records.filter(
      (record) => record.type === 'Limpieza',
    ).length,
    otherExpenses: records.filter(
      (record) => record.type === 'Otros',
    ).length,
  }
}

export function getReservationLabel(
  reservationId: string,
) {
  const reservation =
    getReservations().find(
      (item) =>
        item.id === reservationId,
    )

  if (!reservation) {
    return reservationId
  }

  return `${reservation.id} · ${reservation.client.name}`
}