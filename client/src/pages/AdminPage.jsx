import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { createDefaultAdminData, loadAdminData, loadAdminDataFromApi, saveAdminData, saveAdminDataToApi } from '@/data/adminStore'
import { request } from '@/services/httpClient'

const schemas = {
  users: {
    label: 'Tài khoản',
    note: 'Quản lý tài khoản khách hàng và admin.',
    columns: ['avatar', 'name', 'email', 'phone', 'role', 'status'],
    fields: [
      { key: 'avatar', label: 'Avatar hoặc ảnh', type: 'image' },
      { key: 'name', label: 'Họ và tên', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Số điện thoại', type: 'text' },
      { key: 'role', label: 'Vai trò', type: 'select', options: ['customer', 'admin'] },
      { key: 'status', label: 'Trạng thái', type: 'select', options: ['active', 'locked'] },
      { key: 'password', label: 'Mật khẩu mới (demo)', type: 'password', full: true },
    ],
  },
  companions: {
    label: 'Bạn đồng hành',
    note: 'Sửa hồ sơ, ảnh, giá, tag, huy hiệu và trạng thái hiển thị.',
    columns: ['image', 'name', 'fullName', 'birthDate', 'height', 'weight', 'measurements', 'price', 'status'],
    fields: [
      { key: 'image', label: 'Ảnh đại diện', type: 'image', full: true },
      { key: 'name', label: 'Tên', type: 'text' },
      { key: 'fullName', label: 'Họ và tên', type: 'text' },
      { key: 'birthDate', label: 'Ngày tháng năm sinh', type: 'date' },
      { key: 'height', label: 'Chiều cao', type: 'text' },
      { key: 'weight', label: 'Cân nặng', type: 'text' },
      { key: 'measurements', label: 'Số đo 3 vòng', type: 'text' },
      { key: 'price', label: 'Giá', type: 'text' },
      { key: 'rating', label: 'Điểm đánh giá', type: 'number', step: '0.1' },
      { key: 'reviews', label: 'Số lượt đánh giá', type: 'number' },
      { key: 'badge', label: 'Huy hiệu', type: 'text' },
      { key: 'badgeClass', label: 'Loại huy hiệu', type: 'select', options: ['', 'hot', 'new'] },
      { key: 'tags', label: 'Tags, cách nhau bằng dấu phẩy', type: 'list', full: true },
      { key: 'interests', label: 'Sở thích', type: 'textarea', full: true },
      { key: 'desc', label: 'Mô tả', type: 'textarea', full: true },
      { key: 'bg', label: 'Nền CSS', type: 'text', full: true },
      { key: 'status', label: 'Trạng thái', type: 'select', options: ['available', 'busy', 'hidden'] },
    ],
  },
  plans: {
    label: 'Gói dịch vụ',
    note: 'Quản lý tên gói, giá, thời lượng, tính năng và trạng thái.',
    columns: ['icon', 'name', 'price', 'duration', 'featured', 'status'],
    fields: [
      { key: 'icon', label: 'Icon', type: 'text' },
      { key: 'name', label: 'Tên gói', type: 'text' },
      { key: 'price', label: 'Giá', type: 'text' },
      { key: 'duration', label: 'Thời lượng', type: 'text' },
      { key: 'desc', label: 'Mô tả', type: 'textarea', full: true },
      { key: 'features', label: 'Tính năng, cách nhau bằng dấu phẩy', type: 'list', full: true },
      { key: 'featured', label: 'Gói nổi bật', type: 'checkbox' },
      { key: 'status', label: 'Trạng thái', type: 'select', options: ['active', 'hidden'] },
    ],
  },
  rentProps: {
    label: 'Rent Props',
    note: 'Quản lý đạo cụ cho thuê trong carousel landing page.',
    columns: ['emoji', 'category', 'name', 'price', 'unit', 'rating', 'status'],
    fields: [
      { key: 'emoji', label: 'Icon/emoji', type: 'text' },
      { key: 'category', label: 'Danh mục', type: 'text' },
      { key: 'name', label: 'Tên sản phẩm', type: 'text', full: true },
      { key: 'price', label: 'Giá thuê', type: 'text' },
      { key: 'unit', label: 'Đơn vị', type: 'text' },
      { key: 'rating', label: 'Đánh giá', type: 'number', step: '0.1' },
      { key: 'bg', label: 'Màu nền CSS', type: 'text', full: true },
      { key: 'status', label: 'Trạng thái', type: 'select', options: ['active', 'hidden'] },
    ],
  },
  rentHero: {
    label: 'Rent Hero',
    note: 'Sửa nội dung khu vực giới thiệu Rent Props.',
    singleton: true,
    columns: ['image', 'eyebrow', 'title', 'subtitle', 'highlight'],
    fields: [
      { key: 'image', label: 'Ảnh nền', type: 'image', full: true },
      { key: 'eyebrow', label: 'Nhãn nhỏ', type: 'text' },
      { key: 'title', label: 'Tiêu đề lớn', type: 'text' },
      { key: 'subtitle', label: 'Tiêu đề phải', type: 'text' },
      { key: 'highlight', label: 'Dòng nhấn', type: 'text' },
      { key: 'desc', label: 'Mô tả', type: 'textarea', full: true },
      { key: 'dragHint', label: 'Hướng dẫn kéo', type: 'text', full: true },
    ],
  },
  promo: {
    label: 'Promo Popup',
    note: 'Sửa popup ưu đãi trên landing page.',
    singleton: true,
    columns: ['image', 'name', 'price', 'oldPrice', 'countdownSec', 'status'],
    fields: [
      { key: 'image', label: 'Ảnh promo', type: 'image', full: true },
      { key: 'ribbon', label: 'Ribbon', type: 'text', full: true },
      { key: 'badge', label: 'Badge ảnh', type: 'text' },
      { key: 'name', label: 'Tên hiển thị', type: 'text' },
      { key: 'tag1', label: 'Tag 1', type: 'text' },
      { key: 'tag2', label: 'Tag 2', type: 'text' },
      { key: 'rating', label: 'Đánh giá hiển thị', type: 'text' },
      { key: 'desc', label: 'Mô tả', type: 'textarea', full: true },
      { key: 'price', label: 'Giá mới', type: 'text' },
      { key: 'unit', label: 'Đơn vị', type: 'text' },
      { key: 'oldPrice', label: 'Giá cũ', type: 'text' },
      { key: 'countdownSec', label: 'Đếm ngược (giây)', type: 'number' },
      { key: 'status', label: 'Trạng thái', type: 'select', options: ['active', 'hidden'] },
    ],
  },
  bookings: {
    label: 'Lịch đặt',
    note: 'Theo dõi và cập nhật lịch hẹn.',
    columns: ['customerName', 'phone', 'companion', 'plan', 'appointmentAt', 'status', 'total'],
    fields: [
      { key: 'customerName', label: 'Tên khách', type: 'text' },
      { key: 'phone', label: 'Số điện thoại', type: 'text' },
      { key: 'companion', label: 'Bạn đồng hành', type: 'text' },
      { key: 'plan', label: 'Gói dịch vụ', type: 'text' },
      { key: 'appointmentAt', label: 'Ngày giờ hẹn', type: 'datetime-local' },
      { key: 'meetingPlace', label: 'Địa điểm', type: 'text', full: true },
      { key: 'status', label: 'Trạng thái', type: 'select', options: ['pending', 'confirmed', 'completed', 'cancelled'] },
      { key: 'total', label: 'Tổng tiền', type: 'text' },
      { key: 'note', label: 'Ghi chú', type: 'textarea', full: true },
    ],
  },
  reviews: {
    label: 'Đánh giá',
    note: 'Quản lý phản hồi hiển thị trên website.',
    columns: ['avatar', 'name', 'companion', 'stars', 'date', 'status'],
    fields: [
      { key: 'avatar', label: 'Avatar', type: 'image' },
      { key: 'name', label: 'Tên người đánh giá', type: 'text' },
      { key: 'companion', label: 'Bạn đồng hành', type: 'text' },
      { key: 'stars', label: 'Số sao', type: 'number' },
      { key: 'date', label: 'Thời gian hiển thị', type: 'text' },
      { key: 'text', label: 'Nội dung', type: 'textarea', full: true },
      { key: 'status', label: 'Trạng thái', type: 'select', options: ['visible', 'hidden'] },
    ],
  },
}

const emptyDraft = {}

export function AdminPage() {
  const navigate = useNavigate()
  const [auth, setAuth] = useState(() => readAuth())
  const [data, setData] = useState(() => loadAdminData())
  const [activeType, setActiveType] = useState('companions')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [toast, setToast] = useState('')

  const currentUser = auth?.user
  const schema = schemas[activeType]
  const rows = data[activeType] || []

  useEffect(() => {
    const savedAuth = readAuth()
    if (!savedAuth?.token || savedAuth.user?.role !== 'admin') {
      navigate('/login')
      return
    }
    setAuth(savedAuth)
  }, [navigate])

  useEffect(() => {
    if (!auth?.token || auth.user?.role !== 'admin') return
    request('/api/auth/me')
      .then((result) => {
        setAuth((current) => {
          const nextAuth = { ...(current || readAuth()), user: result.user }
          localStorage.setItem('blackdate_auth', JSON.stringify(nextAuth))
          return nextAuth
        })
      })
      .catch(() => {})
  }, [auth?.token, auth?.user?.role])

  useEffect(() => {
    loadAdminDataFromApi()
      .then((remoteData) => {
        if (!remoteData) return
        setData(remoteData)
        saveAdminData(remoteData)
      })
      .catch(() => showToast('Không thể tải dữ liệu DB, đang dùng dữ liệu cục bộ.'))
  }, [])
  const stats = useMemo(
    () => [
      ['Tài khoản', data.users.length],
      ['Bạn đồng hành', data.companions.length],
      ['Gói dịch vụ', data.plans.length],
      ['Rent Props', data.rentProps.length],
      ['Lịch đặt', data.bookings.length],
      ['Đánh giá', data.reviews.length],
    ],
    [data],
  )

  function persist(nextData, message = 'Đã lưu thay đổi') {
    setData(nextData)
    saveAdminData(nextData)
    showToast(message)
    saveAdminDataToApi(nextData)
      .then(() => showToast('Đã lưu dữ liệu lên DB.'))
      .catch(() => showToast('Chưa lưu được lên DB, vui lòng thử lại.'))
  }

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  function openEditor(row = null) {
    setEditingId(row?.id || null)
    setDraft(row ? structuredClone(row) : createEmptyRecord(activeType, rows))
  }

  function closeEditor() {
    setEditingId(null)
    setDraft(emptyDraft)
  }

  function saveEditor(event) {
    event.preventDefault()
    const normalized = normalizeRecord(draft, schema)
    const nextRows = editingId ? rows.map((item) => (item.id === editingId ? normalized : item)) : [...rows, normalized]
    persist({ ...data, [activeType]: nextRows })
    closeEditor()
  }

  function deleteRecord(id) {
    if (!window.confirm('Bạn chắc chắn muốn xóa bản ghi này?')) return
    persist({ ...data, [activeType]: rows.filter((item) => item.id !== id) }, 'Đã xóa bản ghi')
  }

  function resetData() {
    if (!window.confirm('Khôi phục dữ liệu mẫu sẽ ghi đè dữ liệu đang sửa. Tiếp tục?')) return
    persist(createDefaultAdminData(), 'Đã khôi phục dữ liệu mẫu')
  }

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleImageUpload(key, file) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file ảnh')
      return
    }
    const reader = new FileReader()
    reader.onload = () => updateDraft(key, reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">BlackDate</div>
        <div className="admin-profile">
          <span className="admin-profile-ava">
            {isImage(currentUser?.avatar) ? <img src={currentUser.avatar} alt={currentUser.name} /> : currentUser?.avatar || initials(currentUser?.name)}
          </span>
          <div>
            <strong>{currentUser?.name || 'Admin'}</strong>
            <span>{currentUser?.email || 'Chưa cập nhật email'}</span>
          </div>
        </div>
        <nav className="admin-tabs">
          {Object.entries(schemas).map(([key, item]) => (
            <button className={key === activeType ? 'active' : ''} key={key} onClick={() => setActiveType(key)}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-actions">
          <Link to="/">Xem trang chủ</Link>
          <Link className="danger" to="/login" onClick={() => localStorage.removeItem('blackdate_auth')}>
            Đăng xuất
          </Link>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <p>Bảng quản trị</p>
            <h1>Quản lý {schema.label.toLowerCase()}</h1>
            <span>Dữ liệu được lưu trên trình duyệt hiện tại và landing sẽ đọc lại khi reload.</span>
          </div>
          <button onClick={resetData}>Khôi phục dữ liệu mẫu</button>
        </div>

        <section className="admin-stats">
          {stats.map(([label, count]) => (
            <article key={label}>
              <strong>{count}</strong>
              <span>{label}</span>
            </article>
          ))}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>{schema.label}</h2>
              <p>{schema.note}</p>
            </div>
            {!schema.singleton && (
              <button className="admin-add" onClick={() => openEditor()}>
                Thêm mới
              </button>
            )}
          </div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  {schema.columns.map((column) => (
                    <th key={column}>{displayColumn(schema, column)}</th>
                  ))}
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    {schema.columns.map((column) => (
                      <td key={column}>{renderCell(row, column)}</td>
                    ))}
                    <td>
                      <div className="table-actions">
                        <button onClick={() => openEditor(row)}>Sửa</button>
                        {!schema.singleton && (
                          <button className="danger" onClick={() => deleteRecord(row.id)}>
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {draft !== emptyDraft && (
        <div className="admin-modal-overlay" onMouseDown={(event) => event.currentTarget === event.target && closeEditor()}>
          <form className="admin-modal" onSubmit={saveEditor}>
            <div className="admin-modal-head">
              <strong>{editingId ? `Sửa ${schema.label.toLowerCase()}` : `Thêm ${schema.label.toLowerCase()}`}</strong>
              <button type="button" onClick={closeEditor} aria-label="Đóng form">
                ×
              </button>
            </div>
            <div className="admin-form-grid">
              {schema.fields.map((field) => (
                <label className={`admin-form-group ${field.full ? 'full' : ''}`} key={field.key}>
                  <span>{field.label}</span>
                  <AdminField field={field} value={draft[field.key]} onChange={updateDraft} onImageUpload={handleImageUpload} />
                </label>
              ))}
            </div>
            <div className="admin-modal-actions">
              <button type="button" onClick={closeEditor}>
                Hủy
              </button>
              <button className="admin-add" type="submit">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="admin-toast">{toast}</div>}
    </div>
  )
}

function AdminField({ field, value, onChange, onImageUpload }) {
  const safeValue = Array.isArray(value) ? value.join(', ') : value ?? ''

  if (field.type === 'select') {
    return (
      <select value={safeValue} onChange={(event) => onChange(field.key, event.target.value)}>
        {field.options.map((option) => (
          <option value={option} key={option}>
            {displayValue(option)}
          </option>
        ))}
      </select>
    )
  }

  if (field.type === 'textarea') {
    return <textarea value={safeValue} onChange={(event) => onChange(field.key, event.target.value)} />
  }

  if (field.type === 'checkbox') {
    return (
      <span className="admin-check">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(field.key, event.target.checked)} />
        Bật
      </span>
    )
  }

  if (field.type === 'image') {
    return (
      <div className="admin-image-picker">
        {isImage(value) ? <img src={value} alt="" /> : <span>{value || 'BD'}</span>}
        <div>
          <input value={safeValue} onChange={(event) => onChange(field.key, event.target.value)} placeholder="URL ảnh hoặc chữ viết tắt" />
          <input type="file" accept="image/*" onChange={(event) => onImageUpload(field.key, event.target.files?.[0])} />
        </div>
      </div>
    )
  }

  return (
    <input
      type={field.type === 'list' ? 'text' : field.type}
      step={field.step}
      value={safeValue}
      onChange={(event) => onChange(field.key, event.target.value)}
    />
  )
}

function renderCell(row, column) {
  const value = row[column]
  if (column === 'image' || column === 'avatar') {
    return isImage(value) ? <img className="table-avatar-img" src={value} alt="" /> : <span className="table-avatar-fallback">{value || 'BD'}</span>
  }
  if (column === 'status' || column === 'role' || column === 'badge') {
    return <span className={`status ${value === 'active' || value === 'available' || value === 'visible' ? 'success' : ''}`}>{displayValue(value)}</span>
  }
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'có' : 'không'
  return String(value ?? '')
}

function displayColumn(schema, column) {
  const field = schema.fields.find((item) => item.key === column)
  return field?.label || displayValue(column)
}

function displayValue(value) {
  const labels = {
    none: 'Không có',
    active: 'Đang hoạt động',
    locked: 'Đã khóa',
    available: 'Sẵn sàng',
    busy: 'Đang bận',
    hidden: 'Đã ẩn',
    visible: 'Hiển thị',
    pending: 'Đang chờ',
    confirmed: 'Đã xác nhận',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    customer: 'Khách hàng',
    admin: 'Admin',
    hot: 'Hot',
    new: 'Mới',
    image: 'Ảnh',
    avatar: 'Avatar',
    name: 'Tên',
    fullName: 'Họ và tên',
    birthDate: 'Ngày sinh',
    height: 'Chiều cao',
    weight: 'Cân nặng',
    measurements: 'Số đo',
    price: 'Giá',
    status: 'Trạng thái',
    role: 'Vai trò',
    email: 'Email',
    phone: 'Số điện thoại',
    icon: 'Icon',
    duration: 'Thời lượng',
    featured: 'Nổi bật',
    category: 'Danh mục',
    unit: 'Đơn vị',
    rating: 'Đánh giá',
    oldPrice: 'Giá cũ',
    countdownSec: 'Đếm ngược',
    customerName: 'Tên khách',
    companion: 'Bạn đồng hành',
    plan: 'Gói',
    appointmentAt: 'Ngày giờ hẹn',
    total: 'Tổng tiền',
    stars: 'Số sao',
    date: 'Ngày',
  }
  return labels[value] || value || labels.none
}

function createEmptyRecord(type, rows) {
  const schema = schemas[type]
  const record = { id: nextId(rows) }
  schema.fields.forEach((field) => {
    if (field.type === 'number') record[field.key] = 0
    else if (field.type === 'checkbox') record[field.key] = false
    else if (field.type === 'list') record[field.key] = []
    else if (field.type === 'select') record[field.key] = field.options[0]
    else record[field.key] = ''
  })
  return record
}

function normalizeRecord(record, schema) {
  const next = { ...record }
  schema.fields.forEach((field) => {
    if (field.type === 'list') {
      next[field.key] = String(next[field.key] || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
    if (field.type === 'number') next[field.key] = Number(next[field.key]) || 0
  })
  return next
}

function nextId(rows) {
  return rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
}

function isImage(value) {
  return typeof value === 'string' && (value.startsWith('/') || value.startsWith('data:image/') || value.startsWith('http'))
}

function initials(name) {
  return String(name || 'AD')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem('blackdate_auth') || 'null')
  } catch {
    return null
  }
}
