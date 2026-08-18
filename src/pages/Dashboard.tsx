import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Euro,
  Users,
  WalletCards,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

import {
  getReservations,
  subscribeToReservations,
  type Reservation,
} from '../data/reservationStore'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T12:00:00`))
}

function getStatusLabel(status: Reservation['status']) {
  switch (status) {
    case 'Pendiente':
      return 'Pendiente'
    case 'Confirmada':
      return 'Confirmada'
    case 'Cancelada':
      return 'Cancelada'
    case 'Completada':
      return 'Finalizada'
    default:
      return status
  }
}

function Dashboard() {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    return subscribeToReservations(() =>
      setVersion((current) => current + 1),
    )
  }, [])

  const reservations = useMemo(
    () => getReservations(),
    [version],
  )

  const activeReservations = useMemo(
    () =>
      reservations.filter(
        (reservation) =>
          reservation.status === 'Pendiente' ||
          reservation.status === 'Confirmada',
      ),
    [reservations],
  )

  const expectedRevenue = useMemo(
    () =>
      activeReservations.reduce(
        (total, reservation) =>
          total + Number(reservation.pricing?.total ?? 0),
        0,
      ),
    [activeReservations],
  )

  const pendingPayments = useMemo(
    () =>
      activeReservations.reduce((total, reservation) => {
        const reservationTotal = Number(
          reservation.pricing?.total ?? 0,
        )
        const amountPaid = Number(
          reservation.amountPaid ?? 0,
        )

        return total + Math.max(reservationTotal - amountPaid, 0)
      }, 0),
    [activeReservations],
  )

  const upcomingReservations = useMemo(
    () =>
      [...activeReservations]
        .filter((reservation) => reservation.date)
        .sort((a, b) =>
          a.date.localeCompare(b.date),
        )
        .slice(0, 5),
    [activeReservations],
  )

  const occupiedShifts = useMemo(
    () =>
      activeReservations.reduce(
        (total, reservation) =>
          total + (reservation.shifts?.length ?? 0),
        0,
      ),
    [activeReservations],
  )

  const totalGuests = useMemo(
    () =>
      activeReservations.reduce(
        (total, reservation) =>
          total + Number(reservation.guests ?? 0),
        0,
      ),
    [activeReservations],
  )

  return (
    <div className="dashboard-page">
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">RESUMEN</p>
          <h1>Dashboard</h1>
          <p className="page-description">
            Vista general de la actividad de Sa Blanca.
          </p>
        </div>

        <Link
          to="/reservas/nueva"
          className="dashboard-primary-button"
        >
          Nueva reserva
        </Link>
      </section>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Reservas activas</span>
            <strong>{activeReservations.length}</strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <Euro size={20} />
          </div>

          <div>
            <span>Ingresos previstos</span>
            <strong>{formatCurrency(expectedRevenue)}</strong>
          </div>
        </article>

        <article className="dashboard-stat-card">
          <div className="dashboard-stat-icon">
            <WalletCards size={20} />
          </div>

          <div>
            <span>Pagos pendientes</span>
            <strong>{formatCurrency(pendingPayments)}</strong>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-upcoming">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">AGENDA</p>
              <h2>Próximas reservas</h2>
            </div>

            <Link to="/reservas" className="dashboard-link">
              Ver todas
              <ArrowRight size={16} />
            </Link>
          </div>

          {upcomingReservations.length === 0 ? (
            <div className="dashboard-empty">
              <CalendarDays size={24} />
              <strong>No hay próximas reservas</strong>
              <span>
                Las nuevas reservas aparecerán aquí automáticamente.
              </span>
            </div>
          ) : (
            <div className="dashboard-reservation-list">
              {upcomingReservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  to={`/reservas/${reservation.id}`}
                  className="dashboard-reservation-row"
                >
                  <div className="dashboard-date">
                    <CalendarDays size={17} />
                    <span>{formatDate(reservation.date)}</span>
                  </div>

                  <div className="dashboard-reservation-main">
                    <strong>{reservation.client.name}</strong>
                    <span>
                      {reservation.partyType} ·{' '}
                      {reservation.shifts?.join(' + ') || 'Sin turno'}
                    </span>
                  </div>

                  <div className="dashboard-reservation-meta">
                    <strong>
                      {formatCurrency(
                        Number(reservation.pricing?.total ?? 0),
                      )}
                    </strong>

                    <span
                      className={`dashboard-status ${reservation.status.toLowerCase()}`}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-card dashboard-overview">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">ACTIVIDAD</p>
              <h2>Resumen actual</h2>
            </div>
          </div>

          <div className="dashboard-overview-list">
            <div className="dashboard-overview-item">
              <div>
                <Clock3 size={18} />
                <span>Turnos ocupados</span>
              </div>
              <strong>{occupiedShifts}</strong>
            </div>

            <div className="dashboard-overview-item">
              <div>
                <Users size={18} />
                <span>Asistentes previstos</span>
              </div>
              <strong>{totalGuests}</strong>
            </div>

            <div className="dashboard-overview-item">
              <div>
                <CheckCircle2 size={18} />
                <span>Reservas confirmadas</span>
              </div>
              <strong>
                {
                  activeReservations.filter(
                    (reservation) =>
                      reservation.status === 'Confirmada',
                  ).length
                }
              </strong>
            </div>

            <div className="dashboard-overview-item">
              <div>
                <Clock3 size={18} />
                <span>Reservas pendientes</span>
              </div>
              <strong>
                {
                  activeReservations.filter(
                    (reservation) =>
                      reservation.status === 'Pendiente',
                  ).length
                }
              </strong>
            </div>
          </div>
        </article>
      </section>
    </div>
  )
}

export default Dashboard