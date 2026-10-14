/**
 * Backend API client — talks ONLY to the NGPL registration Apps Script web app
 * configured in VITE_BACKEND_URL. Contains no secrets.
 *
 * There is deliberately NO local/offline fallback: if the backend is missing or
 * fails, the caller receives an error and must NOT tell the user it was saved.
 */
import type { ApiResult, BackendHealth } from '../types/registration'

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() || ''
const TIMEOUT_MS = 30000

export const isBackendConfigured = (): boolean => BACKEND_URL.length > 0

/** Exact configuration needed when the site was built without a backend URL. */
export const CONFIG_HELP =
  'VITE_BACKEND_URL is not set. Set it to the Google Apps Script Web app URL ' +
  '(https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec) in a .env file for local development, ' +
  'or in your hosting provider\'s environment variables, then restart the dev server / rebuild and redeploy. ' +
  'See SETUP_GOOGLE_SHEETS.md.'

export const NOT_CONFIGURED_MESSAGE =
  'Online registration is not available right now (registration server not configured). Nothing has been saved. Please contact the organizers.' +
  (import.meta.env.DEV ? ` [Developer: ${CONFIG_HELP}]` : '')

if (!BACKEND_URL) {
  // Visible to the site operator in the browser console, even in production builds.
  console.error(`[NGPL] Registration backend not configured. ${CONFIG_HELP}`)
}

export function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

export type HealthCheck =
  | { state: 'not-configured'; problems: string[] }
  | { state: 'unreachable'; problems: string[] }
  | { state: 'misconfigured'; problems: string[]; health: BackendHealth }
  | { state: 'ready'; problems: string[]; health: BackendHealth }

/** GET ?action=health — reports missing server configuration (never secrets). */
export async function checkBackendHealth(): Promise<HealthCheck> {
  if (!isBackendConfigured()) return { state: 'not-configured', problems: [CONFIG_HELP] }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const sep = BACKEND_URL.includes('?') ? '&' : '?'
    const res = await fetch(`${BACKEND_URL}${sep}action=health`, { redirect: 'follow', signal: controller.signal })
    const json = (await res.json()) as BackendHealth
    if (json?.service !== 'ngpl-registration-backend') {
      return { state: 'unreachable', problems: ['VITE_BACKEND_URL does not point to the NGPL registration web app (unexpected health response).'] }
    }
    const problems = Array.isArray(json.problems) ? json.problems : []
    return json.ready ? { state: 'ready', problems, health: json } : { state: 'misconfigured', problems, health: json }
  } catch {
    return {
      state: 'unreachable',
      problems: [
        'Could not reach the registration server at VITE_BACKEND_URL. Check that the Apps Script is deployed as a Web app with "Execute as: Me" and "Who has access: Anyone", and that the URL ends in /exec.',
      ],
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function callBackend<T>(action: string, payload: Record<string, unknown>): Promise<ApiResult<T>> {
  if (!isBackendConfigured()) {
    return { ok: false, code: 'NOT_CONFIGURED', error: NOT_CONFIGURED_MESSAGE }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    // text/plain avoids a CORS preflight, which Apps Script web apps do not support.
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!res.ok) {
      return { ok: false, code: 'HTTP_ERROR', error: `Registration server error (HTTP ${res.status}). Nothing was saved — please try again.` }
    }
    let json: Record<string, unknown>
    try {
      json = await res.json()
    } catch {
      return { ok: false, code: 'BAD_RESPONSE', error: 'Unexpected response from the registration server. Nothing was confirmed — please try again.' }
    }
    if (json.ok !== true) {
      return {
        ok: false,
        code: (json.code as string) || 'ERROR',
        error: (json.error as string) || 'The registration server rejected the request.',
        fieldErrors: json.fieldErrors as Record<string, string> | undefined,
      }
    }
    return { ok: true, data: json as T }
  } catch (err) {
    const aborted = (err as Error)?.name === 'AbortError'
    return {
      ok: false,
      code: aborted ? 'TIMEOUT' : 'NETWORK',
      error: aborted
        ? 'The registration server took too long to respond. Your submission may not have been saved — check your status before retrying.'
        : 'Could not reach the registration server. Check your internet connection. Nothing was confirmed as saved.',
    }
  } finally {
    clearTimeout(timer)
  }
}
