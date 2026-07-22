export interface Student {
  id: string
  name: string
  gender?: 'male' | 'female' | 'other'
}

export interface Group {
  id: string
  name: string
  students: Student[]
}

export type GenerationMethod = 'random' | 'balanced' | 'gender'

export interface GroupConfig {
  method: GenerationMethod
  target: 'groups' | 'size'
  quantity: number
  generateTeamNames: boolean
}