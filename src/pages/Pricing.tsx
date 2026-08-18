import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  CalendarDays,
  Check,
  Clock3,
  Euro,
  History,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import {
  addPricingVersion,
  createPricingId,
  deletePricingVersion,
  formatPricingDate,
  getPricingHistory,
  subscribeToPricing,
  type PricingVersion,
} from '../data/pricing'

import './Pricing.css'

type PricingForm = {
  effectiveFrom: string

  weekdayTurno1: string
  weekdayTurno2: string
  weekdayTurno3: string

  weekendTurno1: string
  weekendTurno2: string
  weekendTurno3: string

  cleaning: string
  capacitySurcharge: string

  turno1Start: string
  turno1End: string

  turno2Start: string
  turno2End: string

  turno3Start: string
  turno3End: string
}

function Pricing() {
  const [history, setHistory] =
    useState<PricingVersion[]>(
      getPricingHistory(),
    )

  const [
    showForm,
    setShowForm,
  ] = useState(false)

  const [
    editingPricing,
    setEditingPricing,
  ] =
    useState<PricingVersion | null>(
      null,
    )

  const [
    showHistory,
    setShowHistory,
  ] = useState(false)

  const currentPricing =
    history[0]

  useEffect(() => {
    const refresh = () => {
      setHistory(
        getPricingHistory(),
      )
    }

    return subscribeToPricing(
      refresh,
    )
  }, [])

  const openNewPricing = () => {
    if (!currentPricing) {
      return
    }

    setEditingPricing(null)

    setShowForm(true)
  }

  const openEditPricing = (
    pricing: PricingVersion,
  ) => {
    setEditingPricing(pricing)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingPricing(null)
  }

  const handleDelete = (
    pricing: PricingVersion,
  ) => {
    if (history.length <= 1) {
      alert(
        'Debe existir al menos una tarifa configurada.',
      )
      return
    }

    const confirmed =
      window.confirm(
        `¿Quieres eliminar la tarifa con vigencia desde ${formatPricingDate(
          pricing.effectiveFrom,
        )}?`,
      )

    if (!confirmed) {
      return
    }

    deletePricingVersion(
      pricing.id,
    )

    setHistory(
      getPricingHistory(),
    )
  }

  const activeCount =
    history.length

  const oldestPricing =
    useMemo(() => {
      if (
        history.length ===
        0
      ) {
        return null
      }

      return [...history].sort(
        (a, b) =>
          a.effectiveFrom.localeCompare(
            b.effectiveFrom,
          ),
      )[0]
    }, [history])

  return (
    <div className="pricing-page">
      <section className="pricing-header">
        <div>
          <p className="pricing-eyebrow">
            CONFIGURACIÓN
          </p>

          <h1>
            Tarifas
          </h1>

          <p className="pricing-description">
            Gestiona los precios de la
            sala, limpieza, aforo y
            horarios de Sa Blanca.
          </p>
        </div>

        <button
          type="button"
          className="pricing-primary-button"
          onClick={
            openNewPricing
          }
        >
          <Plus size={17} />
          Nueva tarifa
        </button>
      </section>

      <section className="pricing-info-grid">
        <div className="pricing-info-card">
          <div className="pricing-info-icon current">
            <Euro size={20} />
          </div>

          <div>
            <span>
              Tarifa vigente
            </span>

            <strong>
              {currentPricing
                ? formatPricingDate(
                    currentPricing.effectiveFrom,
                  )
                : 'Sin configurar'}
            </strong>
          </div>
        </div>

        <div className="pricing-info-card">
          <div className="pricing-info-icon history">
            <History size={20} />
          </div>

          <div>
            <span>
              Versiones guardadas
            </span>

            <strong>
              {activeCount}
            </strong>
          </div>
        </div>

        <div className="pricing-info-card">
          <div className="pricing-info-icon clock">
            <Clock3 size={20} />
          </div>

          <div>
            <span>
              Limpieza actual
            </span>

            <strong>
              {formatCurrency(
                currentPricing?.cleaning ??
                  0,
              )}
            </strong>
          </div>
        </div>

        <div className="pricing-info-card">
          <div className="pricing-info-icon capacity">
            <CalendarDays
              size={20}
            />
          </div>

          <div>
            <span>
              Suplemento +49 personas
            </span>

            <strong>
              {formatCurrency(
                currentPricing?.capacitySurcharge ??
                  0,
              )}
            </strong>
          </div>
        </div>
      </section>

      {currentPricing && (
        <>
          <section className="pricing-card">
            <div className="pricing-card-header">
              <div>
                <div className="pricing-section-title">
                  <div className="pricing-section-icon">
                    <Euro size={19} />
                  </div>

                  <div>
                    <h2>
                      Tarifas actuales
                    </h2>

                    <p>
                      Precios que utilizarán
                      las nuevas reservas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pricing-current-badge">
                <Check size={14} />
                Vigente
              </div>
            </div>

            <div className="pricing-effective">
              <CalendarDays size={16} />

              <span>
                Vigente desde
              </span>

              <strong>
                {formatPricingDate(
                  currentPricing.effectiveFrom,
                )}
              </strong>
            </div>

            <div className="pricing-table-wrapper">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>
                      Concepto
                    </th>

                    <th>
                      Turno 1
                      <small>
                        {currentPricing
                          .shifts
                          .turno1
                          .start}{' '}
                        -{' '}
                        {currentPricing
                          .shifts
                          .turno1
                          .end}
                      </small>
                    </th>

                    <th>
                      Turno 2
                      <small>
                        {currentPricing
                          .shifts
                          .turno2
                          .start}{' '}
                        -{' '}
                        {currentPricing
                          .shifts
                          .turno2
                          .end}
                      </small>
                    </th>

                    <th>
                      Turno 3
                      <small>
                        {currentPricing
                          .shifts
                          .turno3
                          .start}{' '}
                        -{' '}
                        {currentPricing
                          .shifts
                          .turno3
                          .end}
                      </small>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>
                      <strong>
                        Lunes a jueves
                      </strong>
                      <span>
                        Días laborables
                      </span>
                    </td>

                    <td>
                      {formatCurrency(
                        currentPricing
                          .weekday
                          .turno1,
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        currentPricing
                          .weekday
                          .turno2,
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        currentPricing
                          .weekday
                          .turno3,
                      )}
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <strong>
                        Viernes,
                        sábado,
                        domingo y
                        festivos
                      </strong>

                      <span>
                        Tarifa especial
                      </span>
                    </td>

                    <td>
                      {formatCurrency(
                        currentPricing
                          .weekendHoliday
                          .turno1,
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        currentPricing
                          .weekendHoliday
                          .turno2,
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        currentPricing
                          .weekendHoliday
                          .turno3,
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pricing-bottom-grid">
              <div className="pricing-special-card">
                <span>
                  Limpieza
                </span>

                <strong>
                  {formatCurrency(
                    currentPricing.cleaning,
                  )}
                </strong>
              </div>

              <div className="pricing-special-card">
                <span>
                  Suplemento de aforo
                </span>

                <strong>
                  {formatCurrency(
                    currentPricing.capacitySurcharge,
                  )}
                </strong>

                <small>
                  Se aplica a partir de
                  50 asistentes.
                </small>
              </div>
            </div>

            <div className="pricing-card-actions">
              <button
                type="button"
                className="pricing-secondary-button"
                onClick={() =>
                  openEditPricing(
                    currentPricing,
                  )
                }
              >
                <Pencil size={15} />
                Editar tarifa actual
              </button>

              <button
                type="button"
                className="pricing-secondary-button"
                onClick={() =>
                  setShowHistory(
                    !showHistory,
                  )
                }
              >
                <History size={15} />
                {showHistory
                  ? 'Ocultar historial'
                  : 'Ver historial'}
              </button>
            </div>
          </section>

          <section className="pricing-card">
            <div className="pricing-card-header">
              <div className="pricing-section-title">
                <div className="pricing-section-icon">
                  <Clock3 size={19} />
                </div>

                <div>
                  <h2>
                    Horarios de los
                    turnos
                  </h2>

                  <p>
                    Estos horarios se
                    utilizarán en Nueva
                    Reserva.
                  </p>
                </div>
              </div>
            </div>

            <div className="shift-hours-grid">
              <ShiftHourCard
                title="Turno 1"
                start={
                  currentPricing.shifts
                    .turno1.start
                }
                end={
                  currentPricing.shifts
                    .turno1.end
                }
              />

              <ShiftHourCard
                title="Turno 2"
                start={
                  currentPricing.shifts
                    .turno2.start
                }
                end={
                  currentPricing.shifts
                    .turno2.end
                }
              />

              <ShiftHourCard
                title="Turno 3"
                start={
                  currentPricing.shifts
                    .turno3.start
                }
                end={
                  currentPricing.shifts
                    .turno3.end
                }
              />
            </div>
          </section>
        </>
      )}

      {showHistory && (
        <section className="pricing-card">
          <div className="pricing-card-header">
            <div className="pricing-section-title">
              <div className="pricing-section-icon">
                <History size={19} />
              </div>

              <div>
                <h2>
                  Historial de tarifas
                </h2>

                <p>
                  Las tarifas antiguas
                  se conservan para
                  mantener el histórico
                  de las reservas.
                </p>
              </div>
            </div>
          </div>

          <div className="pricing-history-list">
            {history.map(
              (pricing, index) => (
                <div
                  key={
                    pricing.id
                  }
                  className={`pricing-history-item ${
                    index === 0
                      ? 'current'
                      : ''
                  }`}
                >
                  <div className="history-date">
                    <CalendarDays
                      size={17}
                    />

                    <div>
                      <strong>
                        {formatPricingDate(
                          pricing.effectiveFrom,
                        )}
                      </strong>

                      {index ===
                        0 && (
                        <span>
                          Vigente
                          actualmente
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="history-values">
                    <div>
                      <span>
                        Turno 1
                      </span>

                      <strong>
                        {formatCurrency(
                          pricing
                            .weekday
                            .turno1,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Turno 2
                      </span>

                      <strong>
                        {formatCurrency(
                          pricing
                            .weekday
                            .turno2,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Turno 3
                      </span>

                      <strong>
                        {formatCurrency(
                          pricing
                            .weekday
                            .turno3,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Limpieza
                      </span>

                      <strong>
                        {formatCurrency(
                          pricing.cleaning,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="history-actions">
                    <button
                      type="button"
                      onClick={() =>
                        openEditPricing(
                          pricing,
                        )
                      }
                      aria-label="Editar tarifa"
                    >
                      <Pencil
                        size={15}
                      />
                    </button>

                    {history.length >
                      1 && (
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            pricing,
                          )
                        }
                        aria-label="Eliminar tarifa"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {oldestPricing && (
        <div className="pricing-history-note">
          <History size={15} />

          <span>
            Las tarifas se guardan por
            versiones. Una modificación
            futura no cambiará los precios
            históricos de las reservas que
            ya hayan sido creadas.
          </span>
        </div>
      )}

      {showForm && (
        <PricingModal
          pricing={
            editingPricing
          }
          onClose={
            closeForm
          }
          onSaved={() => {
            setHistory(
              getPricingHistory(),
            )

            closeForm()
          }}
        />
      )}
    </div>
  )
}

type ShiftHourCardProps = {
  title: string
  start: string
  end: string
}

function ShiftHourCard({
  title,
  start,
  end,
}: ShiftHourCardProps) {
  return (
    <div className="shift-hour-card">
      <div className="shift-hour-icon">
        <Clock3 size={18} />
      </div>

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {start} - {end}
        </span>
      </div>
    </div>
  )
}

type PricingModalProps = {
  pricing:
    | PricingVersion
    | null

  onClose: () => void
  onSaved: () => void
}

function PricingModal({
  pricing,
  onClose,
  onSaved,
}: PricingModalProps) {
  const isEditing =
    Boolean(pricing)

  const [
    form,
    setForm,
  ] = useState<PricingForm>(
    () =>
      pricing
        ? pricingToForm(
            pricing,
          )
        : createDefaultForm(),
  )

  const update = (
    field: keyof PricingForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    const effectiveFrom =
      form.effectiveFrom

    if (!effectiveFrom) {
      alert(
        'Selecciona la fecha de inicio de vigencia.',
      )
      return
    }

    const newPricing: PricingVersion =
      {
        id:
          pricing?.id ??
          createPricingId(
            effectiveFrom,
          ),

        effectiveFrom,

        weekday: {
          turno1:
            toNumber(
              form.weekdayTurno1,
            ),
          turno2:
            toNumber(
              form.weekdayTurno2,
            ),
          turno3:
            toNumber(
              form.weekdayTurno3,
            ),
        },

        weekendHoliday: {
          turno1:
            toNumber(
              form.weekendTurno1,
            ),
          turno2:
            toNumber(
              form.weekendTurno2,
            ),
          turno3:
            toNumber(
              form.weekendTurno3,
            ),
        },

        cleaning:
          toNumber(
            form.cleaning,
          ),

        capacitySurcharge:
          toNumber(
            form.capacitySurcharge,
          ),

        shifts: {
          turno1: {
            start:
              form.turno1Start,
            end:
              form.turno1End,
          },

          turno2: {
            start:
              form.turno2Start,
            end:
              form.turno2End,
          },

          turno3: {
            start:
              form.turno3Start,
            end:
              form.turno3End,
          },
        },

        createdAt:
          pricing?.createdAt ??
          new Date().toISOString(),
      }

    if (
      !isValidPricing(
        newPricing,
      )
    ) {
      alert(
        'Revisa los precios. Todos deben ser números iguales o superiores a 0.',
      )

      return
    }

    addPricingVersion(
      newPricing,
    )

    onSaved()
  }

  return (
    <div
      className="pricing-modal-overlay"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <div className="pricing-modal">
        <div className="pricing-modal-header">
          <div>
            <p>
              CONFIGURACIÓN
            </p>

            <h2>
              {isEditing
                ? 'Editar tarifa'
                : 'Nueva tarifa'}
            </h2>

            <span>
              {isEditing
                ? 'Modifica esta versión de tarifas.'
                : 'Crea una nueva versión que entrará en vigor en la fecha indicada.'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="pricing-modal-content">
            <div className="pricing-form-group">
              <label>
                Fecha de inicio de
                vigencia
              </label>

              <div className="pricing-date-input">
                <CalendarDays
                  size={17}
                />

                <input
                  type="date"
                  value={
                    form.effectiveFrom
                  }
                  onChange={(event) =>
                    update(
                      'effectiveFrom',
                      event.target
                        .value,
                    )
                  }
                  required
                />
              </div>

              <small>
                Las reservas creadas a
                partir de esta fecha
                utilizarán esta versión.
              </small>
            </div>

            <div className="pricing-form-section">
              <h3>
                Lunes a jueves
              </h3>

              <p>
                Tarifas para días
                laborables.
              </p>

              <div className="pricing-form-grid">
                <PriceField
                  label="Turno 1"
                  value={
                    form.weekdayTurno1
                  }
                  onChange={(value) =>
                    update(
                      'weekdayTurno1',
                      value,
                    )
                  }
                />

                <PriceField
                  label="Turno 2"
                  value={
                    form.weekdayTurno2
                  }
                  onChange={(value) =>
                    update(
                      'weekdayTurno2',
                      value,
                    )
                  }
                />

                <PriceField
                  label="Turno 3"
                  value={
                    form.weekdayTurno3
                  }
                  onChange={(value) =>
                    update(
                      'weekdayTurno3',
                      value,
                    )
                  }
                />
              </div>
            </div>

            <div className="pricing-form-section">
              <h3>
                Viernes, sábado,
                domingo y festivos
              </h3>

              <p>
                Tarifas especiales.
              </p>

              <div className="pricing-form-grid">
                <PriceField
                  label="Turno 1"
                  value={
                    form.weekendTurno1
                  }
                  onChange={(value) =>
                    update(
                      'weekendTurno1',
                      value,
                    )
                  }
                />

                <PriceField
                  label="Turno 2"
                  value={
                    form.weekendTurno2
                  }
                  onChange={(value) =>
                    update(
                      'weekendTurno2',
                      value,
                    )
                  }
                />

                <PriceField
                  label="Turno 3"
                  value={
                    form.weekendTurno3
                  }
                  onChange={(value) =>
                    update(
                      'weekendTurno3',
                      value,
                    )
                  }
                />
              </div>
            </div>

            <div className="pricing-form-section">
              <h3>
                Limpieza y aforo
              </h3>

              <div className="pricing-form-grid">
                <PriceField
                  label="Limpieza"
                  value={
                    form.cleaning
                  }
                  onChange={(value) =>
                    update(
                      'cleaning',
                      value,
                    )
                  }
                />

                <PriceField
                  label="Suplemento +49 personas"
                  value={
                    form.capacitySurcharge
                  }
                  onChange={(value) =>
                    update(
                      'capacitySurcharge',
                      value,
                    )
                  }
                />
              </div>
            </div>

            <div className="pricing-form-section">
              <h3>
                Horarios
              </h3>

              <div className="pricing-shifts-form">
                <ShiftForm
                  title="Turno 1"
                  start={
                    form.turno1Start
                  }
                  end={
                    form.turno1End
                  }
                  onStart={(value) =>
                    update(
                      'turno1Start',
                      value,
                    )
                  }
                  onEnd={(value) =>
                    update(
                      'turno1End',
                      value,
                    )
                  }
                />

                <ShiftForm
                  title="Turno 2"
                  start={
                    form.turno2Start
                  }
                  end={
                    form.turno2End
                  }
                  onStart={(value) =>
                    update(
                      'turno2Start',
                      value,
                    )
                  }
                  onEnd={(value) =>
                    update(
                      'turno2End',
                      value,
                    )
                  }
                />

                <ShiftForm
                  title="Turno 3"
                  start={
                    form.turno3Start
                  }
                  end={
                    form.turno3End
                  }
                  onStart={(value) =>
                    update(
                      'turno3Start',
                      value,
                    )
                  }
                  onEnd={(value) =>
                    update(
                      'turno3End',
                      value,
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className="pricing-modal-footer">
            <button
              type="button"
              className="pricing-cancel-button"
              onClick={
                onClose
              }
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="pricing-save-button"
            >
              <Check size={16} />

              {isEditing
                ? 'Guardar cambios'
                : 'Crear tarifa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

type PriceFieldProps = {
  label: string
  value: string
  onChange: (
    value: string,
  ) => void
}

function PriceField({
  label,
  value,
  onChange,
}: PriceFieldProps) {
  return (
    <label className="pricing-price-field">
      <span>
        {label}
      </span>

      <div>
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value,
            )
          }
        />

        <b>€</b>
      </div>
    </label>
  )
}

type ShiftFormProps = {
  title: string
  start: string
  end: string
  onStart: (
    value: string,
  ) => void
  onEnd: (
    value: string,
  ) => void
}

function ShiftForm({
  title,
  start,
  end,
  onStart,
  onEnd,
}: ShiftFormProps) {
  return (
    <div className="pricing-shift-form">
      <strong>
        {title}
      </strong>

      <label>
        Desde
        <input
          type="time"
          value={start}
          onChange={(event) =>
            onStart(
              event.target.value,
            )
          }
        />
      </label>

      <label>
        Hasta
        <input
          type="time"
          value={end}
          onChange={(event) =>
            onEnd(
              event.target.value,
            )
          }
        />
      </label>
    </div>
  )
}

function pricingToForm(
  pricing: PricingVersion,
): PricingForm {
  return {
    effectiveFrom:
      pricing.effectiveFrom,

    weekdayTurno1:
      String(
        pricing.weekday.turno1,
      ),

    weekdayTurno2:
      String(
        pricing.weekday.turno2,
      ),

    weekdayTurno3:
      String(
        pricing.weekday.turno3,
      ),

    weekendTurno1:
      String(
        pricing.weekendHoliday
          .turno1,
      ),

    weekendTurno2:
      String(
        pricing.weekendHoliday
          .turno2,
      ),

    weekendTurno3:
      String(
        pricing.weekendHoliday
          .turno3,
      ),

    cleaning:
      String(
        pricing.cleaning,
      ),

    capacitySurcharge:
      String(
        pricing.capacitySurcharge,
      ),

    turno1Start:
      pricing.shifts.turno1
        .start,

    turno1End:
      pricing.shifts.turno1.end,

    turno2Start:
      pricing.shifts.turno2
        .start,

    turno2End:
      pricing.shifts.turno2.end,

    turno3Start:
      pricing.shifts.turno3
        .start,

    turno3End:
      pricing.shifts.turno3.end,
  }
}

function createDefaultForm(): PricingForm {
  return {
    effectiveFrom:
      getNextDay(),

    weekdayTurno1: '100',
    weekdayTurno2: '120',
    weekdayTurno3: '150',

    weekendTurno1: '130',
    weekendTurno2: '150',
    weekendTurno3: '250',

    cleaning: '70',
    capacitySurcharge: '100',

    turno1Start: '10:00',
    turno1End: '13:00',

    turno2Start: '15:00',
    turno2End: '20:00',

    turno3Start: '21:00',
    turno3End: '03:00',
  }
}

function getNextDay() {
  const date =
    new Date()

  date.setDate(
    date.getDate() + 1,
  )

  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0')

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toNumber(
  value: string,
) {
  const number =
    Number(value)

  return Number.isFinite(
    number,
  )
    ? Math.max(0, number)
    : 0
}

function isValidPricing(
  pricing: PricingVersion,
) {
  const values = [
    pricing.weekday.turno1,
    pricing.weekday.turno2,
    pricing.weekday.turno3,
    pricing.weekendHoliday
      .turno1,
    pricing.weekendHoliday
      .turno2,
    pricing.weekendHoliday
      .turno3,
    pricing.cleaning,
    pricing.capacitySurcharge,
  ]

  return values.every(
    (value) =>
      Number.isFinite(
        value,
      ) &&
      value >= 0,
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  ).format(value)
}

export default Pricing