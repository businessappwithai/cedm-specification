import { createFileRoute } from '@tanstack/react-router'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000'

async function proxyToBackend(request: Request, path: string, method: string): Promise<Response> {
  const targetUrl = `${BACKEND_URL}/api/auth/${path}`
  const headers: Record<string, string> = {}
  const cookie = request.headers.get('cookie')
  const auth = request.headers.get('authorization')
  const contentType = request.headers.get('content-type')
  // Forward origin so better-auth CSRF check passes
  const origin = request.headers.get('origin') || 'http://localhost:3001'
  if (cookie) headers.cookie = cookie
  if (auth) headers.authorization = auth
  if (contentType) headers['content-type'] = contentType
  headers.origin = origin

  const init: RequestInit = { method, headers }
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    init.body = await request.text()
  }

  const upstream = await fetch(targetUrl, init)
  const body = await upstream.text()

  // Use Headers to support multiple Set-Cookie values
  const responseHeaders = new Headers()
  responseHeaders.set('content-type', upstream.headers.get('content-type') ?? 'application/json')
  // getSetCookie() returns each cookie separately (avoids comma-joining Set-Cookie values)
  const setCookies = typeof (upstream.headers as any).getSetCookie === 'function'
    ? (upstream.headers as any).getSetCookie() as string[]
    : [upstream.headers.get('set-cookie')].filter(Boolean) as string[]
  for (const c of setCookies) {
    responseHeaders.append('set-cookie', c)
  }

  return new Response(body, { status: upstream.status, headers: responseHeaders })
}

// `createAPIFileRoute` and `@tanstack/start/api` went away with the rename;
// server handlers now hang off `createFileRoute`. Same request/response
// contract, so the proxy body above is unchanged.
export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const path = (params as Record<string, string>)._splat ?? ''
        try {
          return await proxyToBackend(request, path, 'GET')
        } catch {
          // Backend unavailable — an empty session degrades to "logged out"
          // rather than surfacing a network error to the client.
          return new Response(JSON.stringify({ user: null, session: null }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
      POST: async ({ request, params }) => {
        const path = (params as Record<string, string>)._splat ?? ''
        try {
          return await proxyToBackend(request, path, 'POST')
        } catch {
          return new Response(JSON.stringify({ error: 'Auth service unavailable' }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
    },
  },
})
