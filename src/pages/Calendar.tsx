import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Euro,
  PartyPopper,
  Users,
} from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Calendar.css'
import {
  mapStoredReservationStatus,
  type ReservationStatus,
} from '../data/reservationStatus'

import {
  getReservations,
  subscribeToReservations,
  type Reservation as StoredReservation,
} from '../data/reservationStore'

type CalendarView = 'month' | 'week' | 'day'

type ShiftType =
  | 'turno-1'
  | 'turno-2'
  | 'turno-3'

type ShiftStatus =
  | 'disponible'
  | 'pendiente'
  | 'ocupado'
  | 'festivo'

type Reservation = {
  id: string
  date: string
  client: string
  partyType: string
  guests: number
  shifts: ShiftType[]
  status: ReservationStatus
  total: number
}

type CalendarDay = {
  date: Date
  dateKey: string
  dayNumber: number
  currentMonth: boolean
}

type Holiday = {
  date: string
  name: string
}

function mapStoredReservation(reservation: StoredReservation): Reservation {
  return {
    id: reservation.id,
    date: reservation.date,
    client: reservation.client.name,
    partyType: reservation.partyType,
    guests: reservation.guests,
    shifts: reservation.shifts,
    status: mapStoredReservationStatus(reservation.status),
    total: reservation.pricing.total,
  }
}

function getCalendarReservations(): Reservation[] {
  return getReservations().map(mapStoredReservation)
}


const holidays: Holiday[] = [
  {
    date: '2026-08-15',
    name: 'Asunción de la Virgen',
  },
  {
    date: '2026-10-12',
    name: 'Fiesta Nacional',
  },
  {
    date: '2026-11-01',
    name: 'Todos los Santos',
  },
  {
    date: '2026-12-08',
    name: 'Inmaculada Concepción',
  },
  {
    date: '2026-12-25',
    name: 'Navidad',
  },
]

const shifts: {
  value: ShiftType
  name: string
  hours: string
}[] = [
  {
    value: 'turno-1',
    name: 'Turno 1',
    hours: '10:00 - 13:00',
  },
  {
    value: 'turno-2',
    name: 'Turno 2',
    hours: '15:00 - 20:00',
  },
  {
    value: 'turno-3',
    name: 'Turno 3',
    hours: '21:00 - 03:00',
  },
]

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

const weekdayNames = [
  'LUN',
  'MAR',
  'MIÉ',
  'JUE',
  'VIE',
  'SÁB',
  'DOM',
]

