import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react'
import {
  Clock3,
  Euro,
  Plus,
  Receipt,
  Trash2,
  UserRound,
} from 'lucide-react'
import './Cleaning.css'

import {
  getReservations,
  subscribeToReservations,
  type Reservation,
} from '../data/reservationStore'

import {
  calculateCleaningHours,
  createCleaningRecord,
  deleteCleaningRecord,
  formatCleaningHours,
  getCleaningRecords,
  subscribeToCleaning,
  type CleaningExpenseType,
  type CleaningRecord,
} from '../data/cleaningStore'

function Cleaning() {
  const [reservations, setReservations] =
    useState<Reservation[]>(
      getReservations(),
    )

  const [records, setRecords] =
    useState<CleaningRecord[]>(
      getCleaningRecords(),
    )

  const [reservationId, setReservationId] =
    useState('')

  const [type, setType] =
    useState<CleaningExpenseType>(
      'Limpieza',
    )

  const [responsible, setResponsible] =
    useState('')

  const [entryTime, setEntryTime] =
    useState('')

  const [exitTime, setExitTime] =
    useState('')

  const [cost, setCost] =
    useState('')

  const [notes, setNotes] =
    useState('')

  useEffect(() => {
    const refreshReservations = () => {
      setReservations(
        getReservations(),
      )
    }

    refreshReservations()

    return subscribeToReservations(
      refreshReservations,
    )
  }, [])

  useEffect(() => {
    const refreshRecords = () => {
      setRecords(
        getCleaningRecords(),
      )
    }

    refreshRecords()

    return subscribeToCleaning(
      refreshRecords,
    )
  }, [])

  const sortedReservations =
    useMemo(
      () =>
        [...reservations].sort(
          (a, b) =>
            a.date.localeCompare(
              b.date,
            ),
        ),
      [reservations],
    )

  const currentHours =
    calculateCleaningHours(
      entryTime,
      exitTime,
      type,
    )

  const totalCost = records.reduce(
    (sum, record) =>
      sum + Number(record.cost || 0),
    0,
  )

  const totalHours = records.reduce(
    (sum, record) =>
      sum + Number(record.hours || 0),
    0,
  )

  const cleaningCount =
    records.filter(
      (record) =>
        record.type === 'Limpieza',
    ).length

  const otherExpensesCount =
    records.filter(
      (record) =>
        record.type === 'Otros',
    ).length

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!reservationId) {
      window.alert(
        'Selecciona una reserva.',
      )
      return
    }

    const numericCost = Number(cost)

    if (
      !Number.isFinite(numericCost) ||
      numericCost < 0
    ) {
      window.alert(
        'Introduce un coste válido.',
      )
      return
    }

    if (
      type === 'Limpieza' &&
      (!entryTime || !exitTime)
    ) {
      window.alert(
        'Para un gasto de limpieza debes registrar la entrada y la salida.',
      )
      return
    }

    createCleaningRecord({
      reservationId,
      type,
      date:
        reservations.find(
          (reservation) =>
            reservation.id ===
            reservationId,
        )?.date ??
        new Date()
          .toISOString()
          .slice(0, 10),
      responsible:
        responsible.trim(),
      entryTime:
        type === 'Limpieza'
          ? entryTime
          : '',
      exitTime:
        type === 'Limpieza'
          ? exitTime
          : '',
      cost: numericCost,
      notes: notes.trim(),
    })

    setReservationId('')
    setType('Limpieza')
    setResponsible('')
    setEntryTime('')
    setExitTime('')
    setCost('')
    setNotes('')
  }

  const handleDelete = (
    id: string,
  ) => {
    const confirmed =
      window.confirm(
        '¿Quieres eliminar este gasto? Esta acción no se puede deshacer.',
      )

    if (!confirmed) {
      return
    }

    deleteCleaningRecord(id)
  }

  return (
    <div className="cleaning-page">
      <section className="cleaning-page-heading">
        <div>
          <p className="eyebrow">
            OPERACIONES
          </p>

          <h1>Limpieza y gastos</h1>

          <p className="page-description">
            Registra las horas de limpieza y
            los gastos asociados a cada reserva.
          </p>
        </div>

        <div className="cleaning-heading-badge">
          <Receipt size={17} />
          Control de gastos
        </div>
      </section>

      <section className="cleaning-stats">
        <div className="cleaning-stat-card">
          <div className="cleaning-stat-icon primary">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Horas de limpieza</span>
            <strong>
              {formatCleaningHours(
                totalHours,
              )}
            </strong>
          </div>
        </div>

        <div className="cleaning-stat-card">
          <div className="cleaning-stat-icon warning">
            <Euro size={20} />
          </div>

          <div>
            <span>Gastos registrados</span>
            <strong>
              {formatCurrency(
                totalCost,
              )}
            </strong>
          </div>
        </div>

        <div className="cleaning-stat-card">
          <div className="cleaning-stat-icon success">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Servicios de limpieza</span>
            <strong>
              {cleaningCount}
            </strong>
          </div>
        </div>

        <div className="cleaning-stat-card">
          <div className="cleaning-stat-icon purple">
            <Receipt size={20} />
          </div>

          <div>
            <span>Otros gastos</span>
            <strong>
              {otherExpensesCount}
            </strong>
          </div>
        </div>
      </section>

      <div className="cleaning-layout">
        <section className="cleaning-card">
          <div className="cleaning-card-heading">
            <div className="cleaning-section-icon">
              <Plus size={20} />
            </div>

            <div>
              <h2>Registrar gasto</h2>
              <p>
                Vincula cada gasto a una reserva.
              </p>
            </div>
          </div>

          <form
            className="cleaning-form"
            onSubmit={handleSubmit}
          >
            <label className="cleaning-field cleaning-field-full">
              <span>Reserva</span>

              <select
                value={reservationId}
                onChange={(event) =>
                  setReservationId(
                    event.target.value,
                  )
                }
                required
              >
                <option value="">
                  Selecciona una reserva
                </option>

                {sortedReservations.map(
                  (reservation) => (
                    <option
                      key={
                        reservation.id
                      }
                      value={
                        reservation.id
                      }
                    >
                      {reservation.id} ·{' '}
                      {reservation.client.name}{' '}
                      · {formatDate(
                        reservation.date,
                      )}
                    </option>
                  ),
                )}
              </select>
            </label>

            <div className="cleaning-form-grid">
              <label className="cleaning-field">
                <span>Tipo de gasto</span>

                <select
                  value={type}
                  onChange={(event) =>
                    setType(
                      event.target
                        .value as CleaningExpenseType,
                    )
                  }
                >
                  <option value="Limpieza">
                    Limpieza
                  </option>
                  <option value="Otros">
                    Otros
                  </option>
                </select>
              </label>

              <label className="cleaning-field">
                <span>Responsable</span>

                <div className="cleaning-input-icon">
                  <UserRound size={16} />

                  <input
                    value={responsible}
                    onChange={(event) =>
                      setResponsible(
                        event.target.value,
                      )
                    }
                    placeholder="Nombre"
                  />
                </div>
              </label>
            </div>

            {type === 'Limpieza' && (
              <div className="cleaning-time-grid">
                <label className="cleaning-field">
                  <span>Entrada</span>

                  <div className="cleaning-input-icon">
                    <Clock3 size={16} />

                    <input
                      type="time"
                      value={entryTime}
                      onChange={(event) =>
                        setEntryTime(
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>
                </label>

                <label className="cleaning-field">
                  <span>Salida</span>

                  <div className="cleaning-input-icon">
                    <Clock3 size={16} />

                    <input
                      type="time"
                      value={exitTime}
                      onChange={(event) =>
                        setExitTime(
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>
                </label>

                <div className="cleaning-calculated-hours">
                  <span>Horas calculadas</span>
                  <strong>
                    {formatCleaningHours(
                      currentHours,
                    )}
                  </strong>
                </div>
              </div>
            )}

            <div className="cleaning-form-grid">
              <label className="cleaning-field">
                <span>Coste</span>

                <div className="cleaning-input-icon">
                  <Euro size={16} />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(event) =>
                      setCost(
                        event.target.value,
                      )
                    }
                    placeholder="0,00"
                    required
                  />
                </div>
              </label>

              <label className="cleaning-field">
                <span>Observaciones</span>

                <input
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value,
                    )
                  }
                  placeholder="Opcional"
                />
              </label>
            </div>

            <div className="cleaning-form-footer">
              <p>
                {type === 'Limpieza'
                  ? 'Las horas se calculan automáticamente a partir de entrada y salida.'
                  : 'Los gastos adicionales no generan horas de limpieza.'}
              </p>

              <button
                type="submit"
                className="primary-button"
              >
                <Plus size={17} />
                Registrar gasto
              </button>
            </div>
          </form>
        </section>

        <aside className="cleaning-card cleaning-summary-card">
          <div className="cleaning-card-heading">
            <div className="cleaning-section-icon">
              <Clock3 size={20} />
            </div>

            <div>
              <h2>Resumen</h2>
              <p>
                Acumulado de todos los registros.
              </p>
            </div>
          </div>

          <div className="cleaning-summary-list">
            <SummaryRow
              label="Horas de limpieza"
              value={formatCleaningHours(
                totalHours,
              )}
            />

            <SummaryRow
              label="Coste total"
              value={formatCurrency(
                totalCost,
              )}
            />

            <SummaryRow
              label="Limpiezas"
              value={String(
                cleaningCount,
              )}
            />

            <SummaryRow
              label="Otros gastos"
              value={String(
                otherExpensesCount,
              )}
            />
          </div>
        </aside>
      </div>

      <section className="cleaning-card">
        <div className="cleaning-card-heading">
          <div className="cleaning-section-icon">
            <Receipt size={20} />
          </div>

          <div>
            <h2>Registros</h2>
            <p>
              Historial de gastos y horas de limpieza.
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="cleaning-empty">
            <div className="cleaning-empty-icon">
              <Receipt size={24} />
            </div>

            <h3>
              Todavía no hay registros
            </h3>

            <p>
              Cuando registres una limpieza o
              un gasto aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="cleaning-table-wrap">
            <table className="cleaning-table">
              <thead>
                <tr>
                  <th>Reserva</th>
                  <th>Tipo</th>
                  <th>Fecha</th>
                  <th>Responsable</th>
                  <th>Horario</th>
                  <th>Horas</th>
                  <th>Coste</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {[...records]
                  .sort((a, b) =>
                    b.date.localeCompare(
                      a.date,
                    ),
                  )
                  .map((record) => {
                    const reservation =
                      reservations.find(
                        (item) =>
                          item.id ===
                          record.reservationId,
                      )

                    return (
                      <tr key={record.id}>
                        <td>
                          <strong>
                            {record.reservationId}
                          </strong>

                          <span>
                            {reservation
                              ?.client.name ??
                              'Reserva no encontrada'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`cleaning-type-badge ${
                              record.type ===
                              'Limpieza'
                                ? 'cleaning'
                                : 'other'
                            }`}
                          >
                            {record.type}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            record.date,
                          )}
                        </td>

                        <td>
                          {record.responsible ||
                            '—'}
                        </td>

                        <td>
                          {record.type ===
                            'Limpieza' &&
                          record.entryTime &&
                          record.exitTime
                            ? `${record.entryTime} – ${record.exitTime}`
                            : '—'}
                        </td>

                        <td>
                          {record.type ===
                          'Limpieza'
                            ? formatCleaningHours(
                                record.hours,
                              )
                            : '—'}
                        </td>

                        <td>
                          <strong>
                            {formatCurrency(
                              record.cost,
                            )}
                          </strong>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="cleaning-delete-button"
                            onClick={() =>
                              handleDelete(
                                record.id,
                              )
                            }
                            aria-label="Eliminar gasto"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="cleaning-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    new Date(`${date}T12:00:00`),
  )
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

export default Cleaning