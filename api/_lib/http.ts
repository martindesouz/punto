import type { IncomingMessage, ServerResponse } from 'node:http'

// Handlers use the plain Node (req, res) signature so the same modules run
// as Vercel serverless functions and inside the Vite dev middleware.
export type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

export async function readJson<T>(req: IncomingMessage): Promise<T | null> {
  const preParsed = (req as IncomingMessage & { body?: unknown }).body
  if (preParsed !== undefined && preParsed !== null) return preParsed as T
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return null
  try {
    return JSON.parse(Buffer.concat(chunks).toString()) as T
  } catch {
    return null
  }
}

export function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

export function methodNotAllowed(res: ServerResponse): void {
  sendJson(res, 405, { error: 'method_not_allowed' })
}
