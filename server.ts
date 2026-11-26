import express from 'express'
import { createServer as createViteServer } from 'vite'
import path from 'path'

async function startServer() {
  const app = express()
  const PORT = Number(process.env.PORT) || 3000

  // Serve static assets from public directory with range support (for mobile audio streaming)
  const publicDir = path.resolve(process.cwd(), 'public')
  app.use(express.static(publicDir, { acceptRanges: true }))

  // Development vs Production
  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist')
    app.use(express.static(distDir))
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'))
    })
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`)
  })
}

void startServer()
