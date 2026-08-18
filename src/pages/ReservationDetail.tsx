import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Euro,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Users,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { registerPayment } from '../data/paymentStore'
import { getServices, subscribeToServices, type Service } from '../data/services'
import {
  cancelReservation,
  deleteReservation,
  getReservationDeposit,
  getReservations,
  returnReservationDeposit,
  subscribeToReservations,
  updateReservation,
  type Reservation as StoredReservation,
} from '../data/reservationStore'
import {
  mapStoredReservationStatus,
  reservationStatusLabels,
} from '../data/reservationStatus'
import type { PaymentMethod } from '../types/payment'
import './ReservationDetail.css'

type ReservationStatus = import('../data/reservationStatus').ReservationStatus

type PartyType =
  | 'child-birthday'
  | 'adult-birthday'
  | 'communion'
  | 'baptism'
  | 'anniversary'
  | 'private-party'
  | 'corporate-event'
  | 'other'

type ReservationDetailData = {
  id: string
  date: string

  client: {
    name: string
    dni: string
    phone: string
    email: string
    address: string
  }

  partyType: PartyType
  guests: number

  shift: string
  shiftHours: string

  roomPrice: number
  cleaning: number
  attendanceSurcharge: number

  services: {
    name: string
    price: number
  }[]

  amountPaid: number
  paymentStatus: string
  reservationStatus: ReservationStatus

  customerNotes: string
  internalNotes: string
}

const mockReservations: ReservationDetailData[] = [
  {
    id: 'RSV-001',
    date: '2026-08-22',

    client: {
      name: 'María García',
      dni: '12345678A',
      phone: '600 123 456',
      email: 'maria@email.com',
      address: 'Palma de Mallorca',
    },

    partyType: 'child-birthday',
    guests: 18,

    shift: 'Turno 2',
    shiftHours: '15:00 - 20:00',

    roomPrice: 120,
    cleaning: 70,
    attendanceSurcharge: 0,

    services: [],

    amountPaid: 0,
    paymentStatus: 'Pendiente',
    reservationStatus: 'confirmed',

    customerNotes:
      'Cumpleaños infantil. Necesita espacio para decoración.',

    internalNotes:
      'Confirmar entrega de llaves el día del evento.',
  },

  {
    id: 'RSV-002',
    date: '2026-08-23',

    client: {
      name: 'Juan Pérez',
      dni: '87654321B',
      phone: '611 234 567',
      email: 'juan@email.com',
      address: 'Palma de Mallorca',
    },

    partyType: 'communion',
    guests: 45,

    shift: 'Turno 1',
    shiftHours: '10:00 - 13:00',

    roomPrice: 130,
    cleaning: 70,
    attendanceSurcharge: 0,

    services: [],

    amountPaid: 100,
    paymentStatus: 'Parcial',
    reservationStatus: 'pending',

    customerNotes:
      'Solicita decoración sencilla.',

    internalNotes: '',
  },

  {
    id: 'RSV-003',
    date: '2026-08-29',

    client: {
      name: 'Ana López',
      dni: '45678912C',
      phone: '622 345 678',
      email: 'ana@email.com',
      address: 'Palma de Mallorca',
    },

    partyType: 'private-party',
    guests: 62,

    shift: 'Turno 3',
    shiftHours: '21:00 - 03:00',

    roomPrice: 250,
    cleaning: 70,
    attendanceSurcharge: 100,

    services: [
      {
        name: 'Fotomatón',
        price: 120,
      },
    ],

    amountPaid: 200,
    paymentStatus: 'Parcial',
    reservationStatus: 'confirmed',

    customerNotes:
      'Fiesta privada. Solicita fotomatón.',

    internalNotes:
      'Aforo superior a 49 personas. Aplicado suplemento.',
  },

  {
    id: 'RSV-004',
    date: '2026-09-05',

    client: {
      name: 'Carlos Martínez',
      dni: '98765432D',
      phone: '633 456 789',
      email: 'carlos@email.com',
      address: 'Palma de Mallorca',
    },

    partyType: 'adult-birthday',
    guests: 35,

    shift: 'Turno 3',
    shiftHours: '21:00 - 03:00',

    roomPrice: 250,
    cleaning: 70,
    attendanceSurcharge: 0,

    services: [],

    amountPaid: 0,
    paymentStatus: 'Pendiente',
    reservationStatus: 'pending',

    customerNotes: '',

    internalNotes: '',
  },
]

const partyTypeLabels: Record<PartyType, string> = {
  'child-birthday': 'Cumpleaños infantil',
  'adult-birthday': 'Cumpleaños adulto',
  communion: 'Comunión',
  baptism: 'Bautizo',
  anniversary: 'Aniversario',
  'private-party': 'Fiesta privada',
  'corporate-event': 'Evento de empresa',
  other: 'Otros',
}

