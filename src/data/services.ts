export type ServiceCategory =
  | 'Animación'
  | 'Decoración'
  | 'Catering'
  | 'Entretenimiento'
  | 'Otros'

export type Service = {
  id: string
  name: string
  description: string
  price: number
  category: ServiceCategory
  active: boolean
}

const STORAGE_KEY = 'sa-blanca-services'

const defaultServices: Service[] = [
  {
    id: 'SER-001',
    name: 'Decoración',
    description:
      'Decoración temática del salón según el tipo de evento.',
    price: 150,
    category: 'Decoración',
    active: true,
  },
  {
    id: 'SER-002',
    name: 'Fotomatón',
    description:
      'Fotomatón con props e impresión instantánea.',
    price: 120,
    category: 'Entretenimiento',
    active: true,
  },
  {
    id: 'SER-003',
    name: 'Animación infantil',
    description:
      'Animación para niños con juegos y actividades.',
    price: 100,
    category: 'Animación',
    active: true,
  },
  {
    id: 'SER-004',
    name: 'Karaoke',
    description:
      'Equipo de karaoke con pantalla, micrófonos y canciones.',
    price: 80,
    category: 'Entretenimiento',
    active: true,
  },
  {
    id: 'SER-005',
    name: 'Castillo hinchable',
    description:
      'Castillo hinchable para actividades infantiles.',
    price: 130,
    category: 'Animación',
    active: true,
  },
  {
    id: 'SER-006',
    name: 'Máquina de algodón de azúcar',
    description:
      'Máquina de algodón de azúcar para el evento.',
    price: 60,
    category: 'Otros',
    active: true,
  },
  {
    id: 'SER-007',
    name: 'Monitor infantil',
    description:
      'Monitor para supervisión y actividades infantiles.',
    price: 90,
    category: 'Animación',
    active: true,
  },
  {
    id: 'SER-008',
    name: 'DJ',
    description:
      'Servicio de DJ con equipo de sonido e iluminación.',
    price: 180,
    category: 'Entretenimiento',
    active: true,
  },
  {
    id: 'SER-009',
    name: 'Catering',
    description:
      'Servicio de catering configurable según número de comensales.',
    price: 18,
    category: 'Catering',
    active: true,
  },
]

function hasStorage() {
  return typeof window !== 'undefined'
}

export function getServices(): Service[] {
  if (!hasStorage()) {
    return defaultServices
  }

  try {
    const stored = window.localStorage.getItem(
      STORAGE_KEY,
    )

    if (!stored) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultServices),
      )

      return defaultServices
    }

    const parsed = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return defaultServices
    }

    return parsed as Service[]
  } catch {
    return defaultServices
  }
}

export function saveServices(
  services: Service[],
) {
  if (!hasStorage()) {
    return
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(services),
  )

  window.dispatchEvent(
    new CustomEvent(
      'sa-blanca-services-updated',
    ),
  )
}

export function addService(
  service: Service,
) {
  const services = getServices()

  saveServices([
    ...services,
    service,
  ])
}

export function updateService(
  service: Service,
) {
  const services = getServices()

  saveServices(
    services.map((item) =>
      item.id === service.id
        ? service
        : item,
    ),
  )
}

export function deleteService(
  serviceId: string,
) {
  const services = getServices()

  saveServices(
    services.filter(
      (service) =>
        service.id !== serviceId,
    ),
  )
}

export function subscribeToServices(
  callback: () => void,
) {
  if (!hasStorage()) {
    return () => {}
  }

  const customEventHandler = () => {
    callback()
  }

  const storageEventHandler = (
    event: StorageEvent,
  ) => {
    if (
      event.key === STORAGE_KEY
    ) {
      callback()
    }
  }

  window.addEventListener(
    'sa-blanca-services-updated',
    customEventHandler,
  )

  window.addEventListener(
    'storage',
    storageEventHandler,
  )

  return () => {
    window.removeEventListener(
      'sa-blanca-services-updated',
      customEventHandler,
    )

    window.removeEventListener(
      'storage',
      storageEventHandler,
    )
  }
}

export function resetServices() {
  saveServices(defaultServices)
}