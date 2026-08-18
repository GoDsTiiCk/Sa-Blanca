import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronRight,
  Filter,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './Reservations.css'

import {
  getReservations,
  subscribeToReservations,
  type Reservation as StoredReservation,
} from '../data/reservationStore'

type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'finished'

type PartyType =
  | 'child-birthday'
  | 'adult-birthday'
  | 'communion'
  | 'baptism'
  | 'anniversary'
  | 'private-party'
  | 'corporate-event'
  | 'other'

type ReservationPreview = {
  id: string
  date: string
  client: string
  partyType: PartyType
  guests: number
  shift: string
  total: number
  status: ReservationStatus
}

function mapStoredReservation(
  reservation: StoredReservation,
): ReservationPreview {
  const partyType = reservation.partyType as PartyType
  const validPartyType: PartyType =
    partyTypeLabels[partyType] !== undefined
      ? partyType
      : 'other'

  const statusMap: Record<StoredReservation['status'], ReservationStatus> = {
    Pendiente: 'pending',
    Confirmada: 'confirmed',
    Cancelada: 'cancelled',
    Completada: 'finished',
  }

  return {
    id: reservation.id,
    date: reservation.date,
    client: reservation.client.name,
    partyType: validPartyType,
    guests: reservation.guests,
    shift: reservation.shift,
    total: reservation.pricing.total,
    status: statusMap[reservation.status] ?? 'pending',
  }
}

function getAllReservations(): ReservationPreview[] {
  return getReservations().map(mapStoredReservation)
}


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

const statusLabels: Record<
  ReservationStatus,
  string
> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  finished: 'Finalizada',
}

