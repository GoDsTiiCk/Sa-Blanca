export type ServiceCategory =
  | 'DJ'
  | 'Catering'
  | 'Decoración'
  | 'Fotomaton'
  | 'Animación'
  | 'Karaoke'
  | 'ble'
  | 'other'

export interface AdditionalService {
  id: string
  name: string
  description?: string
  category: ServiceCategory
  price: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface ReservationService {
  serviceId: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}