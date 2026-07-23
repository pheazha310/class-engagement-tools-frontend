import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

let echo: Echo<any> | null = null

export function getEcho(): Echo<any> {
  if (echo) return echo

  const originalError = console.error.bind(console)
  console.error = (...args: unknown[]) => {
    const message = args[0]
    if (typeof message === 'string' && message.includes('WebSocket connection to')) {
      return
    }
    originalError(...args)
  }

  const instance = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY ?? 'app-key',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1',
    wsHost: import.meta.env.VITE_REVERB_HOST ?? window.location.hostname,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
    wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 443),
    wsPath: '',
    forceTLS: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
  })

  console.error = originalError

  instance.connector.pusher.connection.bind('error', (err: any) => {
    if (err && err.error && err.error.type === 'WebSocketConnectionFailed') {
      console.debug('Broadcast WS unavailable; local playback still works.')
    }
  })

  echo = instance
  return echo
}

export function destroyEcho(): void {
  if (echo) {
    echo.disconnect()
    echo = null
  }
}

export function listenToPoll(pollId: number, callback: (data: any) => void): () => void {
  try {
    const echoInstance = getEcho()
    const channel = echoInstance.private(`poll.${pollId}`)
    channel.listen('VoteUpdated', (data: any) => {
      callback(data)
    })
    return () => {
      channel.stopListening('VoteUpdated')
      try {
        echoInstance.leaveChannel(`poll.${pollId}`)
      } catch {
        // ignore
      }
    }
  } catch {
    // Echo not available
    return () => {}
  }
}