function Reservations() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] =
    useState<ReservationStatus | 'all'>('all')

  const [partyTypeFilter, setPartyTypeFilter] =
    useState<PartyType | 'all'>('all')

  const [storedVersion, setStoredVersion] = useState(0)

  useEffect(() => {
    return subscribeToReservations(() => setStoredVersion((value) => value + 1))
  }, [])

  const reservations = useMemo(
    () => getAllReservations(),
    [storedVersion],
  )

  const filteredReservations = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim()

    return reservations.filter((reservation) => {
      const matchesSearch =
        !searchValue ||
        reservation.client
          .toLowerCase()
          .includes(searchValue) ||
        reservation.id
          .toLowerCase()
          .includes(searchValue)

      const matchesStatus =
        statusFilter === 'all' ||
        reservation.status === statusFilter

      const matchesPartyType =
        partyTypeFilter === 'all' ||
        reservation.partyType ===
          partyTypeFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPartyType
      )
    })
  }, [
    search,
    statusFilter,
    partyTypeFilter,
  ])

  const hasFilters =
    search !== '' ||
    statusFilter !== 'all' ||
    partyTypeFilter !== 'all'

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setPartyTypeFilter('all')
  }

  return (
    <div className="reservations-page">
      <section className="page-heading reservations-heading">
        <div>
          <p className="eyebrow">
            GESTIÓN DE RESERVAS
          </p>

          <h1>Reservas</h1>

          <p className="page-description">
            Consulta y gestiona las reservas de
            Sa Blanca
          </p>
        </div>

        <Link
          to="/reservas/nueva"
          className="new-reservation-button"
        >
          <Plus size={18} />
          <span>Nueva reserva</span>
        </Link>
      </section>

      <section className="reservation-filters">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar por cliente o número de reserva..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="filter-select">
          <Filter size={17} />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | ReservationStatus
                  | 'all',
              )
            }
          >
            <option value="all">
              Todos los estados
            </option>

            <option value="pending">
              Pendientes
            </option>

            <option value="confirmed">
              Confirmadas
            </option>

            <option value="cancelled">
              Canceladas
            </option>

            <option value="finished">
              Finalizadas
            </option>
          </select>
        </div>

        <div className="filter-select">
          <CalendarDays size={17} />

          <select
            value={partyTypeFilter}
            onChange={(event) =>
              setPartyTypeFilter(
                event.target.value as
                  | PartyType
                  | 'all',
              )
            }
          >
            <option value="all">
              Todos los tipos
            </option>

            {Object.entries(
              partyTypeLabels,
            ).map(([value, label]) => (
              <option
                key={value}
                value={value}
              >
                {label}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            className="clear-filters"
            onClick={clearFilters}
            type="button"
          >
            Limpiar filtros
          </button>
        )}
      </section>

      <section className="reservations-summary">
        <span>
          <strong>
            {filteredReservations.length}
          </strong>{' '}
          {filteredReservations.length === 1
            ? 'reserva'
            : 'reservas'}
        </span>
      </section>

      <section className="reservations-card">
        <div className="desktop-table">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Fiesta</th>
                <th>Asistentes</th>
                <th>Turno</th>
                <th>Importe</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {filteredReservations.map(
                (reservation) => (
                  <tr key={reservation.id}>
                    <td>
                      <div className="date-cell">
                        <strong>
                          {formatDate(
                            reservation.date,
                          )}
                        </strong>

                        <span>
                          {reservation.id}
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong>
                        {reservation.client}
                      </strong>
                    </td>

                    <td>
                      {
                        partyTypeLabels[
                          reservation.partyType
                        ]
                      }
                    </td>

                    <td>
                      <div className="guests-cell">
                        <Users size={16} />
                        {reservation.guests}
                      </div>
                    </td>

                    <td>
                      {reservation.shift}
                    </td>

                    <td>
                      <strong>
                        {formatCurrency(
                          reservation.total,
                        )}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`reservation-status ${reservation.status}`}
                      >
                        <span />

                        {
                          statusLabels[
                            reservation.status
                          ]
                        }
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <Link
                          to={`/calendario?date=${reservation.date}&view=month`}
                          className="reservation-action"
                          aria-label={`Ver ${reservation.client} en el calendario`}
                          title="Ver en calendario"
                        >
                          <CalendarDays size={17} />
                        </Link>
                        <Link
                          to={`/reservas/${reservation.id}`}
                          className="reservation-action"
                          aria-label={`Ver ${reservation.client}`}
                          title="Ver reserva"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        <div className="mobile-reservations">
          {filteredReservations.map(
            (reservation) => (
              <Link
                key={reservation.id}
                to={`/reservas/${reservation.id}`}
                className="reservation-mobile-card"
              >
                <div className="mobile-card-top">
                  <div>
                    <span className="mobile-date">
                      {formatDate(
                        reservation.date,
                      )}
                    </span>

                    <h3>
                      {reservation.client}
                    </h3>
                  </div>

                  <span
                    className={`reservation-status ${reservation.status}`}
                  >
                    <span />

                    {
                      statusLabels[
                        reservation.status
                      ]
                    }
                  </span>
                </div>

                <div className="mobile-card-info">
                  <div>
                    <span>Fiesta</span>

                    <strong>
                      {
                        partyTypeLabels[
                          reservation.partyType
                        ]
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Turno</span>

                    <strong>
                      {reservation.shift}
                    </strong>
                  </div>

                  <div>
                    <span>Asistentes</span>

                    <strong>
                      {reservation.guests}
                    </strong>
                  </div>

                  <div>
                    <span>Total</span>

                    <strong>
                      {formatCurrency(
                        reservation.total,
                      )}
                    </strong>
                  </div>
                </div>
              </Link>
            ),
          )}
        </div>

        {filteredReservations.length === 0 && (
          <div className="reservations-empty">
            <div>
              <Search size={25} />
            </div>

            <h3>
              No hemos encontrado reservas
            </h3>

            <p>
              Prueba a cambiar los filtros de
              búsqueda.
            </p>

            <button
              className="primary-button"
              onClick={clearFilters}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(
    new Date(`${date}T12:00:00`),
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

export default Reservations