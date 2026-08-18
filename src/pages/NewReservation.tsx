import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Euro,
  FileText,
  MapPin,
  PartyPopper,
  Plus,
  User,
  Users,
} from 'lucide-react'

import { Link, useSearchParams } from 'react-router-dom'

import './NewReservation.css'

import {
  getServices,
  subscribeToServices,
  type Service,
} from '../data/services'

import {
  getPricingForDate,
  getTodayString,
  subscribeToPricing,
  type PricingVersion,
} from '../data/pricing'

import {
  createReservation,
  getOccupiedShifts,
  getReservations,
} from '../data/reservationStore'

type PartyType =
  | 'child-birthday'
  | 'adult-birthday'
  | 'communion'
  | 'baptism'
  | 'anniversary'
  | 'private-party'
  | 'corporate-event'
  | 'other'

type ShiftType =
  | 'turno-1'
  | 'turno-2'
  | 'turno-3'

const partyTypes: {
  value: PartyType
  label: string
}[] = [
  {
    value: 'child-birthday',
    label: 'Cumpleaños infantil',
  },
  {
    value: 'adult-birthday',
    label: 'Cumpleaños adulto',
  },
  {
    value: 'communion',
    label: 'Comunión',
  },
  {
    value: 'baptism',
    label: 'Bautizo',
  },
  {
    value: 'anniversary',
    label: 'Aniversario',
  },
  {
    value: 'private-party',
    label: 'Fiesta privada',
  },
  {
    value: 'corporate-event',
    label: 'Evento de empresa',
  },
  {
    value: 'other',
    label: 'Otros',
  },
]

const shiftTypes: ShiftType[] = [
  'turno-1',
  'turno-2',
  'turno-3',
]

function getShiftHours(
  pricing: PricingVersion,
  shift: ShiftType,
) {
  const shiftPricing =
    pricing.shifts[shift.replace('-', '') as keyof PricingVersion['shifts']]

  return `${shiftPricing.start} - ${shiftPricing.end}`
}


const mockHolidays: Record<
  string,
  string
> = {
  '2026-01-01': 'Año Nuevo',
  '2026-01-06': 'Reyes Magos',
  '2026-04-03': 'Viernes Santo',
  '2026-05-01': 'Día del Trabajo',
  '2026-08-15':
    'Asunción de la Virgen',
  '2026-10-12':
    'Fiesta Nacional',
  '2026-12-08':
    'Inmaculada Concepción',
  '2026-12-25': 'Navidad',
}

