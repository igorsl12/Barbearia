export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  role: 'client' | 'admin'
}

export interface Service {
  id: string
  name: string
  duration: number
  price: number
  active: boolean
}

export interface Appointment {
  id: string
  client_id: string
  service_id: string
  date: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  hidden_by_client: boolean
  hidden_by_admin: boolean
  profiles?: Pick<Profile, 'full_name' | 'email'>
  services?: Pick<Service, 'name' | 'duration' | 'price'>
}

export interface DayHours {
  open: string
  close: string
}

export interface BusinessConfig {
  id: string
  business_name: string
  logo_url: string | null
  address: string | null
  address_number: string | null
  address_city: string | null
  address_state: string | null
  phone: string | null
  instagram: string | null
  whatsapp: string | null
  opening_time: string
  closing_time: string
  slot_interval: number
  auto_confirm: boolean
  lunch_start: string | null
  lunch_end: string | null
  working_days: number[] // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  day_hours: Record<string, DayHours> // key = day number as string
}

export type BookingStep = 'service' | 'date' | 'time' | 'confirm'
