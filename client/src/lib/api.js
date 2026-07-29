import { contract } from '../../../shared/contract.js'

const API_URL = import.meta.env.VITE_API_URL

async function request(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) {
    const error = new Error(data.error?.message || 'Request failed')
    error.code = data.error?.code
    error.details = data.error?.details
    throw error
  }
  return data
}

export function getCatalog() {
  return request(contract.getCatalog.method, contract.getCatalog.path)
}

export function createSession(body) {
  return request(contract.createSession.method, contract.createSession.path, body)
}

export function updateSessionShell(sessionId, body) {
  const path = contract.updateSessionShell.path.replace(':id', sessionId)
  return request(contract.updateSessionShell.method, path, body)
}

export function logEvents(sessionId, events) {
  return request(contract.logEvent.method, contract.logEvent.path, { sessionId, events })
}
