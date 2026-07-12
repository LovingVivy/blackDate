import { env } from '@/config/env'

const defaultHeaders = {
  'Content-Type': 'application/json',
}

export async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${env.apiBaseUrl}${path}`
  const auth = readAuth()
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(auth?.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(errorBody.message || `Request failed with status ${response.status}`)
  }

  return response.json()
}

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem('blackdate_auth') || 'null')
  } catch {
    return null
  }
}
