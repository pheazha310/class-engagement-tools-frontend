import api from './api'
import type { Country, Province, District } from '@/types/location'

export const locationService = {
  async getCountries(): Promise<Country[]> {
    const { data } = await api.get('/api/countries')
    return data.data
  },

  async getProvinces(countryId: number): Promise<Province[]> {
    const { data } = await api.get('/api/provinces', { params: { country_id: countryId } })
    return data.data
  },

  async getDistricts(provinceId: number): Promise<District[]> {
    const { data } = await api.get('/api/districts', { params: { province_id: provinceId } })
    return data.data
  },
}
