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
    backgroundColor: '#0f0f1a',
    wheelBackground: '#1a1a2e',
    pointerColor: '#e94560',
    pointerStroke: '#c0392b',
    textColor: '#ffffff',
    buttonGradient: ['#e94560', '#c0392b'],
    buttonShadow: 'rgba(233, 69, 96, 0.4)',
    sliceStroke: '#1a1a2e',
    centerColor: '#ffffff',
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
    backgroundColor: '#001219',
    wheelBackground: '#00262b',
    pointerColor: '#00fff5',
    pointerStroke: '#00adb5',
    textColor: '#e0fbfc',
    buttonGradient: ['#00b4d8', '#0077b6'],
    buttonShadow: 'rgba(0, 180, 216, 0.4)',
    sliceStroke: '#00262b',
    centerColor: '#e0fbfc',
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
    backgroundColor: '#1a0b0b',
    wheelBackground: '#2b1010',
    pointerColor: '#ffcc33',
    pointerStroke: '#ff924c',
    textColor: '#fff5e6',
    buttonGradient: ['#ff595e', '#ff924c'],
    buttonShadow: 'rgba(255, 89, 94, 0.4)',
    sliceStroke: '#2b1010',
    centerColor: '#fff5e6',
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
    backgroundColor: '#0b1a0f',
    wheelBackground: '#142e1a',
    pointerColor: '#95d5b2',
    pointerStroke: '#74c69d',
    textColor: '#d8f3dc',
    buttonGradient: ['#40916c', '#2d6a4f'],
    buttonShadow: 'rgba(64, 145, 108, 0.4)',
    sliceStroke: '#142e1a',
    centerColor: '#d8f3dc',
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
    backgroundColor: '#1a1a24',
    wheelBackground: '#222230',
    pointerColor: '#ff9aa2',
    pointerStroke: '#ffb7b2',
    textColor: '#3d3d4a',
    buttonGradient: ['#ffb3c6', '#c5d3f6'],
    buttonShadow: 'rgba(255, 179, 198, 0.35)',
    sliceStroke: '#222230',
    centerColor: '#3d3d4a',
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
    backgroundColor: '#050510',
    wheelBackground: '#0a0a1a',
    pointerColor: '#00ffff',
    pointerStroke: '#00aaff',
    textColor: '#ffffff',
    buttonGradient: ['#ff00ff', '#00ffff'],
    buttonShadow: 'rgba(0, 255, 255, 0.5)',
    sliceStroke: '#0a0a1a',
    centerColor: '#ffffff',
  },
]

export function getThemeById(id: string): WheelTheme | undefined {
  return wheelThemes.find((theme) => theme.id === id)
}
