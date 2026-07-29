import { defineConfig, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

// Serves the Vercel serverless functions in /api during local dev, so
// `npm run dev` runs the full stack and the phone can hit one origin.
function apiDev(): Plugin {
  return {
    name: 'punto-api-dev',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (!path.startsWith('/api/')) return next()
        const route = path.slice('/api/'.length)
        if (!/^[a-z0-9/-]+$/.test(route) || route.includes('_')) {
          res.statusCode = 404
          return res.end('Not found')
        }
        try {
          const mod = await server.ssrLoadModule(`/api/${route}.ts`)
          await mod.default(req, res)
        } catch (err) {
          const notFound = err instanceof Error && /Failed to load|Cannot find/.test(err.message)
          res.statusCode = notFound ? 404 : 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: notFound ? 'not_found' : 'server_error' }))
          if (!notFound) server.config.logger.error(String(err))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDev()],
  server: {
    port: 5173,
    host: true, // reachable from the phone over LAN (Nimiq Pay webview)
    allowedHosts: true, // and through the public HTTPS tunnel for device testing
  },
})
