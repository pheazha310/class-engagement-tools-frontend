export interface Participant {
  id: string | number
  name: string
}

export interface WheelTheme {
  id: string
  name: string
  colors: string[]
  backgroundColor: string
  wheelBackground: string
  pointerColor: string
  pointerStroke: string
  textColor: string
  buttonGradient: [string, string]
  buttonShadow: string
  sliceStroke: string
  centerColor: string
}

export interface SavedWheel {
  id: string
  name: string
  description?: string | null
  color?: string | null
  participants: Participant[]
  created_at?: string
  updated_at?: string
}

export const defaultThemeId = 'default'

export const wheelThemes: WheelTheme[] = [
  {
    id: 'default',
    name: 'Default',
    colors: [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
      '#F1948A', '#85C1E9', '#AED6F1', '#A3E4D7',
    ],
    backgroundColor: '#f9fafb',
    wheelBackground: '#f1f5f9',
    pointerColor: '#e94560',
    pointerStroke: '#c0392b',
    textColor: '#1e293b',
    buttonGradient: ['#4f46e5', '#4338ca'],
    buttonShadow: 'rgba(79, 70, 229, 0.3)',
    sliceStroke: '#e2e8f0',
    centerColor: '#1e293b',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: [
      '#0077b6', '#0096c7', '#00b4d8', '#48cae4',
      '#90e0ef', '#023e8a', '#03045e', '#006d77',
      '#83c5be', '#e29578', '#00adb5', '#ffd166',
      '#118ab2', '#073b4c', '#8ecae6', '#219ebc',
    ],
    backgroundColor: '#f0f9ff',
    wheelBackground: '#e0f2fe',
    pointerColor: '#00fff5',
    pointerStroke: '#00adb5',
    textColor: '#0c4a6e',
    buttonGradient: ['#4f46e5', '#4338ca'],
    buttonShadow: 'rgba(79, 70, 229, 0.3)',
    sliceStroke: '#bae6fd',
    centerColor: '#0c4a6e',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: [
      '#ff595e', '#ffca3a', '#8ac926', '#1982c4',
      '#6a4c93', '#ff924c', '#ffcc33', '#36d399',
      '#f72585', '#b5179e', '#7209b7', '#560bad',
      '#480ca8', '#3a0ca3', '#3f37c9', '#4361ee',
    ],
    backgroundColor: '#fef3c7',
    wheelBackground: '#fde68a',
    pointerColor: '#ffcc33',
    pointerStroke: '#ff924c',
    textColor: '#78350f',
    buttonGradient: ['#4f46e5', '#4338ca'],
    buttonShadow: 'rgba(79, 70, 229, 0.3)',
    sliceStroke: '#fbbf24',
    centerColor: '#78350f',
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: [
      '#2d6a4f', '#40916c', '#52b788', '#74c69d',
      '#95d5b2', '#1b4332', '#081c15', '#b7e4c7',
      '#d8f3dc', '#bc4749', '#386641', '#6a994e',
      '#a7c957', '#6a994e', '#3a5a40', '#344e41',
    ],
    backgroundColor: '#f0fdf4',
    wheelBackground: '#dcfce7',
    pointerColor: '#15803d',
    pointerStroke: '#166534',
    textColor: '#065f46',
    buttonGradient: ['#4f46e5', '#4338ca'],
    buttonShadow: 'rgba(79, 70, 229, 0.3)',
    sliceStroke: '#86efac',
    centerColor: '#065f46',
  },
  {
    id: 'pastel',
    name: 'Pastel',
    colors: [
      '#ffb3c6', '#b5ead7', '#c7ceea', '#ffffd1',
      '#ff9aa2', '#e2f0cb', '#c5d3f6', '#ffdac1',
      '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7',
      '#c7ceea', '#ffffd1', '#ff9aa2', '#c5d3f6',
    ],
    backgroundColor: '#fdf4ff',
    wheelBackground: '#fae8ff',
    pointerColor: '#7c3aed',
    pointerStroke: '#6d28d9',
    textColor: '#581c87',
    buttonGradient: ['#4f46e5', '#4338ca'],
    buttonShadow: 'rgba(79, 70, 229, 0.3)',
    sliceStroke: '#d8b4fe',
    centerColor: '#581c87',
  },
  {
    id: 'neon',
    name: 'Neon',
    colors: [
      '#ff00ff', '#00ffff', '#ff00aa', '#00ff88',
      '#ffff00', '#ff6600', '#aa00ff', '#00aaff',
      '#ff0066', '#66ff00', '#ff6600', '#00ffcc',
      '#ff00ff', '#ffff00', '#00ffff', '#ff0066',
    ],
    backgroundColor: '#faf5ff',
    wheelBackground: '#f3e8ff',
    pointerColor: '#7c3aed',
    pointerStroke: '#6d28d9',
    textColor: '#4c1d95',
    buttonGradient: ['#4f46e5', '#4338ca'],
    buttonShadow: 'rgba(79, 70, 229, 0.3)',
    sliceStroke: '#d8b4fe',
    centerColor: '#4c1d95',
  },
]

export function getThemeById(id: string): WheelTheme | undefined {
  return wheelThemes.find((theme) => theme.id === id)
}
