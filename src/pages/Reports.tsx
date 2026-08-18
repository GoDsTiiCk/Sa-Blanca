import {
  BarChart3,
  CalendarDays,
  Euro,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  getReservations,
  subscribeToReservations,
  type Reservation,
} from '../data/reservationStore'
import './Reports.css'

type CleaningRecord = {
  id: string
  date: string
  person?: string
  start?: string
  end?: string
  hours?: number
  hourlyRate?: number
  total?: number
}

type ServiceSummary = {
  id: string
  name: string
  units: number
  revenue: number
}

const CLEANING_STORAGE_KEY =
  'sa-blanca-cleaning-records'

function getTodayMonth() {
  const date = new Date()

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, '0')}`
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatHours(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '0 h'
  }

  const hours = Math.floor(value)
  const minutes = Math.round(
    (value - hours) * 60,
  )

  if (minutes === 0) {
    return `${hours} h`
  }

  return `${hours} h ${minutes} min`
}

function getMonthLabel(month: string) {
  const [year, monthNumber] =
    month.split('-').map(Number)

  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric',
  }).format(
    new Date(
      year,
      monthNumber - 1,
      1,
    ),
  )
}

function getCleaningRecords(): CleaningRecord[] {
  if (
    typeof window === 'undefined'
  ) {
    return []
  }

  try {
    const stored =
      window.localStorage.getItem(
        CLEANING_STORAGE_KEY,
      )

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    return Array.isArray(parsed)
      ? (parsed as CleaningRecord[])
      : []
  } catch {
    return []
  }
}

function isSameMonth(
  date: string,
  month: string,
) {
  return date.startsWith(`${month}-`)
}

function getReservationHours(
  reservation: Reservation,
) {
  const hoursByShift: Record<
    string,
    number
  > = {
    'turno-1': 3,
    'turno-2': 5,
    'turno-3': 6,
  }

  return reservation.shifts.reduce(
    (total, shift) =>
      total +
      (hoursByShift[shift] ?? 0),
    0,
  )
}

function getStatusLabel(
  status: Reservation['status'],
) {
  return status
}

function App() {
  const [month, setMonth] =
    useState(getTodayMonth)

  const [reservations, setReservations] =
    useState<Reservation[]>(
      getReservations,
    )

  const [cleaningRecords, setCleaningRecords] =
    useState<CleaningRecord[]>(
      getCleaningRecords,
    )

  useEffect(() => {
    return subscribeToReservations(() => {
      setReservations(getReservations())
    })
  }, [])

  useEffect(() => {
    const refreshCleaning = () => {
      setCleaningRecords(
        getCleaningRecords(),
      )
    }

    window.addEventListener(
      'sa-blanca-cleaning-updated',
      refreshCleaning,
    )

    return () => {
      window.removeEventListener(
        'sa-blanca-cleaning-updated',
        refreshCleaning,
      )
    }
  }, [])

  const monthlyReservations =
    useMemo(
      () =>
        reservations.filter(
          (reservation) =>
            isSameMonth(
              reservation.date,
              month,
            ),
        ),
      [reservations, month],
    )

  const activeReservations =
    monthlyReservations.filter(
      (reservation) =>
        reservation.status !==
        'Cancelada',
    )

  const cancelledReservations =
    monthlyReservations.filter(
      (reservation) =>
        reservation.status ===
        'Cancelada',
    )

  const totalRevenue =
    activeReservations.reduce(
      (total, reservation) =>
        total +
        reservation.pricing.total,
      0,
    )

  const totalPaid =
    activeReservations.reduce(
      (total, reservation) =>
        total +
        reservation.amountPaid,
      0,
    )

  const totalPending =
    activeReservations.reduce(
      (total, reservation) =>
        total +
        Math.max(
          reservation.pricing.total -
            reservation.amountPaid,
          0,
        ),
      0,
    )

  const reservedHours =
    activeReservations.reduce(
      (total, reservation) =>
        total +
        getReservationHours(
          reservation,
        ),
      0,
    )

  const totalGuests =
    activeReservations.reduce(
      (total, reservation) =>
        total +
        reservation.guests,
      0,
    )

  const serviceSummary =
    useMemo(() => {
      const map =
        new Map<string, ServiceSummary>()

      activeReservations.forEach(
        (reservation) => {
          reservation.pricing.services.forEach(
            (service) => {
              const current =
                map.get(service.id)

              if (current) {
                current.units += 1
                current.revenue +=
                  service.price
              } else {
                map.set(service.id, {
                  id: service.id,
                  name: service.name,
                  units: 1,
                  revenue: service.price,
                })
              }
            },
          )

          if (reservation.pricing.dj > 0) {
            const current =
              map.get('dj')

            if (current) {
              current.units += 1
              current.revenue +=
                reservation.pricing.dj
            } else {
              map.set('dj', {
                id: 'dj',
                name: 'DJ',
                units: 1,
                revenue:
                  reservation.pricing.dj,
              })
            }
          }

          if (
            reservation.pricing.catering >
            0
          ) {
            const current =
              map.get('catering')

            if (current) {
              current.units += 1
              current.revenue +=
                reservation.pricing.catering
            } else {
              map.set('catering', {
                id: 'catering',
                name: 'Catering',
                units: 1,
                revenue:
                  reservation.pricing.catering,
              })
            }
          }
        },
      )

      return Array.from(
        map.values(),
      ).sort(
        (a, b) =>
          b.units - a.units ||
          b.revenue - a.revenue,
      )
    }, [activeReservations])


  const monthlyCleaning =
    cleaningRecords.filter(
      (record) =>
        isSameMonth(
          record.date,
          month,
        ),
    )

  const cleaningHours =
    monthlyCleaning.reduce(
      (total, record) =>
        total +
        (Number(record.hours) || 0),
      0,
    )

  const cleaningCost =
    monthlyCleaning.reduce(
      (total, record) =>
        total +
        (Number(record.total) ||
          (Number(record.hours) || 0) *
            (Number(
              record.hourlyRate,
            ) || 0)),
      0,
    )

  const averageReservation =
    activeReservations.length > 0
      ? totalRevenue /
        activeReservations.length
      : 0

  const occupancyBase =
    activeReservations.length * 3

  const occupiedShifts =
    activeReservations.reduce(
      (total, reservation) =>
        total +
        reservation.shifts.length,
      0,
    )

  const occupancyPercentage =
    occupancyBase > 0
      ? Math.min(
          100,
          (occupiedShifts /
            occupancyBase) *
            100,
        )
      : 0

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <p className="reports-eyebrow">
            ANÁLISIS DE SA BLANCA
          </p>

          <h1>Informes</h1>

          <p className="reports-description">
            Consulta la actividad, ingresos,
            servicios y horas de uso de la sala.
          </p>
        </div>

        <div className="reports-month-selector">
          <CalendarDays size={18} />

          <input
            type="month"
            value={month}
            onChange={(event) =>
              setMonth(event.target.value)
            }
            aria-label="Seleccionar mes"
          />
        </div>
      </div>

      <div className="reports-month-title">
        <span>
          Informe de{' '}
          {getMonthLabel(month)}
        </span>
      </div>

      <section className="reports-stats-grid">
        <ReportStat
          icon={<BarChart3 size={22} />}
          label="Reservas"
          value={String(
            activeReservations.length,
          )}
          detail={
            cancelledReservations.length > 0
              ? `${cancelledReservations.length} canceladas`
              : 'Sin cancelaciones'
          }
          variant="primary"
        />

        <ReportStat
          icon={<Euro size={22} />}
          label="Facturación"
          value={formatCurrency(
            totalRevenue,
          )}
          detail={`Media ${formatCurrency(
            averageReservation,
          )} por reserva`}
          variant="success"
        />

        <ReportStat
          icon={<TrendingUp size={22} />}
          label="Cobrado"
          value={formatCurrency(
            totalPaid,
          )}
          detail={`${formatCurrency(
            totalPending,
          )} pendientes`}
          variant="warning"
        />

        <ReportStat
          icon={<Users size={22} />}
          label="Asistentes"
          value={String(totalGuests)}
          detail={`${formatHours(
            reservedHours,
          )} de uso reservado`}
          variant="purple"
        />
      </section>

      <section className="reports-grid">
        <div className="report-card">
          <div className="report-card-heading">
            <div className="report-card-icon">
              <CalendarDays size={20} />
            </div>

            <div>
              <h2>Uso de la sala</h2>
              <p>
                Distribución de los turnos
                reservados.
              </p>
            </div>
          </div>

          <div className="usage-summary">
            <div>
              <strong>
                {occupiedShifts}
              </strong>
              <span>turnos ocupados</span>
            </div>

            <div>
              <strong>
                {formatHours(
                  reservedHours,
                )}
              </strong>
              <span>horas reservadas</span>
            </div>

            <div>
              <strong>
                {Math.round(
                  occupancyPercentage,
                )}
                %
              </strong>
              <span>ocupación estimada</span>
            </div>
          </div>

          <div className="shift-bars">
            {(
              [
                [
                  'Turno 1',
                  'turno-1',
                ],
                [
                  'Turno 2',
                  'turno-2',
                ],
                [
                  'Turno 3',
                  'turno-3',
                ],
              ] as const
            ).map(
              ([label, shift]) => {
                const count =
                  activeReservations.filter(
                    (reservation) =>
                      reservation.shifts.includes(
                        shift,
                      ),
                  ).length

                const percentage =
                  activeReservations.length >
                  0
                    ? Math.min(
                        100,
                        (count /
                          activeReservations.length) *
                          100,
                      )
                    : 0

                return (
                  <div
                    className="shift-bar-row"
                    key={shift}
                  >
                    <div className="shift-bar-label">
                      <span>
                        {label}
                      </span>
                      <strong>
                        {count}
                      </strong>
                    </div>

                    <div className="shift-bar-track">
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              },
            )}
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-heading">
            <div className="report-card-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <h2>Servicios</h2>
              <p>
                Servicios adicionales más
                utilizados.
              </p>
            </div>
          </div>

          {serviceSummary.length === 0 ? (
            <div className="report-empty">
              <Sparkles size={28} />
              <strong>
                No hay servicios utilizados
              </strong>
              <span>
                Cuando una reserva incluya
                servicios aparecerán aquí.
              </span>
            </div>
          ) : (
            <div className="service-report-list">
              {serviceSummary.map(
                (service) => (
                  <div
                    className="service-report-row"
                    key={service.id}
                  >
                    <div>
                      <strong>
                        {service.name}
                      </strong>
                      <span>
                        {service.units}{' '}
                        {service.units === 1
                          ? 'uso'
                          : 'usos'}
                      </span>
                    </div>

                    <strong>
                      {formatCurrency(
                        service.revenue,
                      )}
                    </strong>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </section>

      <section className="reports-grid">
        <div className="report-card">
          <div className="report-card-heading">
            <div className="report-card-icon">
              <FileText size={20} />
            </div>

            <div>
              <h2>Situación económica</h2>
              <p>
                Resumen de los importes del mes.
              </p>
            </div>
          </div>

          <div className="money-report-list">
            <MoneyRow
              label="Facturación prevista"
              value={totalRevenue}
            />

            <MoneyRow
              label="Importe cobrado"
              value={totalPaid}
              positive
            />

            <MoneyRow
              label="Importe pendiente"
              value={totalPending}
              warning
            />

            <div className="money-report-total">
              <span>
                Total de reservas
              </span>
              <strong>
                {formatCurrency(
                  totalRevenue,
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-heading">
            <div className="report-card-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <h2>Limpieza</h2>
              <p>
                Horas y coste de limpieza
                registrados.
              </p>
            </div>
          </div>

          <div className="cleaning-report">
            <div className="cleaning-main">
              <strong>
                {formatHours(
                  cleaningHours,
                )}
              </strong>
              <span>
                horas de limpieza
              </span>
            </div>

            <div className="cleaning-cost">
              <span>
                Coste registrado
              </span>
              <strong>
                {formatCurrency(
                  cleaningCost,
                )}
              </strong>
            </div>

            {monthlyCleaning.length ===
            0 ? (
              <p className="cleaning-note">
                Todavía no hay registros de
                limpieza para este mes.
                Podremos alimentarlo desde el
                módulo de control de limpieza.
              </p>
            ) : (
              <p className="cleaning-note">
                {monthlyCleaning.length}{' '}
                {monthlyCleaning.length === 1
                  ? 'registro'
                  : 'registros'}{' '}
                de limpieza contabilizados.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="report-card report-reservations-card">
        <div className="report-card-heading">
          <div className="report-card-icon">
            <FileText size={20} />
          </div>

          <div>
            <h2>Reservas del mes</h2>
            <p>
              Resumen de las reservas activas.
            </p>
          </div>
        </div>

        {activeReservations.length ===
        0 ? (
          <div className="report-empty">
            <CalendarDays size={28} />
            <strong>
              No hay reservas este mes
            </strong>
            <span>
              Cuando registres reservas
              aparecerán en este informe.
            </span>
          </div>
        ) : (
          <div className="report-reservations-table">
            <div className="report-table-header">
              <span>Cliente</span>
              <span>Fecha</span>
              <span>Turnos</span>
              <span>Estado</span>
              <span>Total</span>
            </div>

            {activeReservations.map(
              (reservation) => (
                <div
                  className="report-table-row"
                  key={reservation.id}
                >
                  <strong>
                    {reservation.client.name}
                  </strong>

                  <span>
                    {new Intl.DateTimeFormat(
                      'es-ES',
                      {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      },
                    ).format(
                      new Date(
                        `${reservation.date}T12:00:00`,
                      ),
                    )}
                  </span>

                  <span>
                    {reservation.shift}
                  </span>

                  <span>
                    <span
                      className={`report-status ${getStatusLabel(
                        reservation.status,
                      )
                        .toLowerCase()
                        .replace(
                          /\s+/g,
                          '-',
                        )}`}
                    >
                      {getStatusLabel(
                        reservation.status,
                      )}
                    </span>
                  </span>

                  <strong>
                    {formatCurrency(
                      reservation.pricing.total,
                    )}
                  </strong>
                </div>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  )
}

type ReportStatProps = {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  variant:
    | 'primary'
    | 'success'
    | 'warning'
    | 'purple'
}

function ReportStat({
  icon,
  label,
  value,
  detail,
  variant,
}: ReportStatProps) {
  return (
    <div className="report-stat">
      <div
        className={`report-stat-icon ${variant}`}
      >
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </div>
  )
}

function MoneyRow({
  label,
  value,
  positive,
  warning,
}: {
  label: string
  value: number
  positive?: boolean
  warning?: boolean
}) {
  return (
    <div className="money-report-row">
      <span>{label}</span>

      <strong
        className={
          positive
            ? 'money-positive'
            : warning
              ? 'money-warning'
              : ''
        }
      >
        {formatCurrency(value)}
      </strong>
    </div>
  )
}

export default App