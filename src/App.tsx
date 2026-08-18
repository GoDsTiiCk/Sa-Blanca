import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Euro,
  LayoutDashboard,
  Menu,
  PartyPopper,
  Phone,
  Plus,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import './App.css'

import Reservations from './pages/Reservations'
import ReservationDetail from './pages/ReservationDetail'
import Calendar from './pages/Calendar'
import Clients from './pages/Clients'
import Services from './pages/Services'
import Payments from './pages/Payments'
import Pricing from './pages/Pricing'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import NewReservation from './pages/NewReservation'
import Cleaning from './pages/Cleaning'

import {
  getReservations,
  subscribeToReservations,
  type Reservation,
} from './data/reservationStore'

const menuItems = [
  {
    label: 'Panel',
    icon: LayoutDashboard,
    path: '/',
  },
  {
    label: 'Reservas',
    icon: PartyPopper,
    path: '/reservas',
  },
  {
    label: 'Calendario',
    icon: CalendarDays,
    path: '/calendario',
  },
  {
    label: 'Clientes',
    icon: Users,
    path: '/clientes',
  },
  {
    label: 'Servicios',
    icon: Sparkles,
    path: '/servicios',
  },
  {
    label: 'Limpieza',
    icon: Clock3,
    path: '/limpieza',
  },
  {
    label: 'Pagos',
    icon: WalletCards,
    path: '/pagos',
  },  
  {
    label: 'Tarifas',
    icon: Euro,
    path: '/tarifas',
  },
  {
    label: 'Informes',
    icon: LayoutDashboard,
    path: '/informes',
  },
  {
    label: 'Configuración',
    icon: SettingsIcon,
    path: '/configuracion',
  },
]

function normalizeShift(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/-/g, ' ')
}

function getShiftTimes(shift: string) {
  const normalized = normalizeShift(shift)

  if (normalized === 'turno 1') {
    return {
      start: '10:00',
      end: '13:00',
    }
  }

  if (normalized === 'turno 2') {
    return {
      start: '15:00',
      end: '20:00',
    }
  }

  if (normalized === 'turno 3') {
    return {
      start: '21:00',
      end: '03:00',
    }
  }

  return null
}

function createDateTime(
  date: string,
  time: string,
) {
  const [hours, minutes] =
    time.split(':').map(Number)

  const result = new Date(
    `${date}T00:00:00`,
  )

  result.setHours(
    hours,
    minutes,
    0,
    0,
  )

  return result
}

function isReservationActive(
  reservation: Reservation,
  now: Date,
) {
  if (
    reservation.status === 'Cancelada' ||
    reservation.status === 'Completada' ||
    !reservation.date
  ) {
    return false
  }

  return reservation.shifts.some(
    (shift) => {
      const times =
        getShiftTimes(shift)

      if (!times) {
        return false
      }

      const start =
        createDateTime(
          reservation.date,
          times.start,
        )

      const end =
        createDateTime(
          reservation.date,
          times.end,
        )

      /*
       * El turno 3 termina a las 03:00
       * del día siguiente.
       */
      if (end <= start) {
        end.setDate(
          end.getDate() + 1,
        )
      }

      return (
        now >= start &&
        now < end
      )
    },
  )
}

function getReservationStart(
  reservation: Reservation,
) {
  const starts =
    reservation.shifts
      .map(
        (shift) =>
          getShiftTimes(shift)?.start,
      )
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      )
      .sort()

  const start =
    starts[0] ?? '00:00'

  return createDateTime(
    reservation.date,
    start,
  ).getTime()
}

function formatDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
  )
}

function formatShift(
  shift: string,
) {
  const normalized =
    normalizeShift(shift)

  if (
    normalized === 'turno 1'
  ) {
    return 'Turno 1 · 10:00 - 13:00'
  }

  if (
    normalized === 'turno 2'
  ) {
    return 'Turno 2 · 15:00 - 20:00'
  }

  if (
    normalized === 'turno 3'
  ) {
    return 'Turno 3 · 21:00 - 03:00'
  }

  return shift
}

