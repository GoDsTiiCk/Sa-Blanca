import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Check,
  Edit3,
  MoreVertical,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import './Services.css'

import {
  addService,
  deleteService,
  getServices,
  saveServices,
  subscribeToServices,
  type Service,
  type ServiceCategory,
} from '../data/services'

type ServiceForm = {
  name: string
  description: string
  price: string
  category: ServiceCategory
  active: boolean
}

const categories: ServiceCategory[] = [
  'Animación',
  'Decoración',
  'Catering',
  'Entretenimiento',
  'Otros',
]

const emptyForm: ServiceForm = {
  name: '',
  description: '',
  price: '',
  category: 'Otros',
  active: true,
}

function Services() {
  const [services, setServices] =
    useState<Service[]>(getServices())

  const [search, setSearch] =
    useState('')

  const [categoryFilter, setCategoryFilter] =
    useState<'Todos' | ServiceCategory>(
      'Todos',
    )

  const [showModal, setShowModal] =
    useState(false)

  const [editingService, setEditingService] =
    useState<Service | null>(null)

  const [showDeleteModal, setShowDeleteModal] =
    useState<Service | null>(null)

  const [form, setForm] =
    useState<ServiceForm>(emptyForm)

  useEffect(() => {
    const refresh = () => {
      setServices(getServices())
    }

    const unsubscribe =
      subscribeToServices(refresh)

    return unsubscribe
  }, [])

  const filteredServices = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase()

    return services.filter((service) => {
      const matchesSearch =
        normalizedSearch === '' ||
        service.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        service.description
          .toLowerCase()
          .includes(normalizedSearch)

      const matchesCategory =
        categoryFilter === 'Todos' ||
        service.category === categoryFilter

      return (
        matchesSearch &&
        matchesCategory
      )
    })
  }, [
    services,
    search,
    categoryFilter,
  ])

  const activeCount =
    services.filter(
      (service) => service.active,
    ).length

  const inactiveCount =
    services.filter(
      (service) => !service.active,
    ).length

  const averagePrice =
    services.length > 0
      ? services.reduce(
          (total, service) =>
            total + service.price,
          0,
        ) / services.length
      : 0

  const openNewService = () => {
    setEditingService(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  const openEditService = (
    service: Service,
  ) => {
    setEditingService(service)

    setForm({
      name: service.name,
      description: service.description,
      price: String(service.price),
      category: service.category,
      active: service.active,
    })

    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
    setForm(emptyForm)
  }

  const handleFormChange = (
    field: keyof ServiceForm,
    value: string | boolean,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSave = () => {
    const name =
      form.name.trim()

    const description =
      form.description.trim()

    const price =
      Number(form.price)

    if (!name) {
      alert(
        'Introduce el nombre del servicio.',
      )
      return
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      alert(
        'Introduce un precio válido.',
      )
      return
    }

    if (editingService) {
      const updatedService: Service = {
        ...editingService,
        name,
        description,
        price,
        category:
          form.category,
        active: form.active,
      }

      const updatedServices =
        services.map((service) =>
          service.id ===
          editingService.id
            ? updatedService
            : service,
        )

      setServices(updatedServices)
      saveServices(updatedServices)
    } else {
      const newService: Service = {
        id: `SER-${Date.now()}`,
        name,
        description,
        price,
        category:
          form.category,
        active: form.active,
      }

      const updatedServices = [
        ...services,
        newService,
      ]

      setServices(updatedServices)
      addService(newService)
    }

    closeModal()
  }

  const handleToggle = (
    service: Service,
  ) => {
    const updatedServices =
      services.map((item) =>
        item.id === service.id
          ? {
              ...item,
              active: !item.active,
            }
          : item,
      )

    setServices(updatedServices)
    saveServices(updatedServices)
  }

  const handleDelete = () => {
    if (!showDeleteModal) {
      return
    }

    const updatedServices =
      services.filter(
        (service) =>
          service.id !==
          showDeleteModal.id,
      )

    setServices(updatedServices)
    deleteService(
      showDeleteModal.id,
    )

    setShowDeleteModal(null)
  }

  return (
    <div className="services-page">
      <section className="services-page-header">
        <div>
          <p className="services-eyebrow">
            CONFIGURACIÓN
          </p>

          <h1>
            Servicios adicionales
          </h1>

          <p className="services-description">
            Gestiona los servicios que
            puedes añadir a las reservas
            de Sa Blanca.
          </p>
        </div>

        <button
          type="button"
          className="services-new-button"
          onClick={
            openNewService
          }
        >
          <Plus size={17} />
          Nuevo servicio
        </button>
      </section>

      <section className="services-stats">
        <div className="service-stat">
          <div className="service-stat-value primary">
            {services.length}
          </div>

          <span>
            Servicios configurados
          </span>
        </div>

        <div className="service-stat">
          <div className="service-stat-value success">
            {activeCount}
          </div>

          <span>
            Servicios activos
          </span>
        </div>

        <div className="service-stat">
          <div className="service-stat-value warning">
            {inactiveCount}
          </div>

          <span>
            Servicios inactivos
          </span>
        </div>

        <div className="service-stat">
          <div className="service-stat-value purple">
            {formatCurrency(
              averagePrice,
            )}
          </div>

          <span>
            Precio medio
          </span>
        </div>
      </section>

      <section className="services-toolbar">
        <div className="services-search">
          <Search size={16} />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Buscar servicio..."
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
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(
              event.target.value as
                | 'Todos'
                | ServiceCategory,
            )
          }
        >
          <option value="Todos">
            Todas las categorías
          </option>

          {categories.map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ),
          )}
        </select>
      </section>

      <section className="services-grid">
        {filteredServices.length ===
        0 ? (
          <div className="services-empty">
            <div className="services-empty-icon">
              <Search size={22} />
            </div>

            <h3>
              No hay servicios
            </h3>

            <p>
              No hemos encontrado
              servicios con los filtros
              seleccionados.
            </p>
          </div>
        ) : (
          filteredServices.map(
            (service) => (
              <article
                key={service.id}
                className={`service-card ${
                  !service.active
                    ? 'inactive'
                    : ''
                }`}
              >
                <div className="service-card-header">
                  <div className="service-icon">
                    <Star
                      size={20}
                      strokeWidth={1.8}
                    />
                  </div>

                  <div className="service-card-actions">
                    <button
                      type="button"
                      onClick={() =>
                        openEditService(
                          service,
                        )
                      }
                      aria-label={`Editar ${service.name}`}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setShowDeleteModal(
                          service,
                        )
                      }
                      aria-label={`Eliminar ${service.name}`}
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      type="button"
                      className="service-more"
                      aria-label="Más opciones"
                    >
                      <MoreVertical
                        size={17}
                      />
                    </button>
                  </div>
                </div>

                <div className="service-card-body">
                  <div className="service-card-title-row">
                    <h2>
                      {service.name}
                    </h2>

                    <span
                      className={`service-status ${
                        service.active
                          ? 'active'
                          : 'inactive'
                      }`}
                    >
                      {service.active
                        ? 'Activo'
                        : 'Inactivo'}
                    </span>
                  </div>

                  <p>
                    {service.description ||
                      'Sin descripción'}
                  </p>
                </div>

                <div className="service-card-footer">
                  <strong>
                    {formatCurrency(
                      service.price,
                    )}
                  </strong>

                  <span>
                    {service.category}
                  </span>
                </div>

                <button
                  type="button"
                  className={`service-toggle ${
                    service.active
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleToggle(
                      service,
                    )
                  }
                >
                  <span className="service-toggle-dot" />

                  {service.active
                    ? 'Servicio activo'
                    : 'Servicio inactivo'}
                </button>
              </article>
            ),
          )
        )}
      </section>

      {showModal && (
        <div
          className="service-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal()
            }
          }}
        >
          <div className="service-modal">
            <div className="service-modal-header">
              <div>
                <p>
                  CONFIGURACIÓN
                </p>

                <h2>
                  {editingService
                    ? 'Editar servicio'
                    : 'Nuevo servicio'}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeModal
                }
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                handleSave()
              }}
            >
              <div className="service-form-group">
                <label htmlFor="service-name">
                  Nombre del servicio
                </label>

                <input
                  id="service-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleFormChange(
                      'name',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Ej. Decoración"
                />
              </div>

              <div className="service-form-group">
                <label htmlFor="service-description">
                  Descripción
                </label>

                <textarea
                  id="service-description"
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    handleFormChange(
                      'description',
                      event.target
                        .value,
                    )
                  }
                  placeholder="Describe el servicio..."
                  rows={4}
                />
              </div>

              <div className="service-form-grid">
                <div className="service-form-group">
                  <label htmlFor="service-price">
                    Precio
                  </label>

                  <div className="price-input">
                    <input
                      id="service-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        handleFormChange(
                          'price',
                          event.target
                            .value,
                        )
                      }
                      placeholder="0,00"
                    />

                    <span>
                      €
                    </span>
                  </div>
                </div>

                <div className="service-form-group">
                  <label htmlFor="service-category">
                    Categoría
                  </label>

                  <select
                    id="service-category"
                    value={
                      form.category
                    }
                    onChange={(event) =>
                      handleFormChange(
                        'category',
                        event.target
                          .value as ServiceCategory,
                      )
                    }
                  >
                    {categories.map(
                      (category) => (
                        <option
                          key={category}
                          value={
                            category
                          }
                        >
                          {category}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <label className="service-active-check">
                <input
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={(event) =>
                    handleFormChange(
                      'active',
                      event.target
                        .checked,
                    )
                  }
                />

                Servicio activo
              </label>

              <div className="service-modal-actions">
                <button
                  type="button"
                  className="service-cancel-button"
                  onClick={
                    closeModal
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="service-save-button"
                >
                  <Check
                    size={15}
                  />

                  {editingService
                    ? 'Guardar cambios'
                    : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="service-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowDeleteModal(
                null,
              )
            }
          }}
        >
          <div className="delete-modal">
            <div className="delete-modal-icon">
              <Trash2
                size={21}
              />
            </div>

            <h2>
              Eliminar servicio
            </h2>

            <p>
              ¿Seguro que quieres
              eliminar{' '}
              <strong>
                {showDeleteModal.name}
              </strong>
              ? Esta acción no se puede
              deshacer.
            </p>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="service-cancel-button"
                onClick={() =>
                  setShowDeleteModal(
                    null,
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="service-delete-button"
                onClick={
                  handleDelete
                }
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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

export default Services