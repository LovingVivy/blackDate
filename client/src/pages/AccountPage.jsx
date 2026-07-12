import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { loadAdminData, loadAdminDataFromApi, saveAdminData } from '@/data/adminStore'
import { request } from '@/services/httpClient'

const AUTH_KEY = 'blackdate_auth'

const navItems = [
  ['📊', 'Tổng quan', 'overview'],
  ['👤', 'Hồ sơ cá nhân', 'profile'],
  ['📅', 'Lịch hẹn', 'bookings'],
  ['💖', 'Yêu thích', 'favorites'],
  ['🔔', 'Thông báo', 'notifications'],
]

export function AccountPage() {
  const navigate = useNavigate()
  const [adminData, setAdminData] = useState(() => loadAdminData())
  const [auth, setAuth] = useState(() => readAuth())
  const [form, setForm] = useState(() => auth?.user || {})
  const [favoriteIds, setFavoriteIds] = useState(() => readFavorites(auth?.user))
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSaving, setSaving] = useState(false)

  const user = auth?.user
  const companions = useMemo(() => adminData.companions.filter((item) => item.status !== 'hidden'), [adminData])
  const userBookings = useMemo(() => filterBookings(adminData.bookings, user), [adminData.bookings, user])
  const favoriteCompanions = useMemo(
    () => companions.filter((person) => favoriteIds.includes(String(person.id))),
    [companions, favoriteIds],
  )
  const completedBookings = userBookings.filter((booking) => booking.status === 'completed').length
  const notifications = useMemo(() => createNotifications(user, favoriteCompanions.length), [user, favoriteCompanions.length])

  useEffect(() => {
    if (!auth?.token) navigate('/login')
  }, [auth, navigate])

  useEffect(() => {
    setFavoriteIds(readFavorites(user))
  }, [user])

  useEffect(() => {
    loadAdminDataFromApi()
      .then((data) => {
        if (!data) return
        setAdminData(data)
        saveAdminData(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    loadFavoritesFromApi()
      .then((ids) => {
        const localIds = readFavorites(user)
        const mergedIds = ids.length ? ids : localIds
        setFavoriteIds(mergedIds)
        saveFavorites(user, mergedIds)
        if (!ids.length && localIds.length) saveFavoritesToApi(localIds).catch(() => {})
      })
      .catch(() => {})
  }, [user])

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

  function removeFavorite(personId) {
    const nextFavorites = favoriteIds.filter((id) => id !== String(personId))
    setFavoriteIds(nextFavorites)
    saveFavorites(user, nextFavorites)
    saveFavoritesToApi(nextFavorites).catch(() => {})
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    navigate('/login')
  }

  if (!auth?.token || !user) return null

  return (
    <div className="account-shell">
      <aside className="account-sidebar">
        <div className="account-logo">
          <Link to="/">BlackDate</Link>
          <span>Trung tâm thành viên</span>
        </div>
        <div className="sidebar-user">
          <Avatar className="sidebar-user-img" user={form} />
          <div>
            <strong>{form.name || 'Tài khoản'}</strong>
            <span>{form.email || 'Chưa có email'}</span>
            <em>{roleLabel(form.role)}</em>
          </div>
        </div>
        <nav>
          <p>Tài khoản</p>
          {navItems.map(([icon, label, id], index) => (
            <a className={index === 0 ? 'active' : ''} href={`#${id}`} key={id}>
              <span>{icon}</span>
              {label}
              {id === 'bookings' && <small>{userBookings.length}</small>}
              {id === 'favorites' && <small>{favoriteCompanions.length}</small>}
            </a>
          ))}
        </nav>
        <div className="account-sidebar-footer">
          <Link to="/">← Trang chủ</Link>
          <button type="button" onClick={logout}>Đăng xuất</button>
        </div>
      </aside>

      <main className="account-main">
        <header className="account-topbar">
          <h1>Tổng quan</h1>
          <div>
            <span>{formatToday()}</span>
            <button aria-label="Thông báo">🔔</button>
          </div>
        </header>

        <div className="account-body">
          <section className="profile-hero" id="overview">
            <Avatar className="profile-hero-img" user={form} />
            <div>
              <h2>{form.name || 'Tài khoản'}</h2>
              <p>{form.email || form.phone || 'Chưa cập nhật liên hệ'}</p>
              <div>
                <span>💖 {roleLabel(form.role)}</span>
                <span>📅 Thành viên BlackDate</span>
              </div>
            </div>
            <div className="profile-hero-stats">
              <strong>{userBookings.length}</strong>
              <span>Lịch hẹn</span>
              <strong>{completedBookings}</strong>
              <span>Hoàn thành</span>
            </div>
          </section>

          <section className="cards-3">
            <StatCard label="Tổng lịch hẹn" value={userBookings.length} icon="📅" />
            <StatCard label="Yêu thích" value={favoriteCompanions.length} icon="💖" />
            <StatCard label="Thông báo" value={notifications.length} icon="🔔" />
          </section>

          <section className="cards-2" id="profile">
            <article className="info-card">
              <h3>Hồ sơ cá nhân</h3>
              <p className="account-card-note">Cập nhật tên, email, số điện thoại và icon hiển thị trên landing.</p>

              {error && <div className="login-error">{error}</div>}
              {message && <div className="profile-success">{message}</div>}

              <form onSubmit={saveProfile}>
                <div className="profile-avatar-editor account-avatar-editor">
                  <div className="profile-avatar-preview">
                    <Avatar user={form} />
                  </div>
                  <div>
                    <label>
                      Icon/avatar
                      <input
                        value={form.avatar || ''}
                        onChange={(event) => updateField('avatar', event.target.value)}
                        placeholder="BD, URL ảnh, hoặc upload file"
                      />
                    </label>
                    <input type="file" accept="image/*" onChange={(event) => handleAvatarFile(event.target.files?.[0])} />
                  </div>
                </div>

                <div className="form-row">
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
                <button className="btn-save" type="submit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </form>
            </article>

            <article className="info-card" id="notifications">
              <h3>Thông báo</h3>
              <div className="notif-list">
                {notifications.map(([icon, title, text]) => (
                  <div className="notif-item" key={title}>
                    <span>{icon}</span>
                    <div>
                      <strong>{title}</strong>
                      <p>{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="info-card" id="bookings">
            <h3>Lịch hẹn gần đây</h3>
            {userBookings.length > 0 ? (
              <div className="booking-list">
                {userBookings.map((booking) => (
                  <article className="booking-card" key={booking.id}>
                    <BookingImage companions={companions} booking={booking} />
                    <div>
                      <strong>{booking.companion}</strong>
                      <p>
                        {formatAppointment(booking.appointmentAt)} · {booking.meetingPlace || 'Chưa cập nhật địa điểm'}
                      </p>
                      <em>{formatStatus(booking.status)}</em>
                    </div>
                    <strong>{booking.total}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">Bạn chưa có lịch hẹn nào.</p>
            )}
          </section>

          <section className="info-card" id="favorites">
            <h3>Yêu thích</h3>
            {favoriteCompanions.length > 0 ? (
              <div className="favorites-grid">
                {favoriteCompanions.map((person) => (
                  <article className="fav-card" key={person.id}>
                    <button type="button" className="fav-remove" onClick={() => removeFavorite(person.id)} aria-label={`Bỏ yêu thích ${person.name}`}>
                      ×
                    </button>
                    <img src={person.image} alt={person.name} />
                    <strong>{person.name}</strong>
                    <span>⭐ {person.rating}</span>
                    <em>{person.price}</em>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-state">Bạn chưa thêm bạn đồng hành nào vào yêu thích.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function Avatar({ user, className = '' }) {
  const value = user?.avatar || initials(user?.name)
  if (isImage(value)) return <img className={className} src={value} alt={user?.name || 'Avatar'} />
  return <span className={className}>{value}</span>
}

function BookingImage({ companions, booking }) {
  const companion = companions.find((person) => person.name === booking.companion)
  return <img src={companion?.image || '/uploads/avatars/companions-1.jpg'} alt={booking.companion} />
}

function StatCard({ label, value, icon }) {
  return (
    <article className="stat-card">
      <span>{icon}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </article>
  )
}

function createNotifications(user, favoriteCount) {
  return [
    ['👋', 'Xin chào', `${user?.name || 'Bạn'} có thể chỉnh hồ sơ trực tiếp tại trang này.`],
    ['💖', 'Danh sách yêu thích', `Bạn đang có ${favoriteCount} bạn đồng hành trong danh sách yêu thích.`],
    ['⭐', 'Ưu đãi đặc biệt', 'Các gói nổi bật sẽ được cập nhật theo lịch hẹn của bạn.'],
  ]
}

function filterBookings(bookings, user) {
  if (!user) return []
  return bookings.filter((booking) => {
    const phoneMatch = user.phone && booking.phone === user.phone
    const nameMatch = user.name && booking.customerName === user.name
    return phoneMatch || nameMatch
  })
}

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}

function favoritesKey(user) {
  return `blackdate_favorites:${user?.id || user?.email || 'guest'}`
}

function readFavorites(user) {
  if (!user) return []
  try {
    return JSON.parse(localStorage.getItem(favoritesKey(user)) || '[]').map(String)
  } catch {
    return []
  }
}

function saveFavorites(user, ids) {
  if (!user) return
  localStorage.setItem(favoritesKey(user), JSON.stringify(ids.map(String)))
}

async function loadFavoritesFromApi() {
  const result = await request('/api/favorites')
  return Array.isArray(result.ids) ? result.ids.map(String) : []
}

async function saveFavoritesToApi(ids) {
  return request('/api/favorites', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}

function formatStatus(status) {
  const labels = {
    pending: 'Đang chờ',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  }
  return labels[status] || status
}

function formatAppointment(value) {
  if (!value) return 'Chưa cập nhật thời gian'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function formatToday() {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
}

function roleLabel(role) {
  return role === 'admin' ? 'Admin' : 'Thành viên'
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
