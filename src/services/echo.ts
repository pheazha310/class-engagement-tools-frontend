import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import type { VoteUpdatedPayload } from '@/types/poll'

let echo: Echo | null = null

export function initializeEcho(): Echo {
  if (echo) return echo

  const options: Record<string, any> = {
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'local',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
    forceTLS: import.meta.env.VITE_PUSHER_SCHEME === 'https',
    wsHost: import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 6001,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  }

  if (import.meta.env.VITE_REVERB_APP_KEY) {
    options.broadcaster = 'reverb'
    options.key = import.meta.env.VITE_REVERB_APP_KEY
    options.secret = import.meta.env.VITE_REVERB_APP_SECRET
    options.appId = import.meta.env.VITE_REVERB_APP_ID
  }

  echo = new Echo({
    ...options,
    client: Pusher,
  })

  return echo
}

export function listenToPoll(
  pollId: number,
  callback: (payload: VoteUpdatedPayload) => void,
) {
  const instance = initializeEcho()
  const channelName = `poll.${pollId}`

  instance.private(channelName).listen('.VoteUpdated', (payload: VoteUpdatedPayload) => {
    callback(payload)
  })

  return () => {
    instance.leave(channelName)
  }
}

export function getEcho(): Echo | null {
  return echo
}
