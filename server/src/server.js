import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { apiRouter } from './routes/api.js'

export function createServer() {
  const app = express()

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN ?? 'http://127.0.0.1:5173',
    }),
  )
  app.use(express.json())
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
