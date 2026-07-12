import { Router } from 'express'
import { createToken, hashPassword, verifyPassword, verifyToken } from '../auth.js'
import { pool } from '../db.js'

export const apiRouter = Router()

apiRouter.get('/status', (_req, res) => {
  res.json({
    app: 'BlackDate API',
    status: 'ready',
    timestamp: new Date().toISOString(),
  })
})

apiRouter.post('/auth/register', async (req, res, next) => {
  try {
    const name = required(req.body.name, 'name')
    const email = required(req.body.email, 'email').toLowerCase()
    const password = required(req.body.password, 'password')
    const phone = cleanOptional(req.body.phone)
    const gender = cleanOptional(req.body.gender)

    if (password.length < 4) {
      return res.status(400).json({ message: 'Mật khẩu cần tối thiểu 4 ký tự.' })
    }

    const result = await pool.query(
      `
        insert into users (name, email, phone, password_hash, role, status, gender)
        values ($1, $2, $3, $4, 'customer', 'active', $5)
        returning id, name, email, phone, role, status, avatar, gender, created_at
      `,
      [name, email, phone, hashPassword(password), gender],
    )
    const user = result.rows[0]
    res.status(201).json({ user, token: createToken(user) })
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'Email hoặc số điện thoại đã tồn tại.' })
      return
    }
    next(error)
  }
})

apiRouter.post('/auth/login', async (req, res, next) => {
  try {
    const identifier = required(req.body.identifier ?? req.body.email, 'identifier').toLowerCase()
    const password = required(req.body.password, 'password')
    const result = await pool.query(
      `
        select id, name, email, phone, password_hash, role, status, avatar, gender, created_at
        from users
        where deleted_at is null
          and (lower(email::text) = $1 or lower(name) = $1)
        limit 1
      `,
      [identifier],
    )
    const user = result.rows[0]
    if (!user || user.status !== 'active' || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' })
      return
    }

    await pool.query('update users set last_login_at = now() where id = $1', [user.id])
    delete user.password_hash
    res.json({ user, token: createToken(user) })
  } catch (error) {
    next(error)
  }
})

apiRouter.get('/auth/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

apiRouter.get('/app-data', async (_req, res, next) => {
  try {
    const result = await pool.query('select value, updated_at from app_settings where key = $1 limit 1', ['admin_data'])
    res.json({
      data: result.rows[0]?.value || null,
      updatedAt: result.rows[0]?.updated_at || null,
    })
  } catch (error) {
    next(error)
  }
})

apiRouter.put('/app-data', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const data = req.body?.data
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      res.status(400).json({ message: 'Dữ liệu quản lý không hợp lệ.' })
      return
    }

    const result = await pool.query(
      `
        insert into app_settings (key, value, updated_by)
        values ($1, $2::jsonb, $3)
        on conflict (key) do update
        set value = excluded.value,
            updated_by = excluded.updated_by,
            updated_at = now()
        returning value, updated_at
      `,
      ['admin_data', JSON.stringify(data), req.user.id],
    )

    res.json({ data: result.rows[0].value, updatedAt: result.rows[0].updated_at })
  } catch (error) {
    next(error)
  }
})

apiRouter.put('/auth/profile', requireAuth, async (req, res, next) => {
  try {
    const name = required(req.body.name, 'name')
    const email = required(req.body.email, 'email').toLowerCase()
    const phone = cleanOptional(req.body.phone)
    const gender = cleanOptional(req.body.gender)
    const avatar = cleanOptional(req.body.avatar)

    const result = await pool.query(
      `
        update users
        set name = $1,
            email = $2,
            phone = $3,
            gender = $4,
            avatar = $5,
            updated_at = now()
        where id = $6 and deleted_at is null
        returning id, name, email, phone, role, status, avatar, gender, created_at
      `,
      [name, email, phone, gender, avatar, req.user.id],
    )

    if (!result.rows[0]) {
      res.status(404).json({ message: 'Không tìm thấy tài khoản.' })
      return
    }

    res.json({ user: result.rows[0] })
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ message: 'Email hoặc số điện thoại đã tồn tại.' })
      return
    }
    next(error)
  }
})

apiRouter.post('/auth/logout', (_req, res) => {
  res.json({ ok: true })
})

apiRouter.get('/favorites', requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      'select item_id from user_favorite_items where user_id = $1 order by created_at desc',
      [req.user.id],
    )
    res.json({ ids: result.rows.map((row) => row.item_id) })
  } catch (error) {
    next(error)
  }
})

apiRouter.put('/favorites', requireAuth, async (req, res, next) => {
  const client = await pool.connect()
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((id) => String(id)).filter(Boolean) : []
    await client.query('begin')
    await client.query('delete from user_favorite_items where user_id = $1', [req.user.id])
    for (const id of [...new Set(ids)]) {
      await client.query(
        'insert into user_favorite_items (user_id, item_id) values ($1, $2) on conflict do nothing',
        [req.user.id, id],
      )
    }
    await client.query('commit')
    res.json({ ids: [...new Set(ids)] })
  } catch (error) {
    await client.query('rollback').catch(() => {})
    next(error)
  } finally {
    client.release()
  }
})

async function requireAuth(req, res, next) {
  try {
    const header = req.get('authorization') || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : ''
    const payload = verifyToken(token)
    if (!payload) {
      res.status(401).json({ message: 'Cần đăng nhập.' })
      return
    }

    const result = await pool.query(
      `
        select id, name, email, phone, role, status, avatar, gender, created_at
        from users
        where id = $1 and deleted_at is null
        limit 1
      `,
      [payload.id],
    )
    const user = result.rows[0]
    if (!user || user.status !== 'active') {
      res.status(401).json({ message: 'Tài khoản không hợp lệ.' })
      return
    }
    req.user = user
    next()
  } catch (error) {
    next(error)
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Bạn không có quyền quản lý dữ liệu này.' })
    return
  }
  next()
}

function required(value, field) {
  const text = String(value ?? '').trim()
  if (!text) {
    const error = new Error(`Missing ${field}`)
    error.status = 400
    throw error
  }
  return text
}

function cleanOptional(value) {
  const text = String(value ?? '').trim()
  return text || null
}
