import Echo from 'laravel-echo'
// @ts-expect-error Pusher JS types
import Pusher from 'pusher-js'
import type { VoteUpdatedPayload } from '@/types/poll'

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

let echo: Echo | null = null

export function getEcho(): Echo {
  if (echo) return echo

  echo = new Echo({
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
