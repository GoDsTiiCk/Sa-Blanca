import {
  CreditCard,
  Euro,
  Filter,
  Search,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { PaymentMethod, PaymentStatus } from '../types/payment'
import {
  getPayments,
  registerPayment,
  subscribeToPayments,
} from '../data/paymentStore'
import {
  getReservations,
  subscribeToReservations,
  getReservationPending,
} from '../data/reservationStore'
import {
  getCleaningRecords,
  subscribeToCleaning,
} from '../data/cleaningStore'
import './Payments.css'

type PaymentFilter =
  | 'Todos'
  | 'Pendientes'
  | 'Parciales'
  | 'Pagados'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(value: string) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function getStatus(
  paid: number,
  total: number,
): PaymentStatus {
  if (paid <= 0) return 'Pendiente'
  if (paid >= total) return 'Pagado'
  return 'Parcial'
}

function Payments() {
  const [, forceUpdate] = useState(0)
  const [filter, setFilter] =
    useState<PaymentFilter>('Todos')
  const [search, setSearch] = useState('')
  const [selectedReservationId, setSelectedReservationId] =
    useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>('Transferencia')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [paymentNotes, setPaymentNotes] = useState('')

  useEffect(() => {
    const refresh = () => forceUpdate((value) => value + 1)

    const unsubscribePayments =
      subscribeToPayments(refresh)

    const unsubscribeReservations =
      subscribeToReservations(refresh)

    const unsubscribeCleaning =
      subscribeToCleaning(refresh)

    return () => {
      unsubscribePayments()
      unsubscribeReservations()
      unsubscribeCleaning()
    }
  }, [])

  const reservations = getReservations()
  const payments = getPayments()
  const cleaningRecords = getCleaningRecords()

  const expensesByReservation = useMemo(() => {
    const totals = new Map<string, number>()

    for (const record of cleaningRecords) {
      const current = totals.get(record.reservationId) ?? 0
      totals.set(
        record.reservationId,
        current + Number(record.cost || 0),
      )
    }

    return totals
  }, [cleaningRecords])

  const rows = useMemo(() => {
    return reservations
      .filter(
        (reservation) =>
          reservation.status !== 'Cancelada',
      )
      .map((reservation) => {
        const total = reservation.pricing.total
        const paid = reservation.amountPaid
        const pending = getReservationPending(reservation)

        const expenses =
          expensesByReservation.get(
            reservation.id,
          ) ?? 0

        return {
          reservation,
          total,
          paid,
          pending,
          expenses,
          net: total - expenses,
          status: getStatus(paid, total),
        }
      })
      .filter((row) => {
        if (filter === 'Pendientes') {
          return row.status === 'Pendiente'
        }

        if (filter === 'Parciales') {
          return row.status === 'Parcial'
        }

        if (filter === 'Pagados') {
          return row.status === 'Pagado'
        }

        return true
      })
      .filter((row) => {
        const query = search.trim().toLowerCase()

        if (!query) return true

        return (
          row.reservation.client.name
            .toLowerCase()
            .includes(query) ||
          row.reservation.id
            .toLowerCase()
            .includes(query)
        )
      })
      .sort((a, b) =>
        a.reservation.date.localeCompare(
          b.reservation.date,
        ),
      )
  }, [
    reservations,
    expensesByReservation,
    filter,
    search,
  ])

  const totalBilled = reservations
    .filter((item) => item.status !== 'Cancelada')
    .reduce(
      (sum, item) => sum + item.pricing.total,
      0,
    )

  const totalPaid = reservations
    .filter((item) => item.status !== 'Cancelada')
    .reduce(
      (sum, item) => sum + item.amountPaid,
      0,
    )

  const totalPending = Math.max(
    totalBilled - totalPaid,
    0,
  )

  const totalExpenses = cleaningRecords.reduce(
    (sum, record) =>
      sum + Number(record.cost || 0),
    0,
  )

  const totalNet = totalBilled - totalExpenses

  const selectedReservation =
    selectedReservationId
      ? reservations.find(
          (reservation) =>
            reservation.id === selectedReservationId,
        )
      : undefined

  const selectedPayments =
    selectedReservation
      ? payments.filter(
          (payment) =>
            payment.reservationId ===
            selectedReservation.id,
        )
      : []

  const openPaymentModal = (
    reservationId: string,
  ) => {
    const reservation = reservations.find(
      (item) => item.id === reservationId,
    )

    if (!reservation) return

    setSelectedReservationId(reservationId)
    setPaymentAmount(
      getReservationPending(reservation).toFixed(2),
    )
    setPaymentMethod('Transferencia')
    setPaymentDate(
      new Date().toISOString().slice(0, 10),
    )
    setPaymentNotes('')
  }

  const closePaymentModal = () => {
    setSelectedReservationId(null)
    setPaymentAmount('')
    setPaymentNotes('')
  }

  const handleRegisterPayment = () => {
    if (!selectedReservation) return

    const amount = Number(
      paymentAmount.replace(',', '.'),
    )

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert(
        'Introduce un importe válido.',
      )
      return
    }

    const pending =
      getReservationPending(
        selectedReservation,
      )

    if (amount > pending) {
      window.alert(
        `El importe no puede superar el pendiente de ${formatCurrency(
          pending,
        )}.`,
      )
      return
    }

    try {
      registerPayment({
        reservationId:
          selectedReservation.id,
        amount,
        method: paymentMethod,
        type: 'Reserva',
        paymentDate,
        notes: paymentNotes.trim(),
      })

      closePaymentModal()
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'No se ha podido registrar el pago.',
      )
    }
  }

  return (
    <div className="payments-page">
      <section className="payments-heading">
        <div>
          <p className="payments-eyebrow">
            GESTIÓN ECONÓMICA
          </p>

          <h1>Pagos</h1>

          <p>
            Controla los cobros y pagos pendientes
            de Sa Blanca.
          </p>
        </div>
      </section>

      <section className="payments-stats">
        <div className="payment-stat-card">
          <div className="payment-stat-icon blue">
            <Euro size={22} />
          </div>

          <div>
            <span>Facturación</span>
            <strong>
              {formatCurrency(totalBilled)}
            </strong>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon green">
            <CreditCard size={22} />
          </div>

          <div>
            <span>Cobrado</span>
            <strong>
              {formatCurrency(totalPaid)}
            </strong>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon orange">
            <WalletCards size={22} />
          </div>

          <div>
            <span>Pendiente</span>
            <strong>
              {formatCurrency(totalPending)}
            </strong>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon purple">
            <CreditCard size={22} />
          </div>

          <div>
            <span>Reservas</span>
            <strong>{rows.length}</strong>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon orange">
            <WalletCards size={22} />
          </div>

          <div>
            <span>Gastos</span>
            <strong>
              {formatCurrency(totalExpenses)}
            </strong>
          </div>
        </div>

        <div className="payment-stat-card">
          <div className="payment-stat-icon green">
            <Euro size={22} />
          </div>

          <div>
            <span>Neto</span>
            <strong>
              {formatCurrency(totalNet)}
            </strong>
          </div>
        </div>
      </section>

      <section className="payments-card">
        <div className="payments-toolbar">
          <div className="payments-filter">
            <Filter size={17} />

            {(
              [
                'Todos',
                'Pendientes',
                'Parciales',
                'Pagados',
              ] as PaymentFilter[]
            ).map((item) => (
              <button
                key={item}
                className={
                  filter === item
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setFilter(item)
                }
              >
                {item}
              </button>
            ))}
          </div>

          <label className="payments-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Buscar cliente o reserva..."
            />
          </label>
        </div>

        <div className="payments-table-wrap">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Reserva</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Pagado</th>
                <th>Pendiente</th>
                <th>Gastos</th>
                <th>Neto</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.reservation.id}>
                  <td>
                    <strong>
                      {row.reservation.id}
                    </strong>
                  </td>

                  <td>
                    {row.reservation.client.name}
                  </td>

                  <td>
                    {formatDate(
                      row.reservation.date,
                    )}
                  </td>

                  <td>
                    {formatCurrency(row.total)}
                  </td>

                  <td className="paid-value">
                    {formatCurrency(row.paid)}
                  </td>

                  <td className="pending-value">
                    {formatCurrency(row.pending)}
                  </td>

                  <td>
                    {formatCurrency(row.expenses)}
                  </td>

                  <td>
                    <strong>
                      {formatCurrency(row.net)}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={`payment-status ${row.status.toLowerCase()}`}
                    >
                      {row.status}
                    </span>
                  </td>

                  <td>
                    {row.pending > 0 && (
                      <button
                        className="register-payment-button"
                        onClick={() =>
                          openPaymentModal(
                            row.reservation.id,
                          )
                        }
                      >
                        Registrar pago
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="payments-empty"
                  >
                    No hay reservas que coincidan
                    con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedReservation && (
        <div className="payment-modal-backdrop">
          <div className="payment-modal">
            <div className="payment-modal-header">
              <div>
                <p>
                  Registrar pago
                </p>

                <h2>
                  {selectedReservation.client.name}
                </h2>

                <span>
                  {selectedReservation.id}
                </span>
              </div>

              <button
                className="modal-close"
                onClick={closePaymentModal}
                aria-label="Cerrar"
              >
                <X size={21} />
              </button>
            </div>

            <div className="payment-modal-summary">
              <div>
                <span>Total</span>
                <strong>
                  {formatCurrency(
                    selectedReservation.pricing
                      .total,
                  )}
                </strong>
              </div>

              <div>
                <span>Pagado</span>
                <strong>
                  {formatCurrency(
                    selectedReservation.amountPaid,
                  )}
                </strong>
              </div>

              <div>
                <span>Pendiente</span>
                <strong>
                  {formatCurrency(
                    getReservationPending(
                      selectedReservation,
                    ),
                  )}
                </strong>
              </div>
            </div>

            <div className="payment-form">
              <label>
                Importe
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) =>
                    setPaymentAmount(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Método de pago
                <select
                  value={paymentMethod}
                  onChange={(event) =>
                    setPaymentMethod(
                      event.target
                        .value as PaymentMethod,
                    )
                  }
                >
                  <option>
                    Efectivo
                  </option>
                  <option>
                    Tarjeta
                  </option>
                  <option>
                    Transferencia
                  </option>
                  <option>
                    Bizum
                  </option>
                </select>
              </label>

              <label>
                Fecha
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) =>
                    setPaymentDate(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Notas
                <textarea
                  value={paymentNotes}
                  onChange={(event) =>
                    setPaymentNotes(
                      event.target.value,
                    )
                  }
                  placeholder="Observaciones del pago..."
                  rows={3}
                />
              </label>

              {selectedPayments.length > 0 && (
                <div className="payment-history">
                  <h3>
                    Historial de pagos
                  </h3>

                  {selectedPayments.map(
                    (payment) => (
                      <div
                        className="payment-history-row"
                        key={payment.id}
                      >
                        <div>
                          <strong>
                            {formatCurrency(
                              payment.amount,
                            )}
                          </strong>

                          <span>
                            {payment.method} ·{' '}
                            {formatDate(
                              payment.paymentDate,
                            )}
                          </span>
                        </div>

                        <small>
                          {payment.type}
                        </small>
                      </div>
                    ),
                  )}
                </div>
              )}

              <div className="payment-modal-actions">
                <button
                  className="secondary-button"
                  onClick={closePaymentModal}
                >
                  Cancelar
                </button>

                <button
                  className="primary-payment-button"
                  onClick={
                    handleRegisterPayment
                  }
                >
                  Registrar pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Payments