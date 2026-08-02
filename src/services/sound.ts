import api from '@/services/api'

export interface Sound {
  id: string
  name: string
  audio_url: string
  category: string | null
  icon: string | null
  duration_seconds: number | null
  created_at: string
  updated_at: string
}

export interface SoundPlayHistory {
  id: string
  sound_id: string
  sound_name: string
  audio_url: string
  sound_category: string | null
  icon: string | null
  duration_seconds: number | null
  played_by: { id: string; name: string } | null
  played_at: string
  created_at: string
}

export interface PlaySoundResponse {
  message: string
  data: {
    soundId: string
    soundName: string
    audioUrl: string
    playedAt: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export async function fetchSounds(): Promise<Sound[]> {
  const { data } = await api.get('/api/sounds')
  return data.data
}

export async function playSound(soundId: string): Promise<PlaySoundResponse> {
  const { data } = await api.post(`/api/sounds/${soundId}/play`)
  return data
}

export async function fetchPlayHistory(page = 1, perPage = 50): Promise<PaginatedResponse<SoundPlayHistory>> {
  const { data } = await api.get('/api/sounds/history', {
    params: { page, per_page: perPage },
  })
  return data
}
