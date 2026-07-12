import crypto from 'node:crypto'

const key = process.env.AUTH_SECRET ?? 'blackdate-dev-secret'

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('base64url')
  const hash = crypto.scryptSync(String(password), salt, 64).toString('base64url')
  return `scrypt$${salt}$${hash}`
}

export function verifyPassword(password, storedHash) {
  const [algorithm, salt, hash] = String(storedHash || '').split('$')
  if (algorithm !== 'scrypt' || !salt || !hash) return false

  const expected = Buffer.from(hash, 'base64url')
  const actual = crypto.scryptSync(String(password), salt, expected.length)
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
}

export function createToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
    email: user.email,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(body)
  return `${body}.${signature}`
}

export function verifyToken(token) {
  const [body, signature] = String(token || '').split('.')
  if (!body || !signature || sign(body) !== signature) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

function sign(value) {
  return crypto.createHmac('sha256', key).update(value).digest('base64url')
}
