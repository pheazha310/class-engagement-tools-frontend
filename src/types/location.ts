export interface Country {
  id: number
  name: string
  code: string
}

export interface Province {
  id: number
  country_id: number
  name: string
}

export interface District {
  id: number
  province_id: number
  name: string
}

export interface School {
  id: number
  district_id: number
  name: string
  address: string | null
  latitude: string | null
  longitude: string | null
}

export interface SchoolRequestPayload {
  school_name: string
  email?: string
  address: string
  phone?: string
  notes?: string
}
