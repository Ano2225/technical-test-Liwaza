/// <reference types="vite/client" />
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  tool_called?: string
  data?: ToolData
  timestamp: string
}

export type ToolData =
  | TimeSeriesData
  | CountryProfileData
  | SearchResultData
  | ErrorData

export interface TimeSeriesData {
  indicator: { id: string; name: string; country: string }
  total: number
  per_page: number
  page: number
  pages: number
  data: Array<{ year: string; value: number | null }>
}

export interface CountryProfileData {
  id: string
  name: string
  capital_city: string
  region: string
  income_level: string
  longitude: string
  latitude: string
}

export interface SearchResultData {
  total: number
  indicators: Array<{ id: string; name: string; source: string; topics: string[] }>
}

export interface ErrorData {
  error: string
  code: number
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function fetchToken(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: 'frontend-demo' }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

async function getToken(): Promise<string> {
  const stored = localStorage.getItem('ivoire_token')
  if (stored) return stored
  const token = await fetchToken()
  localStorage.setItem('ivoire_token', token)
  return token
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken()
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) {
    // Token expired — clear and retry once
    localStorage.removeItem('ivoire_token')
    const fresh = await getToken()
    return fetch(url, {
      ...options,
      headers: { ...(options.headers ?? {}), Authorization: `Bearer ${fresh}` },
    })
  }
  return res
}

// ── Chat ──────────────────────────────────────────────────────────────────────

interface ApiChatResponse {
  reply: string
  tool_calls: Array<{ tool: string; input: Record<string, unknown>; result: ToolData }>
}

export async function sendMessage(
  message: string,
  history: ChatMessage[],
): Promise<ChatMessage> {
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ]

  const res = await fetchWithAuth(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Erreur ${res.status}: ${body}`)
  }

  const data = await res.json() as ApiChatResponse
  const firstCall = data.tool_calls?.[0]

  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    content: data.reply,
    tool_called: firstCall?.tool,
    data: firstCall?.result,
    timestamp: new Date().toISOString(),
  }
}

export function makeUserMessage(content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    timestamp: new Date().toISOString(),
  }
}