function App() {
  const [menuOpen, setMenuOpen] =
    useState(false)

  const location =
    useLocation()

  return (
    <div className="app">
      {menuOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Cerrar menú"
          onClick={() =>
            setMenuOpen(false)
          }
        />
      )}

      <aside
        className={`sidebar ${
          menuOpen
            ? 'sidebar-open'
            : ''
        }`}
      >
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark">
              <PartyPopper size={22} />
            </div>

            <div>
              <div className="brand-name">
                Sa Blanca
              </div>

              <div className="brand-subtitle">
                Gestión de reservas
              </div>
            </div>
          </div>

          <button
            className="close-menu"
            onClick={() =>
              setMenuOpen(false)
            }
            aria-label="Cerrar menú"
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(
            (item) => {
              const Icon =
                item.icon

              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(
                      item.path,
                    )

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`nav-item ${
                    isActive
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setMenuOpen(
                      false,
                    )
                  }
                >
                  <Icon
                    size={19}
                    strokeWidth={1.8}
                  />

                  <span>
                    {item.label}
                  </span>
                </Link>
              )
            },
          )}
        </nav>

        <div className="sidebar-footer">
          <span>Sa Blanca</span>
          <span>v0.1</span>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() =>
              setMenuOpen(true)
            }
            aria-label="Abrir menú"
            type="button"
          >
            <Menu size={24} />
          </button>

          <Link
            to="/"
            className="topbar-brand"
          >
            Sa Blanca
          </Link>

          <Link
            to="/reservas/nueva"
            className="new-reservation-button"
          >
            <Plus size={18} />

            <span>
              Nueva reserva
            </span>
          </Link>
        </header>

        <main className="content">
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/reservas"
              element={
                <Reservations />
              }
            />

            <Route
              path="/reservas/nueva"
              element={
                <NewReservation />
              }
            />

            <Route
              path="/reservas/:id"
              element={
                <ReservationDetail />
              }
            />

            <Route
              path="/calendario"
              element={
                <Calendar />
              }
            />

            <Route
              path="/clientes"
              element={
                <Clients />
              }
            />

            <Route
              path="/servicios"
              element={
                <Services />
              }
            />

            <Route
              path="/limpieza"
              element={
                <Cleaning />
            }
            />

            <Route
            path="/pagos"
            element={
              <Payments />
            }
            />

            <Route
              path="/tarifas"
              element={
                <Pricing />
              }
            />

            <Route
              path="/informes"
              element={
                <Reports />
              }
            />

            <Route
              path="/configuracion"
              element={
                <Settings />
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function Dashboard() {
  const [
    storedVersion,
    setStoredVersion,
  ] = useState(0)

  const [now, setNow] =
    useState(
      () => new Date(),
    )

  useEffect(() => {
    const unsubscribe =
      subscribeToReservations(
        () =>
          setStoredVersion(
            (value) =>
              value + 1,
          ),
      )

    /*
     * La reserva activa depende
     * también de la hora actual.
     * Actualizamos cada 30 segundos.
     */
    const timer =
      window.setInterval(
        () =>
          setNow(
            new Date(),
          ),
        30_000,
      )

    return () => {
      unsubscribe()
      window.clearInterval(
        timer,
      )
    }
  }, [])

  const reservations =
    useMemo(
      () =>
        getReservations(),
      [storedVersion],
    )

  /*
   * En la práctica solo debe
   * existir una reserva activa.
   * Tomamos la primera por
   * seguridad para que el panel
   * nunca muestre más de una.
   */
  const activeReservation =
    useMemo(
      () =>
        reservations.find(
          (reservation) =>
            isReservationActive(
              reservation,
              now,
            ),
        ) ?? null,
      [reservations, now],
    )

  const upcomingReservations =
    useMemo(() => {
      const currentTime =
        now.getTime()

      return reservations
        .filter(
          (reservation) => {
            if (
              reservation.status ===
                'Cancelada' ||
              reservation.status ===
                'Completada'
            ) {
              return false
            }

            return (
              getReservationStart(
                reservation,
              ) > currentTime
            )
          },
        )
        .sort(
          (a, b) =>
            getReservationStart(
              a,
            ) -
            getReservationStart(
              b,
            ),
        )
        .slice(0, 5)
    }, [reservations, now])

  const upcomingCount =
    upcomingReservations.length

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            GESTIÓN DE RESERVAS
          </p>

          <h1>
            Panel de control
          </h1>

          <p className="page-description">
            Resumen de la actividad de
            Sa Blanca
          </p>
        </div>
      </section>

      <section
        className="stats-grid"
        style={{
          gridTemplateColumns:
            'minmax(0, 1fr)',
        }}
      >
        <div className="stat-card">
          <div
            className="stat-icon primary"
          >
            {activeReservation ? (
              <Clock3 size={23} />
            ) : (
              <PartyPopper
                size={23}
              />
            )}
          </div>

          <div className="stat-content">
            <span>
              RESERVA ACTIVA
            </span>

            <strong>
              {activeReservation
                ? '1'
                : '0'}
            </strong>

            {activeReservation ? (
              <div
                style={{
                  display:
                    'flex',
                  flexWrap:
                    'wrap',
                  alignItems:
                    'center',
                  gap: '12px',
                  marginTop:
                    '10px',
                }}
              >
                <div>
                  <strong
                    style={{
                      display:
                        'block',
                      fontSize:
                        '15px',
                    }}
                  >
                    {
                      activeReservation
                        .client
                        .name
                    }
                  </strong>

                  <span>
                    {
                      activeReservation
                        .partyType
                    }
                  </span>
                </div>

                {activeReservation
                  .client
                  .phone ? (
                  <a
                    href={`tel:${activeReservation.client.phone.replace(
                      /\s+/g,
                      '',
                    )}`}
                    style={{
                      display:
                        'inline-flex',
                      alignItems:
                        'center',
                      gap: '7px',
                      minHeight:
                        '36px',
                      padding:
                        '0 13px',
                      borderRadius:
                        '9px',
                      background:
                        '#2f626a',
                      color:
                        '#fff',
                      textDecoration:
                        'none',
                      fontSize:
                        '12px',
                      fontWeight:
                        700,
                    }}
                  >
                    <Phone
                      size={16}
                    />
                    Llamar al cliente
                  </a>
                ) : (
                  <span>
                    Teléfono no disponible
                  </span>
                )}
              </div>
            ) : (
              <span>
                No hay ninguna fiesta
                en curso
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <h2>
                Próximas reservas
              </h2>

              <p>
                Eventos próximos de
                Sa Blanca
              </p>
            </div>

            <Link
              to="/reservas"
              className="text-button"
            >
              Ver todas

              <ChevronRight
                size={16}
              />
            </Link>
          </div>

          {upcomingCount ===
          0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <CalendarDays
                  size={25}
                />
              </div>

              <h3>
                No hay próximas
                reservas
              </h3>

              <p>
                Cuando registres una
                reserva aparecerá aquí.
              </p>

              <Link
                to="/reservas/nueva"
                className="primary-button"
              >
                <Plus size={18} />
                Nueva reserva
              </Link>
            </div>
          ) : (
            <div>
              {upcomingReservations.map(
                (reservation) => (
                  <Link
                    key={
                      reservation.id
                    }
                    to={`/reservas/${reservation.id}`}
                    style={{
                      display:
                        'grid',
                      gridTemplateColumns:
                        'minmax(160px, 1fr) minmax(180px, 1fr) auto',
                      alignItems:
                        'center',
                      gap: '16px',
                      padding:
                        '16px 0',
                      borderTop:
                        '1px solid #edf0f1',
                      color:
                        'inherit',
                      textDecoration:
                        'none',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '10px',
                      }}
                    >
                      <CalendarDays
                        size={18}
                      />

                      <div>
                        <strong
                          style={{
                            display:
                              'block',
                            textTransform:
                              'capitalize',
                          }}
                        >
                          {formatDate(
                            reservation.date,
                          )}
                        </strong>

                        <span
                          style={{
                            color:
                              '#71858a',
                            fontSize:
                              '12px',
                          }}
                        >
                          {reservation.shifts
                            .map(
                              formatShift,
                            )
                            .join(
                              ' · ',
                            )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <strong
                        style={{
                          display:
                            'block',
                        }}
                      >
                        {
                          reservation
                            .client
                            .name
                        }
                      </strong>

                      <span
                        style={{
                          color:
                            '#71858a',
                          fontSize:
                            '12px',
                        }}
                      >
                        {
                          reservation.partyType
                        }{' '}
                        ·{' '}
                        {
                          reservation.guests
                        }{' '}
                        asistentes
                      </span>
                    </div>

                    <span
                      style={{
                        color:
                          '#71858a',
                        fontSize:
                          '12px',
                        fontWeight:
                          700,
                      }}
                    >
                      {
                        reservation.status
                      }
                    </span>
                  </Link>
                ),
              )}
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <h2>
                Resumen
              </h2>

              <p>
                Estado actual de la
                sala
              </p>
            </div>
          </div>

          <div className="summary-list">
            <SummaryRow
              color="green"
              label="Turnos disponibles"
              value={String(
                Math.max(
                  3 -
                    (activeReservation
                      ?.shifts
                      .length ??
                      0),
                  0,
                ),
              )}
            />

            <SummaryRow
              color="yellow"
              label="Reservas pendientes"
              value={String(
                reservations.filter(
                  (
                    reservation,
                  ) =>
                    reservation.status ===
                    'Pendiente',
                ).length,
              )}
            />

            <SummaryRow
              color="red"
              label="Turnos ocupados"
              value={String(
                activeReservation
                  ?.shifts
                  .length ??
                  0,
              )}
            />
          </div>
        </div>
      </section>
    </>
  )
}

type SummaryRowProps = {
  color:
    | 'green'
    | 'yellow'
    | 'red'
  label: string
  value: string
}

function SummaryRow({
  color,
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="summary-row">
      <div className="summary-label">
        <span
          className={`status-dot ${color}`}
        />

        {label}
      </div>

      <strong>
        {value}
      </strong>
    </div>
  )
}

export default App