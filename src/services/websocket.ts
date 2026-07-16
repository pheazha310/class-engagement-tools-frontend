import type Echo from 'laravel-echo'

declare global {
  interface Window {
    Echo?: Echo
  }
}

const getBroadcaster = (): 'reverb' | 'pusher' => {
  const connection = import.meta.env.VITE_BROADCAST_CONNECTION ?? 'reverb'
  const normalized = connection.toLowerCase().replace(/\s+/g, '')
  return normalized === 'pusher' ? 'pusher' : 'reverb'
}

async function createEchoInstance(): Promise<Echo> {
  const broadcaster = getBroadcaster()
  const { default: EchoClass } = await import('laravel-echo')

  if (broadcaster === 'pusher') {
    return new EchoClass({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY ?? 'local',
      wsHost: import.meta.env.VITE_PUSHER_HOST ?? '127.0.0.1',
      wsPort: Number(import.meta.env.VITE_PUSHER_PORT ?? 6001),
      forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
      authEndpoint: '/broadcasting/auth',
    }) as Echo
  }

  return new EchoClass({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY ?? 'local',
    wsHost: import.meta.env.VITE_REVERB_HOST ?? '127.0.0.1',
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
  }) as Echo
}

let echoInstance: Promise<Echo> | null = null

function getEcho(): Promise<Echo> {
  if (!echoInstance) {
    echoInstance = createEchoInstance().then((instance) => {
      if (typeof window !== 'undefined') {
        window.Echo = instance
      }
      return instance
    })
  }
  return echoInstance
}

export interface ScoreUpdatedPayload {
  gameSessionId: number
  participantId?: string
  participantName: string
  score: number
  pointsAwarded: number
  isCorrect: boolean
  questionId?: string
}

export type ScoreUpdatedHandler = (payload: ScoreUpdatedPayload) => void

export async function subscribeToGameSession(
  gameSessionId: number,
  handler: ScoreUpdatedHandler,
): Promise<() => void> {
  const echo = await getEcho()
  const channel = echo.private(`game-session.${gameSessionId}`)

  channel.listen('ScoreUpdated', (payload: ScoreUpdatedPayload) => {
    handler(payload)
  })

  return () => {
    channel.stopListening('.ScoreUpdated')
    echo.leaveChannel(`game-session.${gameSessionId}`)
  }
}

export async function disconnectEcho(): Promise<void> {
  const echo = await getEcho()
  Object.keys(echo.connector.channels || {}).forEach((channel) => {
    echo.leaveChannel(channel)
  })
  echoInstance = null
}