function NewReservation() {
  const [clientName, setClientName] =
    useState('')

  const [dni, setDni] =
    useState('')

  const [phone, setPhone] =
    useState('')

  const [email, setEmail] =
    useState('')

  const [address, setAddress] =
    useState('')

  /*
   * Si la nueva reserva se abre desde la ficha de un cliente,
   * Clients.tsx pasa el ID de su última reserva mediante:
   *
   * /reservas/nueva?reservaCliente=RSV-002
   *
   * Usamos esa reserva únicamente para precargar los datos.
   * Los campos siguen siendo editables y la nueva reserva
   * guardará la versión que el usuario deje en el formulario.
   */
  const [searchParams] =
    useSearchParams()

  const sourceReservationId =
    searchParams.get(
      'reservaCliente',
    )

  useEffect(() => {
    if (!sourceReservationId) {
      return
    }

    const sourceReservation =
      getReservations().find(
        (reservation) =>
          reservation.id ===
          sourceReservationId,
      )

    if (!sourceReservation) {
      return
    }

    setClientName(
      sourceReservation.client.name,
    )

    setDni(
      sourceReservation.client.dni,
    )

    setPhone(
      sourceReservation.client.phone,
    )

    setEmail(
      sourceReservation.client.email,
    )

    setAddress(
      sourceReservation.client.address,
    )
  }, [sourceReservationId])

  const [eventDate, setEventDate] =
    useState('')

  /*
   * TARIFA VIGENTE
   *
   * La tarifa se determina por la fecha en la que
   * se crea la reserva, no por la fecha del evento.
   * Así, si mañana cambia el precio, las nuevas
   * reservas utilizarán la nueva versión y las
   * reservas anteriores conservarán la que tenían.
   */
  const reservationCreatedDate =
    getTodayString()

  const [pricingVersion, setPricingVersion] =
    useState<PricingVersion>(() =>
      getPricingForDate(
        reservationCreatedDate,
      ),
    )

  useEffect(() => {
    const refreshPricing = () => {
      setPricingVersion(
        getPricingForDate(
          reservationCreatedDate,
        ),
      )
    }

    refreshPricing()

    return subscribeToPricing(
      refreshPricing,
    )
  }, [reservationCreatedDate])

  const shifts = useMemo(
    () =>
      shiftTypes.map((value) => ({
        value,
        name: getShiftName(value),
        hours: getShiftHours(
          pricingVersion,
          value,
        ),
      })),
    [pricingVersion],
  )

  const [partyType, setPartyType] =
    useState<PartyType>(
      'child-birthday',
    )

  const [guests, setGuests] =
    useState(1)

  const [
    selectedShifts,
    setSelectedShifts,
  ] = useState<ShiftType[]>([])

  const [dj, setDj] =
    useState(false)

  const [djPrice, setDjPrice] =
    useState(150)

  const [catering, setCatering] =
    useState(false)

  const [
    cateringGuests,
    setCateringGuests,
  ] = useState(0)

  const [
    cateringPrice,
    setCateringPrice,
  ] = useState(25)

  /*
   * SERVICIOS COMPARTIDOS
   */
  const [services, setServices] =
    useState<Service[]>(
      getServices(),
    )

  const [
    serviceSelections,
    setServiceSelections,
  ] = useState<string[]>([])

  const dynamicServices =
    useMemo(
      () =>
        services.filter(
          (service) =>
            service.name !== 'DJ' &&
            service.name !==
              'Catering',
        ),
      [services],
    )

  const djService =
    services.find(
      (service) =>
        service.name === 'DJ',
    )

  const cateringService =
    services.find(
      (service) =>
        service.name ===
        'Catering',
    )

  /*
   * Escucha los cambios realizados
   * desde la página Servicios.
   */
  useEffect(() => {
    const refreshServices =
      () => {
        const updatedServices =
          getServices()

        setServices(
          updatedServices,
        )

        const availableIds =
          updatedServices
            .filter(
              (service) =>
                service.active &&
                service.name !==
                  'DJ' &&
                service.name !==
                  'Catering',
            )
            .map(
              (service) =>
                service.id,
            )

        /*
         * Si un servicio que estaba
         * seleccionado pasa a estar
         * inactivo, lo quitamos de
         * la reserva.
         */
        setServiceSelections(
          (current) =>
            current.filter(
              (id) =>
                availableIds.includes(
                  id,
                ),
            ),
        )

        const updatedDj =
          updatedServices.find(
            (service) =>
              service.name ===
              'DJ',
          )

        const updatedCatering =
          updatedServices.find(
            (service) =>
              service.name ===
              'Catering',
          )

        if (updatedDj) {
          setDjPrice(
            updatedDj.price,
          )

          if (
            !updatedDj.active
          ) {
            setDj(false)
          }
        }

        if (
          updatedCatering
        ) {
          setCateringPrice(
            updatedCatering.price,
          )

          if (
            !updatedCatering.active
          ) {
            setCatering(false)
          }
        }
      }

    /*
     * Cargamos también los precios
     * actuales al abrir la página.
     */
    refreshServices()

    const unsubscribe =
      subscribeToServices(
        refreshServices,
      )

    return unsubscribe
  }, [])

  const [
    customerNotes,
    setCustomerNotes,
  ] = useState('')

  const [
    internalNotes,
    setInternalNotes,
  ] = useState('')

  const [
    amountPaid,
    setAmountPaid,
  ] = useState(0)

  const selectedHoliday =
    eventDate
      ? mockHolidays[eventDate]
      : undefined

  const dayInfo = useMemo(() => {
    if (!eventDate) {
      return null
    }

    const date = new Date(
      `${eventDate}T12:00:00`,
    )

    const weekday =
      new Intl.DateTimeFormat(
        'es-ES',
        {
          weekday: 'long',
        },
      ).format(date)

    const normalizedWeekday =
      weekday.charAt(0).toUpperCase() +
      weekday.slice(1)

    const dayNumber =
      date.getDay()

    const weekend =
      dayNumber === 0 ||
      dayNumber === 5 ||
      dayNumber === 6

    return {
      weekday:
        normalizedWeekday,
      weekend,
      holiday:
        Boolean(
          selectedHoliday,
        ),
    }
  }, [
    eventDate,
    selectedHoliday,
  ])

  /*
   * Cálculo económico.
   *
   * La sala, limpieza y suplemento proceden de la
   * versión de tarifas vigente al crear la reserva.
   * El tipo de tarifa (laborable / fin de semana /
   * festivo) depende de la fecha del evento.
   */
  const pricing = useMemo(() => {
    const isWeekendOrHoliday =
      dayInfo?.weekend ||
      dayInfo?.holiday

    const roomRates =
      isWeekendOrHoliday
        ? pricingVersion.weekendHoliday
        : pricingVersion.weekday

    const room =
      selectedShifts.reduce(
        (total, selectedShift) => {
          const shiftKey =
            selectedShift.replace(
              '-',
              '',
            ) as keyof typeof roomRates

          return (
            total + roomRates[shiftKey]
          )
        },
        0,
      )

    const cleaning =
      selectedShifts.length > 0
        ? pricingVersion.cleaning
        : 0

    const surcharge =
      guests > 49
        ? pricingVersion.capacitySurcharge
        : 0

    const servicesTotal =
      services
        .filter(
          (service) =>
            service.active &&
            serviceSelections.includes(
              service.id,
            ),
        )
        .reduce(
          (total, service) =>
            total + service.price,
          0,
        )

    const djTotal =
      dj && djService?.active
        ? djPrice
        : 0

    const cateringTotal =
      catering &&
      cateringService?.active &&
      cateringGuests > 0
        ? cateringGuests *
          cateringPrice
        : 0

    const total =
      room +
      cleaning +
      surcharge +
      servicesTotal +
      djTotal +
      cateringTotal

    return {
      room,
      cleaning,
      surcharge,
      dj: djTotal,
      catering: cateringTotal,
      services: servicesTotal,
      total,
    }
  }, [
    selectedShifts,
    dayInfo,
    guests,
    services,
    serviceSelections,
    dj,
    djPrice,
    djService,
    catering,
    cateringGuests,
    cateringPrice,
    cateringService,
    pricingVersion,
  ])

  const pending = Math.max(
    pricing.total -
      amountPaid,
    0,
  )

  const occupiedShifts = eventDate
    ? getOccupiedShifts(eventDate)
    : []

  const hasOccupiedSelectedShift =
    selectedShifts.some(
      (selectedShift) =>
        occupiedShifts.includes(
          selectedShift,
        ),
    )

  const toggleShift = (
    shift: ShiftType,
  ) => {
    if (eventDate) {
      const isOccupied =
        getOccupiedShifts(eventDate).includes(
          shift,
        )

      if (isOccupied) {
        return
      }
    }

    setSelectedShifts(
      (current) => {
        if (
          current.includes(shift)
        ) {
          return current.filter(
            (item) =>
              item !== shift,
          )
        }

        return [
          ...current,
          shift,
        ]
      },
    )
  }

  const handleDateChange = (
    newDate: string,
  ) => {
    setEventDate(newDate)

    const occupied =
      getOccupiedShifts(newDate)

    setSelectedShifts(
      (current) =>
        current.filter(
          (shift) =>
            !occupied.includes(
              shift,
            ),
        ),
    )
  }

  const toggleService = (
    service: Service,
  ) => {
    /*
     * Un servicio inactivo no
     * puede añadirse a una reserva.
     */
    if (!service.active) {
      return
    }

    setServiceSelections(
      (current) =>
        current.includes(
          service.id,
        )
          ? current.filter(
              (item) =>
                item !==
                service.id,
            )
          : [
              ...current,
              service.id,
            ],
    )
  }

  const canSubmit =
    clientName.trim() !== '' &&
    phone.trim() !== '' &&
    eventDate !== '' &&
    selectedShifts.length >
      0 &&
    !hasOccupiedSelectedShift

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    const selectedServices =
      services
        .filter(
          (service) =>
            service.active &&
            serviceSelections.includes(
              service.id,
            ),
        )
        .map((service) => ({
          id: service.id,
          name: service.name,
          price: service.price,
        }))

    try {
      const reservation =
        createReservation({
          date: eventDate,

          client: {
            name: clientName.trim(),
            dni: dni.trim(),
            phone: phone.trim(),
            email: email.trim(),
            address: address.trim(),
          },

          partyType,

          guests,

          shifts: [
            ...selectedShifts,
          ],

          holiday:
            Boolean(selectedHoliday),

          holidayName:
            selectedHoliday,

          pricing: {
            pricingVersionId:
              pricingVersion.id,

            pricingEffectiveFrom:
              pricingVersion.effectiveFrom,

            room: pricing.room,

            cleaning:
              pricing.cleaning,

            attendanceSurcharge:
              pricing.surcharge,

            services:
              selectedServices,

            dj: pricing.dj,

            catering:
              pricing.catering,

            total: pricing.total,
          },

          amountPaid,

          customerNotes:
            customerNotes.trim(),

          internalNotes:
            internalNotes.trim(),
        })

      alert(
        `Reserva creada correctamente.\n\nID: ${reservation.id}\nCliente: ${reservation.client.name}\nFecha: ${formatDate(reservation.date)}\nTurnos: ${reservation.shift}\nTotal: ${formatCurrency(reservation.pricing.total)}\nPendiente: ${formatCurrency(reservation.amountPending)}`,
      )

      window.location.href =
        `/reservas/${reservation.id}`
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se ha podido guardar la reserva.'

      alert(message)
    }
  }

  return (
    <div className="new-reservation-page">
      <section className="new-reservation-heading">
        <div>
          <Link
            to="/reservas"
            className="back-link"
          >
            <ArrowLeft size={17} />
            Volver a reservas
          </Link>

          <p className="eyebrow">
            GESTIÓN DE RESERVAS
          </p>

          <h1>
            Nueva reserva
          </h1>

          <p className="page-description">
            Registra un nuevo evento
            en Sa Blanca
          </p>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
      >
        <div className="new-reservation-layout">
          <div className="new-reservation-main">
            {/* DATOS DEL CLIENTE */}

            <section className="form-card">
              <div className="form-card-heading">
                <div className="form-section-icon">
                  <User size={20} />
                </div>

                <div>
                  <h2>
                    Datos del cliente
                  </h2>

                  <p>
                    Información de
                    contacto del cliente
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <FormField
                  label="Nombre y apellidos"
                  required
                >
                  <input
                    value={
                      clientName
                    }
                    onChange={(
                      event,
                    ) =>
                      setClientName(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ej. María García"
                    required
                  />
                </FormField>

                <FormField label="DNI / NIF">
                  <input
                    value={dni}
                    onChange={(
                      event,
                    ) =>
                      setDni(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ej. 12345678A"
                  />
                </FormField>

                <FormField
                  label="Teléfono"
                  required
                >
                  <input
                    type="tel"
                    value={phone}
                    onChange={(
                      event,
                    ) =>
                      setPhone(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Ej. 600 123 456"
                    required
                  />
                </FormField>

                <FormField label="Correo electrónico">
                  <input
                    type="email"
                    value={email}
                    onChange={(
                      event,
                    ) =>
                      setEmail(
                        event.target
                          .value,
                      )
                    }
                    placeholder="cliente@email.com"
                  />
                </FormField>

                <FormField
                  label="Dirección"
                  fullWidth
                >
                  <div className="input-with-icon">
                    <MapPin
                      size={17}
                    />

                    <input
                      value={address}
                      onChange={(
                        event,
                      ) =>
                        setAddress(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Dirección del cliente"
                    />
                  </div>
                </FormField>
              </div>
            </section>

            {/* DATOS DE LA FIESTA */}

            <section className="form-card">
              <div className="form-card-heading">
                <div className="form-section-icon">
                  <PartyPopper
                    size={20}
                  />
                </div>

                <div>
                  <h2>
                    Datos de la fiesta
                  </h2>

                  <p>
                    Información del
                    evento
                  </p>
                </div>
              </div>

              <div className="form-grid">
                <FormField
                  label="Fecha de la fiesta"
                  required
                >
                  <div className="input-with-icon">
                    <CalendarDays
                      size={17}
                    />

                    <input
                      type="date"
                      value={
                        eventDate
                      }
                      onChange={(
                        event,
                      ) =>
                        handleDateChange(
                          event.target
                            .value,
                        )
                      }
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Día de la semana">
                  <div className="readonly-field">
                    {dayInfo
                      ? dayInfo.weekday
                      : 'Selecciona una fecha'}
                  </div>
                </FormField>

                <FormField
                  label="Tipo de fiesta"
                  required
                  fullWidth
                >
                  <select
                    value={
                      partyType
                    }
                    onChange={(
                      event,
                    ) =>
                      setPartyType(
                        event.target
                          .value as PartyType,
                      )
                    }
                  >
                    {partyTypes.map(
                      (type) => (
                        <option
                          key={
                            type.value
                          }
                          value={
                            type.value
                          }
                        >
                          {type.label}
                        </option>
                      ),
                    )}
                  </select>
                </FormField>

                <FormField
                  label="Número de asistentes"
                  required
                >
                  <div className="input-with-icon">
                    <Users size={17} />

                    <input
                      type="number"
                      min="1"
                      value={
                        guests
                      }
                      onChange={(
                        event,
                      ) =>
                        setGuests(
                          Math.max(
                            1,
                            Number(
                              event.target
                                .value,
                            ),
                          ),
                        )
                      }
                      required
                    />
                  </div>
                </FormField>

                <FormField label="Aforo">
                  {guests >
                  49 ? (
                    <div className="warning-message">
                      <span>
                        Suplemento de
                        aforo
                      </span>

                      <strong>
                        +{formatCurrency(
                          pricingVersion.capacitySurcharge,
                        )}
                      </strong>
                    </div>
                  ) : (
                    <div className="success-message">
                      Aforo estándar
                    </div>
                  )}
                </FormField>
              </div>
            </section>

            {/* TURNOS */}

            <section className="form-card">
              <div className="form-card-heading">
                <div className="form-section-icon">
                  <CalendarDays
                    size={20}
                  />
                </div>

                <div>
                  <h2>
                    Turnos
                  </h2>

                  <p>
                    Puedes seleccionar
                    uno o varios turnos
                  </p>
                </div>
              </div>

              <div className="shift-grid">
                {shifts.map(
                  (item) => {
                    const isOccupied =
                      occupiedShifts.includes(
                        item.value,
                      )

                    const selected =
                      selectedShifts.includes(
                        item.value,
                      )

                    return (
                      <button
                        key={
                          item.value
                        }
                        type="button"
                        className={`shift-option ${
                          selected
                            ? 'selected'
                            : ''
                        } ${
                          isOccupied
                            ? 'occupied'
                            : ''
                        }`}
                        disabled={
                          isOccupied
                        }
                        onClick={() =>
                          toggleShift(
                            item.value,
                          )
                        }
                      >
                        <div>
                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.hours}
                          </span>
                        </div>

                        {isOccupied ? (
                          <span className="shift-badge occupied-badge">
                            Ocupado
                          </span>
                        ) : selected ? (
                          <span className="shift-check">
                            <Check
                              size={15}
                            />
                          </span>
                        ) : (
                          <span className="shift-badge">
                            Disponible
                          </span>
                        )}
                      </button>
                    )
                  },
                )}
              </div>

              {selectedShifts.length >
                0 && (
                <div className="info-message">
                  <strong>
                    Turnos
                    seleccionados:{' '}
                  </strong>

                  {selectedShifts
                    .map((shift) =>
                      getShiftName(
                        shift,
                      ),
                    )
                    .join(' + ')}
                </div>
              )}

              {eventDate &&
                hasOccupiedSelectedShift && (
                  <div className="error-message">
                    Uno de los turnos
                    seleccionados ya
                    está ocupado para
                    esta fecha.
                  </div>
                )}

              {!eventDate && (
                <div className="info-message">
                  Selecciona primero
                  una fecha para
                  consultar la
                  disponibilidad.
                </div>
              )}
            </section>

            {/* SERVICIOS */}

            <section className="form-card">
              <div className="form-card-heading">
                <div className="form-section-icon">
                  <Plus size={20} />
                </div>

                <div>
                  <h2>
                    Servicios adicionales
                  </h2>

                  <p>
                    Añade servicios a
                    la reserva
                  </p>
                </div>
              </div>

              <div className="service-selection-grid">
                {/* DJ */}

                <button
                  type="button"
                  className={`service-selection ${
                    dj
                      ? 'selected'
                      : ''
                  } ${
                    !djService?.active
                      ? 'disabled'
                      : ''
                  }`}
                  disabled={
                    !djService?.active
                  }
                  onClick={() =>
                    setDj(!dj)
                  }
                  style={
                    !djService?.active
                      ? {
                          opacity:
                            0.48,
                          background:
                            '#f1f3f4',
                          borderColor:
                            '#d9dfe1',
                          cursor:
                            'not-allowed',
                        }
                      : undefined
                  }
                >
                  <div>
                    <strong>
                      DJ
                    </strong>

                    <span>
                      {!djService?.active
                        ? 'No disponible'
                        : 'Precio configurable'}
                    </span>
                  </div>

                  <span className="service-price">
                    {!djService?.active ? (
                      'No disponible'
                    ) : dj ? (
                      <Check
                        size={17}
                      />
                    ) : (
                      `+${djPrice} €`
                    )}
                  </span>
                </button>

                {/* CATERING */}

                <button
                  type="button"
                  className={`service-selection ${
                    catering
                      ? 'selected'
                      : ''
                  } ${
                    !cateringService?.active
                      ? 'disabled'
                      : ''
                  }`}
                  disabled={
                    !cateringService?.active
                  }
                  onClick={() =>
                    setCatering(
                      !catering,
                    )
                  }
                  style={
                    !cateringService?.active
                      ? {
                          opacity:
                            0.48,
                          background:
                            '#f1f3f4',
                          borderColor:
                            '#d9dfe1',
                          cursor:
                            'not-allowed',
                        }
                      : undefined
                  }
                >
                  <div>
                    <strong>
                      Catering
                    </strong>

                    <span>
                      {!cateringService?.active
                        ? 'No disponible'
                        : 'Precio por comensal'}
                    </span>
                  </div>

                  <span className="service-price">
                    {!cateringService?.active ? (
                      'No disponible'
                    ) : catering ? (
                      <Check
                        size={17}
                      />
                    ) : (
                      `${cateringPrice} €/persona`
                    )}
                  </span>
                </button>

                {/* RESTO DE SERVICIOS */}

                {dynamicServices.map(
                  (service) => {
                    const selected =
                      serviceSelections.includes(
                        service.id,
                      )

                    const disabled =
                      !service.active

                    return (
                      <button
                        key={
                          service.id
                        }
                        type="button"
                        className={`service-selection ${
                          selected
                            ? 'selected'
                            : ''
                        } ${
                          disabled
                            ? 'disabled'
                            : ''
                        }`}
                        disabled={
                          disabled
                        }
                        onClick={() =>
                          toggleService(
                            service,
                          )
                        }
                        style={
                          disabled
                            ? {
                                opacity:
                                  0.48,
                                background:
                                  '#f1f3f4',
                                borderColor:
                                  '#d9dfe1',
                                cursor:
                                  'not-allowed',
                              }
                            : undefined
                        }
                      >
                        <div>
                          <strong>
                            {
                              service.name
                            }
                          </strong>

                          <span>
                            {disabled
                              ? 'No disponible'
                              : 'Servicio adicional'}
                          </span>
                        </div>

                        <span className="service-price">
                          {disabled ? (
                            'No disponible'
                          ) : selected ? (
                            <Check
                              size={17}
                            />
                          ) : (
                            `+${service.price} €`
                          )}
                        </span>
                      </button>
                    )
                  },
                )}
              </div>

              {dj &&
                djService?.active && (
                  <div className="service-config">
                    <FormField label="Precio DJ">
                      <div className="price-input">
                        <input
                          type="number"
                          min="0"
                          value={
                            djPrice
                          }
                          onChange={(
                            event,
                          ) =>
                            setDjPrice(
                              Math.max(
                                0,
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              ),
                            )
                          }
                        />

                        <span>
                          €
                        </span>
                      </div>
                    </FormField>
                  </div>
                )}

              {catering &&
                cateringService?.active && (
                  <div className="service-config catering-config">
                    <FormField label="Número de comensales">
                      <input
                        type="number"
                        min="1"
                        value={
                          cateringGuests
                        }
                        onChange={(
                          event,
                        ) =>
                          setCateringGuests(
                            Math.max(
                              0,
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                            ),
                          )
                        }
                      />
                    </FormField>

                    <FormField label="Precio por comensal">
                      <div className="price-input">
                        <input
                          type="number"
                          min="0"
                          value={
                            cateringPrice
                          }
                          onChange={(
                            event,
                          ) =>
                            setCateringPrice(
                              Math.max(
                                0,
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                              ),
                            )
                          }
                        />

                        <span>
                          €
                        </span>
                      </div>
                    </FormField>
                  </div>
                )}
            </section>

            {/* OBSERVACIONES */}

            <section className="form-card">
              <div className="form-card-heading">
                <div className="form-section-icon">
                  <FileText
                    size={20}
                  />
                </div>

                <div>
                  <h2>
                    Observaciones
                  </h2>

                  <p>
                    Información
                    adicional de la
                    reserva
                  </p>
                </div>
              </div>

              <div className="notes-form-grid">
                <FormField label="Observaciones del cliente">
                  <textarea
                    value={
                      customerNotes
                    }
                    onChange={(
                      event,
                    ) =>
                      setCustomerNotes(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Peticiones especiales, decoración, necesidades..."
                    rows={5}
                  />
                </FormField>

                <FormField label="Observaciones internas">
                  <textarea
                    value={
                      internalNotes
                    }
                    onChange={(
                      event,
                    ) =>
                      setInternalNotes(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Información exclusiva para administración..."
                    rows={5}
                  />
                </FormField>
              </div>
            </section>
          </div>

          {/* RESUMEN ECONÓMICO */}

          <aside className="reservation-summary-column">
            <section className="form-card price-summary-card">
              <div className="form-card-heading">
                <div className="form-section-icon">
                  <Euro size={20} />
                </div>

                <div>
                  <h2>
                    Resumen económico
                  </h2>

                  <p>
                    Precio calculado
                    automáticamente
                  </p>
                </div>
              </div>

              {selectedHoliday && (
                <div className="holiday-message">
                  <strong>
                    Día festivo
                  </strong>

                  <span>
                    {selectedHoliday}
                  </span>

                  <small>
                    Se aplicará tarifa
                    de festivo.
                  </small>
                </div>
              )}

              {dayInfo &&
                !dayInfo.holiday && (
                  <div className="day-info">
                    <span>
                      {
                        dayInfo.weekday
                      }
                    </span>

                    <strong>
                      {dayInfo.weekend
                        ? 'Tarifa de fin de semana'
                        : 'Tarifa de lunes a jueves'}
                    </strong>
                  </div>
                )}

              <div className="day-info">
                <span>Versión de tarifa</span>
                <strong>
                  Vigente desde {formatDate(
                    pricingVersion.effectiveFrom,
                  )}
                </strong>
              </div>

              <div className="summary-price-list">
                <SummaryPriceRow
                  label="Sala"
                  value={
                    pricing.room
                  }
                />

                <SummaryPriceRow
                  label="Limpieza"
                  value={
                    pricing.cleaning
                  }
                />

                {pricing.surcharge >
                  0 && (
                  <SummaryPriceRow
                    label="Suplemento de aforo"
                    value={
                      pricing.surcharge
                    }
                  />
                )}

                {pricing.dj >
                  0 && (
                  <SummaryPriceRow
                    label="DJ"
                    value={
                      pricing.dj
                    }
                  />
                )}

                {pricing.catering >
                  0 && (
                  <SummaryPriceRow
                    label="Catering"
                    value={
                      pricing.catering
                    }
                  />
                )}

                {pricing.services >
                  0 && (
                  <SummaryPriceRow
                    label="Otros servicios"
                    value={
                      pricing.services
                    }
                  />
                )}
              </div>

              <div className="summary-total">
                <span>
                  Total reserva
                </span>

                <strong>
                  {formatCurrency(
                    pricing.total,
                  )}
                </strong>
              </div>

              <div className="payment-preview">
                <div>
                  <span>
                    Importe pagado
                  </span>

                  <div className="payment-input">
                    <input
                      type="number"
                      min="0"
                      max={
                        pricing.total
                      }
                      value={
                        amountPaid
                      }
                      onChange={(
                        event,
                      ) =>
                        setAmountPaid(
                          Math.min(
                            Math.max(
                              0,
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                            ),
                            pricing.total,
                          ),
                        )
                      }
                    />

                    <span>
                      €
                    </span>
                  </div>
                </div>

                <div>
                  <span>
                    Pendiente
                  </span>

                  <strong>
                    {formatCurrency(
                      pending,
                    )}
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                className="save-reservation-button"
                disabled={
                  !canSubmit
                }
              >
                <Check size={18} />
                Crear reserva
              </button>

              {!canSubmit && (
                <p className="form-help">
                  Completa los campos
                  obligatorios y
                  selecciona al menos
                  un turno disponible.
                </p>
              )}
            </section>
          </aside>
        </div>
      </form>
    </div>
  )
}

type FormFieldProps = {
  label: string
  required?: boolean
  fullWidth?: boolean
  children: ReactNode
}

function FormField({
  label,
  required = false,
  fullWidth = false,
  children,
}: FormFieldProps) {
  return (
    <label
      className={`form-field ${
        fullWidth
          ? 'form-field-full'
          : ''
      }`}
    >
      <span>
        {label}

        {required && (
          <b> *</b>
        )}
      </span>

      {children}
    </label>
  )
}

type SummaryPriceRowProps = {
  label: string
  value: number
}

function SummaryPriceRow({
  label,
  value,
}: SummaryPriceRowProps) {
  return (
    <div className="summary-price-row">
      <span>
        {label}
      </span>

      <strong>
        {formatCurrency(value)}
      </strong>
    </div>
  )
}

function getShiftName(
  shift: ShiftType,
) {
  const names: Record<ShiftType, string> = {
    'turno-1': 'Turno 1',
    'turno-2': 'Turno 2',
    'turno-3': 'Turno 3',
  }

  return names[shift]
}

function formatDate(
  date: string,
) {
  return new Intl.DateTimeFormat(
    'es-ES',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    },
  ).format(
    new Date(
      `${date}T12:00:00`,
    ),
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

export default NewReservation