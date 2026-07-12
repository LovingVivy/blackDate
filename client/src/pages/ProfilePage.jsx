import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { request } from '@/services/httpClient'

const AUTH_KEY = 'blackdate_auth'

export function ProfilePage() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState(() => readAuth())
  const [form, setForm] = useState(() => auth?.user || {})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSaving, setSaving] = useState(false)

  useEffect(() => {
    if (!auth?.token) navigate('/login')
  }, [auth, navigate])

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleAvatarFile(file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      updateField('avatar', reader.result)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  async function saveProfile(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setSaving(true)

    try {
      const result = await request('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          gender: form.gender,
          avatar: form.avatar,
        }),
      })
      const nextAuth = { ...auth, user: result.user }
      localStorage.setItem(AUTH_KEY, JSON.stringify(nextAuth))
      setAuth(nextAuth)
      setForm(result.user)
      setMessage('Đã cập nhật hồ sơ.')
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu hồ sơ.')
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    navigate('/login')
  }

  if (!auth?.token) return null

  return (
    <main className="profile-page">
      <section className="profile-edit-shell">
        <div className="profile-edit-hero">
          <Link className="profile-back" to="/">
            ← Trang chủ
          </Link>
          <div className="profile-avatar-large">
            {isImage(form.avatar) ? <img src={form.avatar} alt={form.name} /> : <span>{form.avatar || initials(form.name)}</span>}
          </div>
          <div>
            <p>Hồ sơ</p>
            <h1>{form.name || 'Tài khoản'}</h1>
            <span>{form.email}</span>
          </div>
        </div>

        <form className="profile-edit-card" onSubmit={saveProfile}>
          <div>
            <h2>Thông tin người dùng</h2>
            <p>Cập nhật tên, email, số điện thoại và icon hiển thị trên landing.</p>
          </div>

          {error && <div className="login-error">{error}</div>}
          {message && <div className="profile-success">{message}</div>}

          <div className="profile-avatar-editor">
            <div className="profile-avatar-preview">
              {isImage(form.avatar) ? <img src={form.avatar} alt={form.name} /> : <span>{form.avatar || initials(form.name)}</span>}
            </div>
            <div>
              <label>
                Icon/avatar
                <input value={form.avatar || ''} onChange={(event) => updateField('avatar', event.target.value)} placeholder="BD, URL ảnh, hoặc upload file" />
              </label>
              <input type="file" accept="image/*" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              Họ và tên
              <input value={form.name || ''} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <label>
              Email
              <input type="email" value={form.email || ''} onChange={(event) => updateField('email', event.target.value)} />
            </label>
            <label>
              Số điện thoại
              <input value={form.phone || ''} onChange={(event) => updateField('phone', event.target.value)} />
            </label>
            <label>
              Giới tính
              <select value={form.gender || 'other'} onChange={(event) => updateField('gender', event.target.value)}>
                <option value="other">Khác</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
            </label>
          </div>

          <div className="profile-actions">
            <button type="button" onClick={logout}>
              Đăng xuất
            </button>
            <button className="btn-save" type="submit" disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}

function initials(name) {
  return String(name || 'BD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function isImage(value) {
  return typeof value === 'string' && (value.startsWith('/') || value.startsWith('data:image/') || value.startsWith('http'))
}
