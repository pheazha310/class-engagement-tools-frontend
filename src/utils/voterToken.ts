const VOTER_TOKEN_KEY = 'vc2_voter_token'

function generateId(): string {
  const chars = 'abcdef0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function getVoterToken(): string {
  let token = localStorage.getItem(VOTER_TOKEN_KEY)
  if (!token) {
    token = generateId()
    localStorage.setItem(VOTER_TOKEN_KEY, token)
  }
  return token
}
