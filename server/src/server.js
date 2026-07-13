import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { apiRouter } from './routes/api.js'

export function createServer() {
  const app = express()
  const allowedOrigins = new Set([
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    ...String(process.env.CLIENT_ORIGIN || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ])

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
          callback(null, true)
          return
        }
        callback(new Error(`Origin not allowed by CORS: ${origin}`))
      },
    }),
  )
  app.use(express.json({ limit: '10mb' }))
  app.use(morgan('dev'))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', apiRouter)

  app.use((err, _req, res, _next) => {
    const status = err.status || 500
    res.status(status).json({
      message: status === 500 ? 'Server error' : err.message,
    })
  })

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' })
  })

  return app
}
