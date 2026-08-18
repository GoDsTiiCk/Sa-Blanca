import { useMemo, useState, useEffect } from 'react'
import {
  CalendarDays,
  ChevronRight,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import './Clients.css'

import {
  getReservations,
  subscribeToReservations,
  type Reservation as StoredReservation,
} from '../data/reservationStore'

type ClientReservation = {
  id: string
  date: string
  partyType: string
  guests: number
  shifts: string[]
  total: number
  status:
    | 'Pendiente'
    | 'Confirmada'
    | 'Cancelada'
    | 'Finalizada'
}

type Client = {
  id: string
  name: string
  dni: string
  phone: string
  email: string
  address: string
  reservations: ClientReservation[]
  notes: string
}

const partyTypes = [
  'Todos',
  'Cumpleaños infantil',
  'Cumpleaños adulto',
  'Comunión',
  'Bautizo',
  'Aniversario',
  'Fiesta privada',
  'Evento de empresa',
  'Otros',
]

function mapStoredClient(reservation: StoredReservation): Client {
  const statusMap: Record<StoredReservation['status'], ClientReservation['status']> = {
    Pendiente: 'Pendiente', Confirmada: 'Confirmada', Cancelada: 'Cancelada', Completada: 'Finalizada',
  }

  return {
    id: `CLI-${reservation.client.dni || reservation.client.phone || reservation.client.name}` ,
    name: reservation.client.name,
    dni: reservation.client.dni,
    phone: reservation.client.phone,
    email: reservation.client.email,
    address: reservation.client.address,
    notes: '',
    reservations: [{
      id: reservation.id,
      date: reservation.date,
      partyType: reservation.partyType,
      guests: reservation.guests,
      shifts: reservation.shifts.map((shift) => shift.replace('turno-', 'Turno ')),
      total: reservation.pricing.total,
      status: statusMap[reservation.status],
    }],
  }
}

function getAllClients(): Client[] {
  const storedReservations = getReservations()
  const grouped = new Map<string, Client>()

  for (const reservation of storedReservations) {
    const key = (reservation.client.dni || reservation.client.phone || reservation.client.name).trim().toLowerCase()
    const existing = grouped.get(key)
    const mapped = mapStoredClient(reservation)
    if (existing) {
      existing.reservations.push(...mapped.reservations)
    } else {
      grouped.set(key, mapped)
    }
  }

  return Array.from(grouped.values()).sort(
    (a, b) => a.name.localeCompare(b.name),
  )
}

function Clients() {
  const [search, setSearch] =
    useState('')

  const [storedVersion, setStoredVersion] = useState(0)

  useEffect(() => {
    return subscribeToReservations(() => setStoredVersion((value) => value + 1))
  }, [])

  const clients = useMemo(
    () => getAllClients(),
    [storedVersion],
  )

  const [partyType, setPartyType] =
    useState('Todos')

  const [selectedClientId, setSelectedClientId] =
    useState<string | null>(
      clients[0]?.id ?? null,
    )

  const filteredClients =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase()

      return clients.filter(
        (client) => {
          const matchesSearch =
            !normalizedSearch ||
            client.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            client.dni
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            client.phone
              .toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            client.email
              .toLowerCase()
              .includes(
                normalizedSearch,
              )

          const matchesPartyType =
            partyType === 'Todos' ||
            client.reservations.some(
              (reservation) =>
                reservation.partyType ===
                partyType,
            )

          return (
            matchesSearch &&
            matchesPartyType
          )
        },
      )
    }, [search, partyType])

  const selectedClient =
    clients.find(
      (client) =>
        client.id ===
        selectedClientId,
    ) ?? null

  const totalReservations =
    clients.reduce(
      (total, client) =>
        total +
        client.reservations.length,
      0,
    )

  const futureReservations =
    clients.reduce(
      (total, client) =>
        total +
        client.reservations.filter(
          (reservation) =>
            reservation.status ===
              'Pendiente' ||
            reservation.status ===
              'Confirmada',
        ).length,
      0,
    )

  const totalRevenue =
    clients.reduce(
      (total, client) =>
        total +
        client.reservations.reduce(
          (
            clientTotal,
            reservation,
          ) =>
            clientTotal +
            reservation.total,
          0,
        ),
      0,
    )

  const closeDetail = () => {
    setSelectedClientId(null)
  }

  return (
    <div className="clients-page">
      {/* CABECERA */}
      <section className="clients-page-header">
        <div>
          <p className="clients-eyebrow">
            GESTIÓN DE CLIENTES
          </p>

          <h1>Clientes</h1>

          <p className="clients-description">
            Consulta y gestiona los clientes
            de Sa Blanca
          </p>
        </div>

      </section>

      {/* ESTADÍSTICAS */}
      <section className="clients-stats">
        <ClientStat
          icon={<Users size={21} />}
          label="Total clientes"
          value={String(
            clients.length,
          )}
          variant="primary"
        />

        <ClientStat
          icon={
            <CalendarDays size={21} />
          }
          label="Reservas registradas"
          value={String(
            totalReservations,
          )}
          variant="purple"
        />

        <ClientStat
          icon={
            <CalendarDays size={21} />
          }
          label="Reservas futuras"
          value={String(
            futureReservations,
          )}
          variant="success"
        />

        <ClientStat
          icon={<UserRound size={21} />}
          label="Ingresos generados"
          value={formatCurrency(
            totalRevenue,
          )}
          variant="warning"
        />
      </section>

      {/* CONTENIDO */}
      <section className="clients-layout">
        <div className="clients-list-card">
          <div className="clients-list-header">
            <div>
              <h2>
                Listado de clientes
              </h2>

              <p>
                {filteredClients.length}{' '}
                clientes encontrados
              </p>
            </div>
          </div>

          {/* FILTROS */}
          <div className="clients-filters">
            <div className="client-search">
              <Search size={17} />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Buscar por nombre, DNI, teléfono o email..."
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch('')
                  }
                  aria-label="Limpiar búsqueda"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <select
              value={partyType}
              onChange={(event) =>
                setPartyType(
                  event.target.value,
                )
              }
              aria-label="Filtrar por tipo de fiesta"
            >
              {partyTypes.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* LISTA */}
          <div className="clients-list">
            {filteredClients.length ===
            0 ? (
              <div className="clients-empty">
                <div className="clients-empty-icon">
                  <Users size={25} />
                </div>

                <h3>
                  No se encontraron
                  clientes
                </h3>

                <p>
                  Prueba a cambiar los
                  criterios de búsqueda.
                </p>
              </div>
            ) : (
              filteredClients.map(
                (client) => {
                  const isSelected =
                    selectedClientId ===
                    client.id

                  const lastReservation =
                    getLastReservation(
                      client,
                    )

                  const futureCount =
                    client.reservations.filter(
                      (reservation) =>
                        reservation.status ===
                          'Pendiente' ||
                        reservation.status ===
                          'Confirmada',
                    ).length

                  return (
                    <button
                      key={client.id}
                      type="button"
                      className={`client-row ${
                        isSelected
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() =>
                        setSelectedClientId(
                          client.id,
                        )
                      }
                    >
                      <div className="client-avatar">
                        {getInitials(
                          client.name,
                        )}
                      </div>

                      <div className="client-main">
                        <strong>
                          {client.name}
                        </strong>

                        <span>
                          DNI/NIF:{' '}
                          {client.dni}
                        </span>
                      </div>

                      <div className="client-contact">
                        <span>
                          <Phone size={13} />
                          {client.phone}
                        </span>

                        <span>
                          <Mail size={13} />
                          {client.email}
                        </span>
                      </div>

                      <div className="client-reservations-count">
                        <strong>
                          {
                            client
                              .reservations
                              .length
                          }
                        </strong>

                        <span>
                          reserva
                          {client
                            .reservations
                            .length !==
                          1
                            ? 's'
                            : ''}
                        </span>

                        {futureCount >
                          0 && (
                          <small>
                            {futureCount}{' '}
                            futura
                            {futureCount !==
                            1
                              ? 's'
                              : ''}
                          </small>
                        )}
                      </div>

                      <div className="client-last-reservation">
                        {lastReservation ? (
                          <>
                            <span>
                              Última reserva
                            </span>

                            <strong>
                              {formatShortDate(
                                lastReservation.date,
                              )}
                            </strong>
                          </>
                        ) : (
                          <span>
                            Sin reservas
                          </span>
                        )}
                      </div>

                      <ChevronRight
                        size={18}
                        className="client-arrow"
                      />
                    </button>
                  )
                },
              )
            )}
          </div>
        </div>

        {/* DETALLE */}
        {selectedClient && (
          <ClientDetail
            client={selectedClient}
            onClose={
              closeDetail
            }
          />
        )}
      </section>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ESTADÍSTICA                                                                */
/* -------------------------------------------------------------------------- */

type ClientStatProps = {
  icon: React.ReactNode
  label: string
  value: string
  variant:
    | 'primary'
    | 'purple'
    | 'success'
    | 'warning'
}

function ClientStat({
  icon,
  label,
  value,
  variant,
}: ClientStatProps) {
  return (
    <div className="client-stat">
      <div
        className={`client-stat-icon ${variant}`}
      >
        {icon}
      </div>

      <div>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* DETALLE CLIENTE                                                            */
/* -------------------------------------------------------------------------- */

type ClientDetailProps = {
  client: Client
  onClose: () => void
}

function ClientDetail({
  client,
  onClose,
}: ClientDetailProps) {
  const totalSpent =
    client.reservations.reduce(
      (total, reservation) =>
        total + reservation.total,
      0,
    )

  const futureReservations =
    client.reservations.filter(
      (reservation) =>
        reservation.status ===
          'Pendiente' ||
        reservation.status ===
          'Confirmada',
    )

  return (
    <aside className="client-detail-card">
      <div className="client-detail-header">
        <div>
          <p>FICHA DEL CLIENTE</p>

          <h2>
            {client.name}
          </h2>
        </div>

        <button
          type="button"
          className="client-detail-close"
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          <X size={18} />
        </button>
      </div>

      {/* IDENTIDAD */}
      <div className="client-profile">
        <div className="client-profile-avatar">
          {getInitials(
            client.name,
          )}
        </div>

        <div>
          <strong>
            {client.name}
          </strong>

          <span>
            Cliente {client.id}
          </span>
        </div>
      </div>

      {/* DATOS */}
      <div className="client-detail-section">
        <h3>
          Datos de contacto
        </h3>

        <DetailItem
          label="DNI / NIF"
          value={client.dni}
        />

        <DetailItem
          label="Teléfono"
          value={client.phone}
          icon={<Phone size={15} />}
        />

        <DetailItem
          label="Correo electrónico"
          value={client.email}
          icon={<Mail size={15} />}
        />

        <DetailItem
          label="Dirección"
          value={
            client.address ||
            'No indicada'
          }
        />
      </div>

      {/* RESUMEN */}
      <div className="client-detail-summary">
        <div>
          <span>
            Reservas
          </span>

          <strong>
            {client.reservations.length}
          </strong>
        </div>

        <div>
          <span>
            Futuras
          </span>

          <strong>
            {futureReservations.length}
          </strong>
        </div>

        <div>
          <span>
            Total generado
          </span>

          <strong>
            {formatCurrency(
              totalSpent,
            )}
          </strong>
        </div>
      </div>

      {/* HISTORIAL */}
      <div className="client-detail-section reservation-history">
        <div className="history-heading">
          <h3>
            Historial de reservas
          </h3>

          <span>
            {client.reservations.length}
          </span>
        </div>

        {client.reservations
          .slice()
          .sort(
            (a, b) =>
              b.date.localeCompare(
                a.date,
              ),
          )
          .map(
            (reservation) => (
              <div
                key={
                  reservation.id
                }
                className="client-reservation"
              >
                <div className="client-reservation-date">
                  <span>
                    {formatShortDate(
                      reservation.date,
                    )}
                  </span>

                  <strong>
                    {reservation.id}
                  </strong>
                </div>

                <div className="client-reservation-main">
                  <strong>
                    {
                      reservation.partyType
                    }
                  </strong>

                  <span>
                    {reservation.guests}{' '}
                    personas ·{' '}
                    {reservation.shifts.join(
                      ' + ',
                    )}
                  </span>
                </div>

                <div className="client-reservation-right">
                  <strong>
                    {formatCurrency(
                      reservation.total,
                    )}
                  </strong>

                  <StatusBadge
                    status={
                      reservation.status
                    }
                  />
                </div>

                <Link
                  to={`/reservas/${reservation.id}`}
                  className="client-reservation-link"
                  title="Ver reserva"
                >
                  <ChevronRight
                    size={17}
                  />
                </Link>
              </div>
            ),
          )}
      </div>

      {/* OBSERVACIONES */}
      <div className="client-detail-section">
        <h3>
          Observaciones
        </h3>

        <div className="client-notes">
          {client.notes ||
            'No hay observaciones registradas.'}
        </div>
      </div>

      {/* ACCIONES */}
      <div className="client-detail-actions">
        <Link
          to={
            getLastReservation(client)
              ? `/reservas/nueva?reservaCliente=${encodeURIComponent(
                  getLastReservation(client)!.id,
                )}`
              : '/reservas/nueva'
          }
          className="client-action-primary"
        >
          <CalendarDays size={16} />
          Nueva reserva
        </Link>
      </div>
    </aside>
  )
}

/* -------------------------------------------------------------------------- */
/* COMPONENTES AUXILIARES                                                     */
/* -------------------------------------------------------------------------- */

type DetailItemProps = {
  label: string
  value: string
  icon?: React.ReactNode
}

function DetailItem({
  label,
  value,
  icon,
}: DetailItemProps) {
  return (
    <div className="detail-item">
      <span>
        {icon}
        {label}
      </span>

      <strong>{value}</strong>
    </div>
  )
}

type StatusBadgeProps = {
  status: ClientReservation['status']
}

function StatusBadge({
  status,
}: StatusBadgeProps) {
  const className =
    status
      .toLowerCase()
      .replace(
        'í',
        'i',
      )

  return (
    <span
      className={`client-status ${className}`}
    >
      {status}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* FUNCIONES                                                                  */
/* -------------------------------------------------------------------------- */

function getInitials(
  name: string,
) {
  const parts =
    name.trim().split(' ')

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase()
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase()
}

function getLastReservation(
  client: Client,
) {
  if (
    client.reservations.length ===
    0
  ) {
    return null
  }

  return client.reservations
    .slice()
    .sort(
      (a, b) =>
        b.date.localeCompare(
          a.date,
        ),
    )[0]
}

function formatShortDate(
  date: string,
) {
  const [year, month, day] =
    date.split('-')

  return `${day}/${month}/${year}`
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

export default Clients