function Calendar() {
  const searchParams = new URLSearchParams(window.location.search)
  const requestedDate = searchParams.get('date')
  const requestedView = searchParams.get('view')

  const initialDate = requestedDate
    ? new Date(`${requestedDate}T12:00:00`)
    : new Date(2026, 7, 1)

  const [view, setView] =
    useState<CalendarView>(
      requestedView === 'week' ? 'week' : 'month',
    )
  const [storedVersion, setStoredVersion] = useState(0)

  useEffect(() => {
    return subscribeToReservations(() => setStoredVersion((value) => value + 1))
  }, [])

  const reservations = useMemo(
    () => getCalendarReservations(),
    [storedVersion],
  )

  const [currentDate, setCurrentDate] =
    useState(
      new Date(
        initialDate.getFullYear(),
        initialDate.getMonth(),
        1,
      ),
    )

  const [selectedDate, setSelectedDate] =
    useState(initialDate)

  const monthDays = useMemo(
    () =>
      createMonthDays(
        currentDate,
      ),
    [currentDate],
  )

  const weekDays = useMemo(
    () =>
      createWeekDays(
        selectedDate,
      ),
    [selectedDate],
  )

  const selectedDateKey =
    formatDateKey(selectedDate)

  const selectedReservations =
    getCalendarReservations().filter(
      (reservation) =>
        reservation.date ===
        selectedDateKey,
    )

  const selectedHoliday =
    holidays.find(
      (holiday) =>
        holiday.date ===
        selectedDateKey,
    )

  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() - 1,
          1,
        ),
      )

      return
    }

    if (view === 'week') {
      setSelectedDate(
        addDays(
          selectedDate,
          -7,
        ),
      )

      return
    }

    setSelectedDate(
      addDays(
        selectedDate,
        -1,
      ),
    )
  }

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(
        new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          1,
        ),
      )

      return
    }

    if (view === 'week') {
      setSelectedDate(
        addDays(
          selectedDate,
          7,
        ),
      )

      return
    }

    setSelectedDate(
      addDays(
        selectedDate,
        1,
      ),
    )
  }

  const goToToday = () => {
    const today = new Date()

    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1,
      ),
    )

    setSelectedDate(today)
  }

  const selectDate = (
    date: Date,
  ) => {
    setSelectedDate(date)

    if (
      date.getMonth() !==
        currentDate.getMonth() ||
      date.getFullYear() !==
        currentDate.getFullYear()
    ) {
      setCurrentDate(
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1,
        ),
      )
    }
  }

  const headerTitle =
    getHeaderTitle(
      view,
      currentDate,
      selectedDate,
    )

  return (
    <div className="calendar-page">
      <section className="calendar-page-header">
        <div>
          <p className="calendar-eyebrow">
            GESTIÓN DE RESERVAS
          </p>

          <h1>Calendario</h1>

          <p className="calendar-description">
            Consulta la disponibilidad de
            Sa Blanca
          </p>
        </div>

        <Link
          to="/reservas/nueva"
          className="calendar-new-button"
        >
          <PartyPopper size={18} />
          Nueva reserva
        </Link>
      </section>

      <section className="calendar-toolbar">
        <div className="calendar-view-tabs">
          <button
            className={
              view === 'month'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('month')
            }
          >
            Mes
          </button>

          <button
            className={
              view === 'week'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('week')
            }
          >
            Semana
          </button>

          <button
            className={
              view === 'day'
                ? 'active'
                : ''
            }
            onClick={() =>
              setView('day')
            }
          >
            Día
          </button>
        </div>

        <div className="calendar-navigation">
          <button
            className="calendar-nav-button"
            onClick={goToPrevious}
            aria-label="Anterior"
          >
            <ChevronLeft size={19} />
          </button>

          <button
            className="calendar-today-button"
            onClick={goToToday}
          >
            Hoy
          </button>

          <button
            className="calendar-nav-button"
            onClick={goToNext}
            aria-label="Siguiente"
          >
            <ChevronRight size={19} />
          </button>
        </div>
      </section>

      <section className="calendar-legend">
        <LegendItem
          color="available"
          label="Disponible"
        />

        <LegendItem
          color="pending"
          label="Pendiente"
        />

        <LegendItem
          color="occupied"
          label="Ocupado"
        />

        <LegendItem
          color="holiday"
          label="Festivo"
        />
      </section>

      <section className="calendar-card">
        <div className="calendar-card-header">
          <div>
            <h2>
              {headerTitle}
            </h2>

            <p>
              Cada día muestra el estado de
              sus tres turnos
            </p>
          </div>

          <div className="calendar-summary">
            <span>
              {getCalendarReservations().length}
            </span>

            reservas registradas
          </div>
        </div>

        {view === 'month' && (
          <MonthView
            days={monthDays}
            selectedDate={
              selectedDateKey
            }
            onSelectDate={
              selectDate
            }
          />
        )}

        {view === 'week' && (
          <WeekView
            days={weekDays}
            selectedDate={selectedDateKey}
            onSelectDate={selectDate}
            reservations={reservations}
            holidays={holidays}
          />
        )}

        {view === 'day' && (
          <DayView
            date={selectedDate}
            reservations={
              selectedReservations
            }
            holiday={
              selectedHoliday
            }
          />
        )}
      </section>

      {view !== 'day' && (
        <section className="selected-day-card">
          <div className="selected-day-header">
            <div>
              <p>
                DÍA SELECCIONADO
              </p>

              <h2>
                {formatLongDate(
                  selectedDate,
                )}
              </h2>
            </div>

            {selectedHoliday && (
              <span className="holiday-badge">
                Festivo
              </span>
            )}
          </div>

          {selectedHoliday && (
            <div className="holiday-detail">
              <CalendarDays size={18} />

              <div>
                <strong>
                  {selectedHoliday.name}
                </strong>

                <span>
                  Se aplicarán tarifas de
                  festivo.
                </span>
              </div>
            </div>
          )}

          <div className="day-shifts">
            {shifts.map((shift) => (
              <CalendarShift
                key={shift.value}
                date={selectedDateKey}
                shift={shift}
                reservations={reservations}
                holidays={holidays}
              />
            ))}
          </div>
        </section>
      )}

      <section className="calendar-info-grid">
        <div className="calendar-info-card">
          <div className="info-card-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <strong>
              Disponibilidad por turno
            </strong>

            <span>
              Los tres turnos se gestionan
              de forma independiente.
            </span>
          </div>
        </div>

        <div className="calendar-info-card">
          <div className="info-card-icon">
            <Euro size={20} />
          </div>

          <div>
            <strong>
              Tarifas automáticas
            </strong>

            <span>
              Los festivos y fines de semana
              aplican su tarifa correspondiente.
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

type MonthViewProps = {
  days: CalendarDay[]
  selectedDate: string
  onSelectDate: (
    date: Date,
  ) => void
}

function MonthView({
  days,
  selectedDate,
  onSelectDate,
}: MonthViewProps) {
  return (
    <div className="month-calendar">
      <div className="weekday-row">
        {weekdayNames.map(
          (weekday) => (
            <div
              key={weekday}
              className="weekday-cell"
            >
              {weekday}
            </div>
          ),
        )}
      </div>

      <div className="month-grid">
        {days.map((day) => {
          const holiday =
            holidays.find(
              (item) =>
                item.date ===
                day.dateKey,
            )

          const dayReservations =
            getCalendarReservations().filter(
              (reservation) =>
                reservation.date ===
                day.dateKey,
            )

          const isSelected =
            selectedDate ===
            day.dateKey

          return (
            <button
              key={day.dateKey}
              className={`month-day ${
                !day.currentMonth
                  ? 'outside-month'
                  : ''
              } ${
                isSelected
                  ? 'selected'
                  : ''
              } ${
                holiday
                  ? 'holiday'
                  : ''
              }`}
              onClick={() =>
                onSelectDate(
                  day.date,
                )
              }
            >
              <div className="month-day-top">
                <span className="day-number">
                  {day.dayNumber}
                </span>

                {holiday && (
                  <span className="holiday-star">
                    ★
                  </span>
                )}
              </div>

              <div className="month-day-shifts">
                {shifts.map(
                  (shift) => {
                    const reservation =
                      dayReservations.find(
                        (item) =>
                          item.shifts.includes(
                            shift.value,
                          ),
                      )

                    const status =
                      getShiftStatus(
                        reservation,
                        holiday,
                      )

                    return (
                      <span
                        key={
                          shift.value
                        }
                        className={`mini-shift ${status}`}
                        title={`${shift.name}: ${getStatusLabel(status)}`}
                      >
                        <span className="mini-shift-name">
                          {getShortShiftName(
                            shift.value,
                          )}
                        </span>

                        {reservation && (
                          <span className="mini-shift-client">
                            {
                              reservation.client
                            }
                          </span>
                        )}
                      </span>
                    )
                  },
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

type WeekViewProps = {
  days: Date[]
  selectedDate: string
  onSelectDate: (
    date: Date,
  ) => void
  reservations: Reservation[]
  holidays: Holiday[]
}

function WeekView({
  days,
  selectedDate,
  onSelectDate,
  reservations,
  holidays,
}: WeekViewProps) {
  return (
    <div className="week-calendar">
      <div className="week-header-row">
        <div className="week-time-column">
          Turnos
        </div>

        {days.map((date) => {
          const dateKey =
            formatDateKey(date)

          const holiday =
            holidays.find(
              (item) =>
                item.date ===
                dateKey,
            )

          const selected =
            selectedDate ===
            dateKey

          return (
            <button
              key={dateKey}
              className={`week-day-header ${
                selected
                  ? 'selected'
                  : ''
              }`}
              onClick={() =>
                onSelectDate(
                  date,
                )
              }
            >
              <span>
                {
                  weekdayNames[
                    getMondayIndex(
                      date,
                    )
                  ]
                }
              </span>

              <strong>
                {date.getDate()}
              </strong>

              {holiday && (
                <small>
                  Festivo
                </small>
              )}
            </button>
          )
        })}
      </div>

      <div className="week-body">
        {shifts.map((shift) => (
          <div
            className="week-shift-row"
            key={shift.value}
          >
            <div className="week-time-column">
              <strong>
                {shift.name}
              </strong>

              <span>
                {shift.hours}
              </span>
            </div>

            {days.map((date) => {
              const dateKey =
                formatDateKey(date)

              const reservation =
                reservations.find(
                  (item) =>
                    item.date ===
                      dateKey &&
                    item.shifts.includes(
                      shift.value,
                    ),
                )

              const holiday =
                holidays.find(
                  (item) =>
                    item.date ===
                    dateKey,
                )

              const status =
                getShiftStatus(
                  reservation,
                  holiday,
                )

              return (
                <button
                  key={`${dateKey}-${shift.value}`}
                  className={`week-shift-cell ${status}`}
                  onClick={() =>
                    onSelectDate(
                      date,
                    )
                  }
                >
                  {status ===
                    'ocupado' &&
                    reservation && (
                      <>
                        <strong>
                          {
                            reservation.client
                          }
                        </strong>

                        <span>
                          {
                            reservation.partyType
                          }
                        </span>
                      </>
                    )}

                  {status ===
                    'pendiente' &&
                    reservation && (
                      <>
                        <strong>
                          {
                            reservation.client
                          }
                        </strong>

                        <span>
                          Pendiente
                        </span>
                      </>
                    )}

                  {status ===
                    'festivo' && (
                    <span>
                      Festivo
                    </span>
                  )}

                  {status ===
                    'disponible' && (
                    <span>
                      Disponible
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

type DayViewProps = {
  date: Date
  reservations: Reservation[]
  holiday?: Holiday
}

function DayView({
  date,
  reservations,
  holiday,
}: DayViewProps) {
  return (
    <div className="day-calendar">
      <div className="day-header">
        <div>
          <p>
            {formatWeekday(date)}
          </p>

          <h3>
            {formatLongDate(date)}
          </h3>
        </div>

        {holiday && (
          <div className="day-holiday">
            <CalendarDays size={18} />

            <div>
              <strong>
                {holiday.name}
              </strong>

              <span>
                Día festivo
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="day-shifts-large">
        {shifts.map((shift) => {
          const reservation =
            reservations.find(
              (item) =>
                item.shifts.includes(
                  shift.value,
                ),
            )

          const status =
            getShiftStatus(
              reservation,
              holiday,
            )

          return (
            <div
              key={shift.value}
              className={`large-shift-card ${status}`}
            >
              <div className="large-shift-header">
                <div>
                  <span>
                    {shift.name}
                  </span>

                  <strong>
                    {shift.hours}
                  </strong>
                </div>

                <StatusBadge
                  status={
                    status
                  }
                />
              </div>

              {reservation ? (
                <div className="day-reservation">
                  <div className="reservation-main">
                    <strong>
                      {
                        reservation.client
                      }
                    </strong>

                    <span>
                      {
                        reservation.partyType
                      }
                    </span>
                  </div>

                  <div className="reservation-meta">
                    <span>
                      <Users size={15} />
                      {reservation.guests}{' '}
                      personas
                    </span>

                    <span>
                      <Euro size={15} />
                      {formatCurrency(
                        reservation.total,
                      )}
                    </span>
                  </div>

                  <Link
                    to={`/reservas/${reservation.id}`}
                    className="day-reservation-link"
                  >
                    Ver reserva
                    <ChevronRight
                      size={15}
                    />
                  </Link>
                </div>
              ) : (
                <div className="day-available">
                  <Clock3 size={20} />

                  <span>
                    Este turno está
                    disponible
                  </span>

                  <Link
                    to="/reservas/nueva"
                    className="day-book-link"
                  >
                    Reservar
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

type CalendarShiftProps = {
  date: string
  shift: {
    value: ShiftType
    name: string
    hours: string
  }
  reservations: Reservation[]
  holidays: Holiday[]
}

function CalendarShift({
  date,
  shift,
  reservations,
  holidays,
}: CalendarShiftProps) {
  const reservation =
    reservations.find(
      (item) =>
        item.date === date &&
        item.shifts.includes(
          shift.value,
        ),
    )

  const holiday =
    holidays.find(
      (item) =>
        item.date === date,
    )

  const status =
    getShiftStatus(
      reservation,
      holiday,
    )

  return (
    <div
      className={`selected-shift ${status}`}
    >
      <div className="selected-shift-top">
        <div>
          <strong>
            {shift.name}
          </strong>

          <span>
            {shift.hours}
          </span>
        </div>

        <StatusBadge
          status={status}
        />
      </div>

      {reservation && (
        <div className="selected-shift-reservation">
          <strong>
            {reservation.client}
          </strong>

          <span>
            {reservation.guests}{' '}
            personas ·{' '}
            {reservation.partyType}
          </span>

          <Link
            to={`/reservas/${reservation.id}`}
          >
            Ver reserva
            <ChevronRight size={15} />
          </Link>
        </div>
      )}
    </div>
  )
}

type LegendItemProps = {
  color:
    | 'available'
    | 'pending'
    | 'occupied'
    | 'holiday'
  label: string
}

function LegendItem({
  color,
  label,
}: LegendItemProps) {
  return (
    <div className="legend-item">
      <span
        className={`legend-dot ${color}`}
      />

      <span>{label}</span>
    </div>
  )
}

type StatusBadgeProps = {
  status: ShiftStatus
}

function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`status-badge ${status}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}

function getShiftStatus(
  reservation:
    | Reservation
    | undefined,
  holiday:
    | Holiday
    | undefined,
): ShiftStatus {
  if (reservation) {
    if (
      reservation.status ===
      'pending'
    ) {
      return 'pendiente'
    }

    if (
      reservation.status ===
      'cancelled'
    ) {
      return 'disponible'
    }

    return 'ocupado'
  }

  if (holiday) {
    return 'festivo'
  }

  return 'disponible'
}

function getStatusLabel(
  status: ShiftStatus,
) {
  switch (status) {
    case 'disponible':
      return 'Disponible'

    case 'pendiente':
      return 'Pendiente'

    case 'ocupado':
      return 'Ocupado'

    case 'festivo':
      return 'Festivo'
  }
}

function getShortShiftName(
  shift: ShiftType,
) {
  switch (shift) {
    case 'turno-1':
      return 'T1'

    case 'turno-2':
      return 'T2'

    case 'turno-3':
      return 'T3'
  }
}

function createMonthDays(
  date: Date,
): CalendarDay[] {
  const year =
    date.getFullYear()

  const month =
    date.getMonth()

  const firstDay = new Date(
    year,
    month,
    1,
  )

  const firstWeekday =
    (firstDay.getDay() + 6) % 7

  const startDate = new Date(
    year,
    month,
    1 - firstWeekday,
  )

  return Array.from(
    { length: 42 },
    (_, index) => {
      const current =
        addDays(
          startDate,
          index,
        )

      return {
        date: current,
        dateKey:
          formatDateKey(current),
        dayNumber:
          current.getDate(),
        currentMonth:
          current.getMonth() ===
            month &&
          current.getFullYear() ===
            year,
      }
    },
  )
}

function createWeekDays(
  date: Date,
): Date[] {
  const mondayIndex =
    getMondayIndex(date)

  const monday = addDays(
    date,
    -mondayIndex,
  )

  return Array.from(
    { length: 7 },
    (_, index) =>
      addDays(
        monday,
        index,
      ),
  )
}

function getMondayIndex(
  date: Date,
) {
  return (
    (date.getDay() + 6) % 7
  )
}

function addDays(
  date: Date,
  days: number,
) {
  const result = new Date(
    date,
  )

  result.setDate(
    result.getDate() + days,
  )

  return result
}

function formatDateKey(
  date: Date,
) {
  const year =
    date.getFullYear()

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')

  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatLongDate(
  date: Date,
) {
  const text =
    new Intl.DateTimeFormat(
      'es-ES',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      },
    ).format(date)

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  )
}

function formatWeekday(
  date: Date,
) {
  const text =
    new Intl.DateTimeFormat(
      'es-ES',
      {
        weekday: 'long',
      },
    ).format(date)

  return (
    text.charAt(0).toUpperCase() +
    text.slice(1)
  )
}

function getHeaderTitle(
  view: CalendarView,
  currentDate: Date,
  selectedDate: Date,
) {
  if (view === 'month') {
    const month =
      monthNames[
        currentDate.getMonth()
      ]

    return `${
      month.charAt(0).toUpperCase() +
      month.slice(1)
    } ${currentDate.getFullYear()}`
  }

  if (view === 'day') {
    return formatLongDate(
      selectedDate,
    )
  }

  const week =
    createWeekDays(selectedDate)

  const first = week[0]
  const last =
    week[week.length - 1]

  if (
    first.getMonth() ===
    last.getMonth()
  ) {
    return `${first.getDate()} - ${last.getDate()} ${
      monthNames[
        last.getMonth()
      ]
    } ${last.getFullYear()}`
  }

  return `${first.getDate()} ${
    monthNames[
      first.getMonth()
    ]
  } - ${last.getDate()} ${
    monthNames[
      last.getMonth()
    ]
  } ${last.getFullYear()}`
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    'es-ES',
    {
      style: 'currency',
      currency: 'EUR',
    },
  ).format(value)
}

export default Calendar