function mapStoredReservationToDetail(
  reservation: StoredReservation,
): ReservationDetailData {
  const pricing = reservation.pricing ?? {}
  const rawShift = (reservation as StoredReservation & {
    shift?: unknown
    shifts?: unknown
    shiftHours?: unknown
  }).shift ?? (reservation as StoredReservation & { shifts?: unknown }).shifts

  const shiftLabels: Record<string, string> = {
    'turno-1': 'Turno 1',
    'turno-2': 'Turno 2',
    'turno-3': 'Turno 3',
  }

  const shiftHoursByValue: Record<string, string> = {
    'turno-1': '10:00 - 13:00',
    'turno-2': '15:00 - 20:00',
    'turno-3': '21:00 - 03:00',
  }

  const shiftValues = Array.isArray(rawShift)
    ? rawShift.map(String)
    : rawShift
      ? [String(rawShift)]
      : []

  const shift = shiftValues
    .map((value) => shiftLabels[value] ?? value)
    .join(' + ')

  const rawShiftHours = (reservation as StoredReservation & { shiftHours?: unknown }).shiftHours
  const shiftHours =
    typeof rawShiftHours === 'string' && rawShiftHours.trim()
      ? rawShiftHours
      : shiftValues
          .map((value) => shiftHoursByValue[value] ?? value)
          .join(' + ')

  const rawClient = reservation.client ?? {}
  const rawServices = Array.isArray(pricing.services)
    ? pricing.services
    : []

  return {
    id: reservation.id,
    date: reservation.date,
    client: {
      name: rawClient.name ?? '',
      dni: rawClient.dni ?? '',
      phone: rawClient.phone ?? '',
      email: rawClient.email ?? '',
      address: rawClient.address ?? '',
    },
    partyType: (reservation.partyType ?? 'other') as PartyType,
    guests: Number(reservation.guests ?? 0),
    shift,
    shiftHours,
    roomPrice: Number(pricing.room ?? 0),
    cleaning: Number(pricing.cleaning ?? 0),
    attendanceSurcharge: Number(pricing.attendanceSurcharge ?? 0),
    services: rawServices.map((service) => ({
      name: String(service.name ?? service.id ?? 'Servicio'),
      price: Number(service.price ?? 0),
    })),
    amountPaid: Number(reservation.amountPaid ?? 0),
    paymentStatus: Number(reservation.amountPaid ?? 0) >= Number(pricing.total ?? 0)
      ? 'Pagado'
      : Number(reservation.amountPaid ?? 0) > 0
        ? 'Parcial'
        : 'Pendiente',
    reservationStatus: mapStoredReservationStatus(reservation.status),
    customerNotes: String(reservation.customerNotes ?? ''),
    internalNotes: String(reservation.internalNotes ?? ''),
  }
}

function getStoredReservationById(
  id: string,
): StoredReservation | undefined {
  return getReservations().find(
    (reservation) => reservation.id === id,
  )
}

function statusToStoredStatus(status: ReservationStatus): StoredReservation['status'] {
  switch (status) {
    case 'confirmed':
      return 'Confirmada'
    case 'cancelled':
      return 'Cancelada'
    case 'finished':
      return 'Completada'
    case 'pending':
    default:
      return 'Pendiente'
  }
}


function PaymentDialog({
  reservationId,
  pending,
  onClose,
  onSaved,
}: {
  reservationId: string
  pending: number
  onClose: () => void
  onSaved: () => void
}) {
  const [amount, setAmount] =
    useState(pending.toFixed(2))

  const [method, setMethod] =
    useState<PaymentMethod>(
      'Transferencia',
    )

  const [date, setDate] =
    useState(() => {
      const now = new Date()

      return `${now.getFullYear()}-${String(
        now.getMonth() + 1,
      ).padStart(2, '0')}-${String(
        now.getDate(),
      ).padStart(2, '0')}`
    })

  const [notes, setNotes] =
    useState('')

  const numericAmount =
    Number(
      amount.replace(',', '.'),
    )

  const handleSubmit = () => {
    if (
      !Number.isFinite(
        numericAmount,
      ) ||
      numericAmount <= 0 ||
      pending <= 0
    ) {
      return
    }

    try {
      registerPayment({
        reservationId,
        amount: Math.min(
          numericAmount,
          pending,
        ),
        method,
        type: 'Reserva',
        paymentDate: date,
        notes:
          notes.trim() || undefined,
      })

      onSaved()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'No se ha podido registrar el pago.',
      )
    }
  }

  return (
    <div
      className="payment-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="payment-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-dialog-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="payment-modal-header">
          <div>
            <p className="eyebrow">
              REGISTRAR PAGO
            </p>

            <h2 id="payment-dialog-title">
              Nuevo pago
            </h2>
          </div>

          <button
            className="payment-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="payment-modal-pending">
          <span>
            Importe pendiente
          </span>

          <strong>
            {formatCurrency(pending)}
          </strong>
        </div>

        <div className="payment-form">
          <label>
            <span>Importe</span>

            <input
              type="number"
              min="0.01"
              step="0.01"
              max={pending}
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>
              Método de pago
            </span>

            <select
              value={method}
              onChange={(event) =>
                setMethod(
                  event.target
                    .value as PaymentMethod,
                )
              }
            >
              <option value="Efectivo">
                Efectivo
              </option>

              <option value="Tarjeta">
                Tarjeta
              </option>

              <option value="Transferencia">
                Transferencia
              </option>

              <option value="Bizum">
                Bizum
              </option>
            </select>
          </label>

          <label>
            <span>
              Fecha del pago
            </span>

            <input
              type="date"
              value={date}
              onChange={(event) =>
                setDate(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            <span>Notas</span>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value,
                )
              }
              rows={3}
              placeholder="Observaciones del pago..."
            />
          </label>
        </div>

        <div className="payment-modal-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="primary-button"
            type="button"
            disabled={
              !Number.isFinite(
                numericAmount,
              ) ||
              numericAmount <= 0 ||
              pending <= 0
            }
            onClick={handleSubmit}
          >
            Registrar pago
          </button>
        </div>
      </div>
    </div>
  )
}


function EditReservationForm({
  reservation,
  storedReservation,
  onCancel,
  onSaved,
}: {
  reservation: ReservationDetailData
  storedReservation: StoredReservation
  onCancel: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(reservation.client.name)
  const [dni, setDni] = useState(reservation.client.dni)
  const [phone, setPhone] = useState(reservation.client.phone)
  const [email, setEmail] = useState(reservation.client.email)
  const [address, setAddress] = useState(reservation.client.address)
  const [date, setDate] = useState(reservation.date)
  const [partyType, setPartyType] = useState<PartyType>(reservation.partyType)
  const [guests, setGuests] = useState(String(reservation.guests))
  const [shifts, setShifts] = useState<string[]>(
    Array.isArray(storedReservation.shifts)
      ? storedReservation.shifts
      : [],
  )
  const [customerNotes, setCustomerNotes] = useState(reservation.customerNotes)
  const [internalNotes, setInternalNotes] = useState(reservation.internalNotes)
  const [services, setServices] = useState<Service[]>(getServices())
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
    const available = getServices()
    return reservation.services.map((storedService) =>
      available.find((service) => service.name === storedService.name)?.id ??
      (storedService as { id?: string }).id ??
      storedService.name,
    )
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const refreshServices = () => {
      setServices(getServices())
    }

    refreshServices()
    return subscribeToServices(refreshServices)
  }, [])

  const allServiceOptions = useMemo(() => {
    const existing = reservation.services.map((service) => ({
      id: (service as { id?: string }).id ?? service.name,
      name: service.name,
      price: service.price,
      active: true,
    }))

    const byId = new Map<string, Service | { id: string; name: string; price: number; active: boolean }>()
    services.forEach((service) => byId.set(service.id, service))
    existing.forEach((service) => {
      const alreadyExists = Array.from(byId.values()).some(
        (candidate) => candidate.name === service.name,
      )
      if (!alreadyExists && !byId.has(service.id)) {
        byId.set(service.id, service)
      }
    })

    return Array.from(byId.values())
  }, [services, reservation.services])

  const selectedServices = useMemo(
    () =>
      allServiceOptions
        .filter((service) => selectedServiceIds.includes(service.id))
        .map((service) => {
          const historicalService = reservation.services.find(
            (storedService) =>
              storedService.name === service.name ||
              (storedService as { id?: string }).id === service.id,
          )

          return historicalService
            ? {
                ...service,
                price: historicalService.price,
              }
            : service
        }),
    [allServiceOptions, selectedServiceIds, reservation.services],
  )

  const oldServicesTotal = reservation.services.reduce(
    (sum, service) => sum + service.price,
    0,
  )

  const newServicesTotal = selectedServices.reduce(
    (sum, service) => sum + Number(service.price ?? 0),
    0,
  )

  // Sala, limpieza, aforo y cualquier precio histórico fuera de services
  // permanecen congelados. Solo cambia el total por los servicios elegidos.
  const editedTotal =
    Number(storedReservation.pricing?.total ?? 0) -
    oldServicesTotal +
    newServicesTotal

  const toggleShift = (shift: string) => {
    setShifts((current) =>
      current.includes(shift)
        ? current.filter((item) => item !== shift)
        : [...current, shift],
    )
  }

  const toggleService = (service: Service | { id: string; name: string; price: number; active: boolean }) => {
    setSelectedServiceIds((current) =>
      current.includes(service.id)
        ? current.filter((id) => id !== service.id)
        : [...current, service.id],
    )
  }

  const handleSave = () => {
    if (!date || !name.trim()) {
      window.alert('El nombre del cliente y la fecha son obligatorios.')
      return
    }

    if (shifts.length === 0) {
      window.alert('Debes seleccionar al menos un turno.')
      return
    }

    const numericGuests = Number(guests)
    if (!Number.isFinite(numericGuests) || numericGuests < 1) {
      window.alert('El número de asistentes no es válido.')
      return
    }

    setSaving(true)

    try {
      const storedServices = selectedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
      }))

      updateReservation({
        ...storedReservation,
        date,
        client: {
          ...storedReservation.client,
          name: name.trim(),
          dni: dni.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
        },
        partyType,
        guests: numericGuests,
        shifts: [...shifts] as StoredReservation['shifts'],
        pricing: {
          ...storedReservation.pricing,
          services: storedServices,
          total: editedTotal,
        },
        customerNotes: customerNotes.trim(),
        internalNotes: internalNotes.trim(),
      })

      onSaved()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'No se ha podido guardar la modificación.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="detail-card" style={{ marginBottom: 20 }}>
      <div className="detail-card-heading">
        <div>
          <p className="eyebrow">EDITAR RESERVA</p>
          <h2>Modificar datos</h2>
          <p>Los precios históricos se mantienen. Solo los servicios pueden modificar el total.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 24 }}>
        <div>
          <h3>Datos del cliente</h3>
          <div className="detail-info-grid" style={{ marginTop: 12 }}>
            {(
              [
                ['Nombre y apellidos', name, setName, 'text'],
                ['DNI / NIF', dni, setDni, 'text'],
                ['Teléfono', phone, setPhone, 'tel'],
                ['Correo electrónico', email, setEmail, 'email'],
                ['Dirección', address, setAddress, 'text'],
              ] as Array<
                [
                  string,
                  string,
                  (value: string) => void,
                  string,
                ]
              >
            ).map(([label, value, setter, type]) => (
              <label key={label} className="info-item">
                <span>{label}</span>
                <input
                  type={type}
                  value={value}
                  onChange={(event) =>
                    setter(event.target.value)
                  }
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3>Datos de la fiesta</h3>
          <div className="detail-info-grid" style={{ marginTop: 12 }}>
            <label className="info-item">
              <span>Fecha del evento</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>

            <label className="info-item">
              <span>Tipo de fiesta</span>
              <select value={partyType} onChange={(event) => setPartyType(event.target.value as PartyType)}>
                {Object.entries(partyTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="info-item">
              <span>Asistentes</span>
              <input type="number" min="1" value={guests} onChange={(event) => setGuests(event.target.value)} />
            </label>
          </div>
        </div>

        <div>
          <h3>Turnos</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {[
              ['turno-1', 'Turno 1 · 10:00 - 13:00'],
              ['turno-2', 'Turno 2 · 15:00 - 20:00'],
              ['turno-3', 'Turno 3 · 21:00 - 03:00'],
            ].map(([value, label]) => (
              <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 12px', border: '1px solid #dfe5e7', borderRadius: 10 }}>
                <input type="checkbox" checked={shifts.includes(value)} onChange={() => toggleShift(value)} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3>Servicios</h3>
          <p style={{ margin: '5px 0 12px', color: '#71858a', fontSize: 13 }}>
            Añadir o quitar un servicio sí modifica el total. La sala y la limpieza no se recalculan.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {allServiceOptions.map((service) => {
              const selected = selectedServiceIds.includes(service.id)
              const active = service.active !== false

              return (
                <button
                  key={service.id}
                  type="button"
                  disabled={!active && !selected}
                  onClick={() => toggleService(service)}
                  style={{
                    textAlign: 'left',
                    padding: 13,
                    borderRadius: 10,
                    border: `1px solid ${selected ? '#2f626a' : '#dfe5e7'}`,
                    background: selected ? '#edf5f5' : '#fff',
                    opacity: active || selected ? 1 : 0.48,
                    cursor: active || selected ? 'pointer' : 'not-allowed',
                  }}
                >
                  <strong>{service.name}</strong>
                  <span style={{ display: 'block', marginTop: 4, color: '#71858a', fontSize: 12 }}>
                    {Number(service.price).toFixed(2)} €
                    {!active ? ' · Servicio desactivado' : ''}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="notes-grid">
          <label className="note-box">
            <span>Observaciones del cliente</span>
            <textarea rows={4} value={customerNotes} onChange={(event) => setCustomerNotes(event.target.value)} />
          </label>

          <label className="note-box internal">
            <span>Observaciones internas</span>
            <textarea rows={4} value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} />
          </label>
        </div>

        <div className="price-total">
          <span>Nuevo total</span>
          <strong>{formatCurrency(editedTotal)}</strong>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="secondary-button" type="button" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button className="primary-button" type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </section>
  )
}

function ReservationManagementDialog({
  mode,
  reservationId,
  onClose,
  onCompleted,
}: {
  mode: 'cancel' | 'delete'
  reservationId: string
  onClose: () => void
  onCompleted: () => void
}) {
  const [notes, setNotes] = useState('')
  const [person, setPerson] = useState('')
  const [saving, setSaving] = useState(false)

  const isCancel = mode === 'cancel'

  const handleSubmit = () => {
    const cleanNotes = notes.trim()
    const cleanPerson = person.trim()

    if (!cleanNotes) {
      window.alert(
        isCancel
          ? 'Debes indicar el motivo de la cancelación.'
          : 'Debes indicar el motivo de la eliminación.',
      )
      return
    }

    if (!cleanPerson) {
      window.alert(
        isCancel
          ? 'Debes indicar quién cancela la reserva.'
          : 'Debes indicar quién elimina la reserva.',
      )
      return
    }

    setSaving(true)

    try {
      if (isCancel) {
        cancelReservation(
          reservationId,
          cleanNotes,
          cleanPerson,
        )
      } else {
        deleteReservation(
          reservationId,
          cleanNotes,
          cleanPerson,
        )
      }

      onCompleted()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : isCancel
            ? 'No se ha podido cancelar la reserva.'
            : 'No se ha podido eliminar la reserva.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="reservation-management-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="reservation-management-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-management-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="reservation-management-modal-header">
          <div>
            <p className="eyebrow">
              {isCancel
                ? 'CANCELAR RESERVA'
                : 'ELIMINAR RESERVA'}
            </p>

            <h2 id="reservation-management-title">
              {isCancel
                ? 'Cancelar reserva'
                : 'Eliminar reserva'}
            </h2>
          </div>

          <button
            className="payment-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className="reservation-management-warning">
          <strong>
            {isCancel
              ? 'La reserva pasará a estado Cancelada.'
              : 'La reserva dejará de aparecer en la aplicación.'}
          </strong>

          <span>
            {isCancel
              ? 'La cancelación se guardará con el motivo, la persona responsable y la fecha y hora.'
              : 'El registro histórico se conservará, pero dejará de aparecer en Reservas, Calendario, disponibilidad y Panel.'}
          </span>
        </div>

        <div className="payment-form">
          <label>
            <span>
              {isCancel
                ? 'Motivo / observación de la cancelación *'
                : 'Motivo / observación de la eliminación *'}
            </span>

            <textarea
              rows={4}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder={
                isCancel
                  ? 'Explica por qué se cancela la reserva...'
                  : 'Explica por qué se elimina la reserva...'
              }
              disabled={saving}
            />
          </label>

          <label>
            <span>
              {isCancel
                ? 'Nombre de quien cancela *'
                : 'Nombre de quien elimina *'}
            </span>

            <input
              type="text"
              value={person}
              onChange={(event) =>
                setPerson(event.target.value)
              }
              placeholder="Nombre y apellidos"
              disabled={saving}
            />
          </label>
        </div>

        <div className="payment-modal-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Volver
          </button>

          <button
            className={
              isCancel
                ? 'reservation-cancel-button'
                : 'reservation-delete-button'
            }
            type="button"
            onClick={handleSubmit}
            disabled={
              saving ||
              !notes.trim() ||
              !person.trim()
            }
          >
            {saving
              ? 'Guardando...'
              : isCancel
                ? 'Confirmar cancelación'
                : 'Eliminar reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}


function ReservationDepositDialog({
  reservation,
  onClose,
  onCompleted,
}: {
  reservation: StoredReservation
  onClose: () => void
  onCompleted: () => void
}) {
  const [notes, setNotes] = useState('')
  const [person, setPerson] = useState('')
  const [saving, setSaving] = useState(false)

  /*
   * La parte que se devuelve al cliente es siempre
   * 100 €. El importe total de la fianza cobrada
   * se calcula aparte como 100 € + precio de la sala.
   */
  const refundableDepositAmount = 100

  const handleSubmit = () => {
    const cleanNotes = notes.trim()
    const cleanPerson = person.trim()

    if (!cleanNotes) {
      window.alert(
        'Debes indicar una observación para devolver la fianza.',
      )
      return
    }

    if (!cleanPerson) {
      window.alert(
        'Debes indicar quién ha devuelto la fianza.',
      )
      return
    }

    setSaving(true)

    try {
      returnReservationDeposit(
        reservation.id,
        cleanNotes,
        cleanPerson,
      )

      onCompleted()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'No se ha podido registrar la devolución de la fianza.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="reservation-deposit-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        className="reservation-deposit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-deposit-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="reservation-deposit-modal-header">
          <div>
            <p className="eyebrow">
              DEVOLUCIÓN DE FIANZA
            </p>

            <h2 id="reservation-deposit-title">
              Marcar fianza como devuelta
            </h2>
          </div>

          <button
            className="payment-modal-close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={saving}
          >
            ×
          </button>
        </div>

        <div className="reservation-deposit-warning">
          <strong>
            Se registrará la devolución de{' '}
            {formatCurrency(refundableDepositAmount)}.
          </strong>

          <span>
            La devolución quedará guardada con la
            fecha, la persona responsable y la
            observación indicada.
          </span>
        </div>

        <div className="payment-form">
          <label>
            <span>
              Observación de la devolución *
            </span>

            <textarea
              rows={4}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              placeholder="Indica cómo o por qué se devuelve la fianza..."
              disabled={saving}
            />
          </label>

          <label>
            <span>
              Nombre de quien devuelve la fianza *
            </span>

            <input
              type="text"
              value={person}
              onChange={(event) =>
                setPerson(event.target.value)
              }
              placeholder="Nombre y apellidos"
              disabled={saving}
            />
          </label>
        </div>

        <div className="payment-modal-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Volver
          </button>

          <button
            className="reservation-deposit-return-button"
            type="button"
            onClick={handleSubmit}
            disabled={
              saving ||
              !notes.trim() ||
              !person.trim()
            }
          >
            {saving
              ? 'Guardando...'
              : 'Confirmar devolución'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReservationDetail() {
  const { id } =
    useParams<{ id: string }>()

  const [paymentDialogOpen, setPaymentDialogOpen] =
    useState(false)

  const [depositDialogOpen, setDepositDialogOpen] =
    useState(false)

  const [editMode, setEditMode] = useState(false)

  const [reservationManagementMode, setReservationManagementMode] =
    useState<'cancel' | 'delete' | null>(null)

  const [reservationRefresh, setReservationRefresh] =
    useState(0)

  const [paymentRefresh, setPaymentRefresh] =
    useState(0)

  useEffect(() => {
    return subscribeToReservations(() => {
      setReservationRefresh((value) => value + 1)
    })
  }, [])

  void reservationRefresh
  void paymentRefresh

  const storedReservation = getStoredReservationById(id ?? '')
  const reservation = storedReservation
    ? mapStoredReservationToDetail(storedReservation)
    : mockReservations.find((item) => item.id === id)

  if (!reservation) {
    return (
      <div className="reservation-not-found">
        <h1>Reserva no encontrada</h1>

        <p>
          No hemos encontrado la reserva solicitada.
        </p>

        <Link
          to="/reservas"
          className="primary-button"
        >
          Volver a reservas
        </Link>
      </div>
    )
  }

  const servicesTotal = reservation.services.reduce(
    (total, service) => total + service.price,
    0,
  )

  const total =
    storedReservation?.pricing?.total ??
    (reservation.roomPrice +
      reservation.cleaning +
      reservation.attendanceSurcharge +
      servicesTotal)

  const pending = Math.max(
    total - reservation.amountPaid,
    0,
  )

  const storedDeposit = storedReservation
    ? getReservationDeposit(storedReservation)
    : {
        amount: 0,
        returned: false,
      }

  /*
   * Regla de negocio de la fianza:
   * fianza = 100 € + precio de la sala.
   *
   * Si una reserva antigua ya tiene una fianza
   * guardada, respetamos ese registro.
   */
  const deposit = {
    ...storedDeposit,
    amount:
      Number(storedDeposit.amount) > 0
        ? Number(storedDeposit.amount)
        : Number(reservation.roomPrice) + 100,
  }

  return (
    <div className="reservation-detail-page">
      <section className="detail-heading">
        <div>
          <Link
            to="/reservas"
            className="back-link"
          >
            <ArrowLeft size={17} />
            Volver a reservas
          </Link>

          <div className="detail-title-row">
            <div>
              <p className="eyebrow">
                RESERVA {reservation.id}
              </p>

              <h1>
                {reservation.client.name}
              </h1>

              <p className="page-description">
                {
                  partyTypeLabels[
                    reservation.partyType
                  ]
                }
              </p>
            </div>

            <div className="reservation-status-control">
              <span
                className={`reservation-status ${reservation.reservationStatus}`}
              >
                <span />

                {
                  reservationStatusLabels[
                    reservation.reservationStatus
                  ]
                }
              </span>

              {storedReservation && (
                <label className="reservation-status-select">
                  <span>Cambiar estado</span>
                  <select
                    value={reservation.reservationStatus}
                    onChange={(event) => {
                      const nextStatus = event.target.value as ReservationStatus
                      try {
                        updateReservation({
                          ...storedReservation,
                          status: statusToStoredStatus(nextStatus),
                        })
                        setReservationRefresh((value) => value + 1)
                      } catch (error) {
                        window.alert(
                          error instanceof Error
                            ? error.message
                            : 'No se ha podido actualizar el estado de la reserva.',
                        )
                      }
                    }}
                  >
                    {Object.entries(reservationStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="detail-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setEditMode(true)}
          >
            <Pencil size={17} />
            Modificar
          </button>

          <Link
            to="/reservas"
            className="new-reservation-button"
          >
            <ArrowLeft size={17} />
            Reservas
          </Link>
        </div>
      </section>

      {editMode && storedReservation && (
        <EditReservationForm
          reservation={reservation}
          storedReservation={storedReservation}
          onCancel={() => setEditMode(false)}
          onSaved={() => {
            setEditMode(false)
            setReservationRefresh((value) => value + 1)
          }}
        />
      )}

      <div className="detail-grid">
        <div className="detail-main">
          <section className="detail-card">
            <div className="detail-card-heading">
              <div className="detail-section-icon">
                <CalendarDays size={20} />
              </div>

              <div>
                <h2>Datos de la fiesta</h2>

                <p>
                  Información del evento
                </p>
              </div>
            </div>

            <div className="detail-info-grid">
              <InfoItem
                label="Fecha del evento"
                value={formatDate(reservation.date)}
              />

              <InfoItem
                label="Tipo de fiesta"
                value={
                  partyTypeLabels[
                    reservation.partyType
                  ]
                }
              />

              <InfoItem
                label="Asistentes"
                value={`${reservation.guests} personas`}
              />

              <InfoItem
                label="Turno"
                value={`${reservation.shift} · ${reservation.shiftHours}`}
              />
            </div>
          </section>

          <section className="detail-card">
            <div className="detail-card-heading">
              <div className="detail-section-icon">
                <Users size={20} />
              </div>

              <div>
                <h2>Datos del cliente</h2>

                <p>
                  Información de contacto
                </p>
              </div>
            </div>

            <div className="client-detail-grid">
              <InfoItem
                label="Nombre y apellidos"
                value={reservation.client.name}
              />

              <InfoItem
                label="DNI / NIF"
                value={reservation.client.dni}
              />

              <InfoItem
                label="Teléfono"
                value={reservation.client.phone}
                icon={<Phone size={15} />}
              />

              <InfoItem
                label="Correo electrónico"
                value={reservation.client.email}
                icon={<Mail size={15} />}
              />

              <InfoItem
                label="Dirección"
                value={reservation.client.address}
                icon={<MapPin size={15} />}
              />
            </div>
          </section>

          <section className="detail-card">
            <div className="detail-card-heading">
              <div className="detail-section-icon">
                <FileText size={20} />
              </div>

              <div>
                <h2>Observaciones</h2>

                <p>
                  Información de la reserva
                </p>
              </div>
            </div>

            <div className="notes-grid">
              <div className="note-box">
                <span>
                  Observaciones del cliente
                </span>

                <p>
                  {reservation.customerNotes ||
                    'Sin observaciones'}
                </p>
              </div>

              <div className="note-box internal">
                <span>
                  Observaciones internas
                </span>

                <p>
                  {reservation.internalNotes ||
                    'Sin observaciones internas'}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="detail-sidebar">
          <section className="detail-card price-card">
            <div className="detail-card-heading">
              <div className="detail-section-icon">
                <Euro size={20} />
              </div>

              <div>
                <h2>Presupuesto</h2>

                <p>
                  Desglose de la reserva
                </p>
              </div>
            </div>

            <div className="price-breakdown">
              <PriceRow
                label="Sala"
                value={reservation.roomPrice}
              />

              <PriceRow
                label="Limpieza"
                value={reservation.cleaning}
              />

              {reservation.attendanceSurcharge >
                0 && (
                <PriceRow
                  label="Suplemento de aforo"
                  value={
                    reservation.attendanceSurcharge
                  }
                />
              )}

              {reservation.services.map(
                (service) => (
                  <PriceRow
                    key={service.name}
                    label={service.name}
                    value={service.price}
                  />
                ),
              )}

              <div className="price-total">
                <span>Total</span>

                <strong>
                  {formatCurrency(total)}
                </strong>
              </div>
            </div>
          </section>

          <section className="detail-card payment-card">
            <div className="detail-card-heading">
              <div className="detail-section-icon">
                <CreditCard size={20} />
              </div>

              <div>
                <h2>Pagos</h2>

                <p>
                  Estado económico
                </p>
              </div>
            </div>

            <div className="payment-summary">
              <div>
                <span>Importe total</span>

                <strong>
                  {formatCurrency(total)}
                </strong>
              </div>

              <div>
                <span>Importe pagado</span>

                <strong className="paid">
                  {formatCurrency(
                    reservation.amountPaid,
                  )}
                </strong>
              </div>

              <div>
                <span>Importe pendiente</span>

                <strong className="pending">
                  {formatCurrency(pending)}
                </strong>
              </div>
            </div>

            <div className="payment-status-box">
              <span>
                Estado del pago
              </span>

              <strong>
                {reservation.paymentStatus}
              </strong>
            </div>

            {pending > 0 ? (
              <button
                className="primary-button payment-button"
                type="button"
                onClick={() =>
                  setPaymentDialogOpen(true)
                }
              >
                Registrar pago
              </button>
            ) : (
              <button
                className="primary-button payment-button"
                type="button"
                disabled
              >
                Reserva pagada
              </button>
            )}

            {paymentDialogOpen && (
              <PaymentDialog
                reservationId={reservation.id}
                pending={pending}
                onClose={() =>
                  setPaymentDialogOpen(false)
                }
                onSaved={() => {
                  setPaymentDialogOpen(false)
                  setPaymentRefresh(
                    (value) => value + 1,
                  )
                }}
              />
            )}
          </section>

          {storedReservation && (
            <section className="detail-card reservation-deposit-card">
              <div className="detail-card-heading">
                <div className="detail-section-icon reservation-deposit-icon">
                  <Euro size={20} />
                </div>

                <div>
                  <h2>Fianza</h2>

                  <p>
                    Depósito de seguridad de la reserva
                  </p>
                </div>
              </div>

              <div className="reservation-deposit-summary">
                <div>
                  <span>Importe de la fianza</span>

                  <strong>
                    {formatCurrency(deposit.amount)}
                  </strong>
                </div>

                <div>
                  <span>Estado</span>

                  <strong
                    className={
                      deposit.returned
                        ? 'reservation-deposit-returned'
                        : 'reservation-deposit-pending'
                    }
                  >
                    {deposit.returned
                      ? 'Devuelta'
                      : 'Pendiente de devolución'}
                  </strong>
                </div>
              </div>

              <div className="reservation-deposit-refund-row">
                <span>Importe a devolver</span>
                <strong>
                  {formatCurrency(100)}
                </strong>
              </div>

              {deposit.returned ? (
                <div className="reservation-deposit-returned-summary">
                  <strong>
                    Fianza devuelta
                  </strong>

                  {deposit.returnedBy && (
                    <span>
                      Devuelta por:{' '}
                      {deposit.returnedBy}
                    </span>
                  )}

                  {deposit.notes && (
                    <span>
                      Observación:{' '}
                      {deposit.notes}
                    </span>
                  )}

                  {deposit.returnedAt && (
                    <span>
                      {formatDateTime(
                        deposit.returnedAt,
                      )}
                    </span>
                  )}
                </div>
              ) : deposit.amount > 0 ? (
                <>
                  <p className="reservation-deposit-description">
                    La parte que se devuelve al cliente es de
                    100 €. Regístrala aquí para que quede constancia
                    de quién la ha devuelto y cuándo.
                  </p>

                  <button
                    className="reservation-deposit-return-button"
                    type="button"
                    onClick={() =>
                      setDepositDialogOpen(true)
                    }
                  >
                    Marcar fianza como devuelta
                  </button>
                </>
              ) : (
                <div className="reservation-deposit-empty">
                  No hay ninguna fianza registrada en esta reserva.
                </div>
              )}

              {depositDialogOpen && (
                <ReservationDepositDialog
                  reservation={storedReservation}
                  onClose={() =>
                    setDepositDialogOpen(false)
                  }
                  onCompleted={() => {
                    setDepositDialogOpen(false)
                    setReservationRefresh(
                      (value) => value + 1,
                    )
                  }}
                />
              )}
            </section>
          )}

          {storedReservation && (
            <section className="detail-card reservation-management-card">
              <div className="detail-card-heading">
                <div className="detail-section-icon reservation-management-icon">
                  <FileText size={20} />
                </div>

                <div>
                  <h2>Gestión de la reserva</h2>

                  <p>
                    Cancelación y eliminación
                  </p>
                </div>
              </div>

              {storedReservation.status !== 'Cancelada' &&
              storedReservation.status !== 'Completada' ? (
                <>
                  <p className="reservation-management-description">
                    Si hay una equivocación, primero debes cancelar la reserva
                    indicando el motivo y quién la cancela. Después podrás
                    eliminarla del funcionamiento normal de la aplicación.
                  </p>

                  <button
                    className="reservation-cancel-button"
                    type="button"
                    onClick={() =>
                      setReservationManagementMode('cancel')
                    }
                  >
                    Cancelar reserva
                  </button>
                </>
              ) : storedReservation.status === 'Cancelada' &&
                !storedReservation.deletion ? (
                <>
                  <div className="reservation-cancelled-summary">
                    <strong>Reserva cancelada</strong>

                    {storedReservation.cancellation && (
                      <>
                        <span>
                          Cancelada por:{' '}
                          {storedReservation.cancellation.cancelledBy}
                        </span>

                        <span>
                          Motivo:{' '}
                          {storedReservation.cancellation.notes}
                        </span>

                        <span>
                          {formatDateTime(
                            storedReservation.cancellation.cancelledAt,
                          )}
                        </span>
                      </>
                    )}
                  </div>

                  <p className="reservation-management-description">
                    La eliminación requiere una segunda confirmación,
                    indicando el motivo y quién realiza la eliminación.
                  </p>

                  <button
                    className="reservation-delete-button"
                    type="button"
                    onClick={() =>
                      setReservationManagementMode('delete')
                    }
                  >
                    Eliminar reserva
                  </button>
                </>
              ) : storedReservation.deletion ? (
                <div className="reservation-deleted-summary">
                  <strong>Reserva eliminada</strong>

                  <span>
                    Eliminada por:{' '}
                    {storedReservation.deletion.deletedBy}
                  </span>

                  <span>
                    Motivo:{' '}
                    {storedReservation.deletion.notes}
                  </span>

                  <span>
                    {formatDateTime(
                      storedReservation.deletion.deletedAt,
                    )}
                  </span>
                </div>
              ) : (
                <p className="reservation-management-description">
                  Una reserva completada no puede cancelarse ni eliminarse.
                </p>
              )}
            </section>
          )}

          {reservationManagementMode && storedReservation && (
            <ReservationManagementDialog
              mode={reservationManagementMode}
              reservationId={storedReservation.id}
              onClose={() =>
                setReservationManagementMode(null)
              }
              onCompleted={() => {
                setReservationManagementMode(null)
                setReservationRefresh((value) => value + 1)

                if (
                  reservationManagementMode === 'delete'
                ) {
                  window.location.href = '/reservas'
                }
              }}
            />
          )}
        </aside>
      </div>
    </div>
  )
}

type InfoItemProps = {
  label: string
  value: string
  icon?: ReactNode
}

function InfoItem({
  label,
  value,
  icon,
}: InfoItemProps) {
  return (
    <div className="info-item">
      <span>{label}</span>

      <strong>
        {icon}
        {value}
      </strong>
    </div>
  )
}

type PriceRowProps = {
  label: string
  value: number
}

function PriceRow({
  label,
  value,
}: PriceRowProps) {
  return (
    <div className="price-row">
      <span>{label}</span>

      <strong>
        {formatCurrency(value)}
      </strong>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export default ReservationDetail