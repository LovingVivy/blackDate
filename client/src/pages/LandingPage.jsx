import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadAdminData, loadAdminDataFromApi, saveAdminData } from '@/data/adminStore'
import { request } from '@/services/httpClient'

const steps = [
  ['💝', 'Chọn bạn đồng hành', 'Duyệt danh sách, lọc theo vibe và chọn người phù hợp với lịch hẹn của bạn.'],
  ['📅', 'Đặt lịch hẹn', 'Chọn ngày giờ, địa điểm, gói dịch vụ và ghi chú mong muốn trong một form gọn.'],
  ['💳', 'Xác nhận', 'Thông tin được tổng hợp rõ ràng để bạn kiểm tra trước khi gửi yêu cầu.'],
  ['🌸', 'Tận hưởng', 'Đến hẹn đúng lịch và tận hưởng một trải nghiệm được chuẩn bị chỉn chu.'],
]

export function LandingPage() {
  const [adminData, setAdminData] = useState(() => loadAdminData())
  const companions = adminData.companions.filter((item) => item.status !== 'hidden')
  const servicePlans = adminData.plans.filter((item) => item.status !== 'hidden')
  const reviews = adminData.reviews.filter((item) => item.status !== 'hidden')
  const visibleRentProps = adminData.rentProps.filter((item) => item.status !== 'hidden')
  const rentHero = adminData.rentHero[0]
  const promo = adminData.promo.find((item) => item.status === 'active') || adminData.promo[0]
  const [selectedCompanion, setSelectedCompanion] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('Lãng Mạn')
  const [isBookingOpen, setBookingOpen] = useState(false)
  const [isPromoOpen, setPromoOpen] = useState(() => promo?.status !== 'hidden')
  const [toast, setToast] = useState('')
  const [favoriteIds, setFavoriteIds] = useState(() => readFavorites(readAuth()?.user))

  useRevealOnScroll()
  useScrollProgress()

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
    const auth = readAuth()
    if (!auth?.user) return
    loadFavoritesFromApi()
      .then((ids) => {
        const localIds = readFavorites(auth.user)
        const mergedIds = ids.length ? ids : localIds
        setFavoriteIds(mergedIds)
        saveFavorites(auth.user, mergedIds)
        if (!ids.length && localIds.length) saveFavoritesToApi(localIds).catch(() => {})
      })
      .catch(() => {})
  }, [])

  const featured = companions[0]

  function openBooking(companion = null, plan = 'Lãng Mạn') {
    setSelectedCompanion(companion)
    setSelectedPlan(plan)
    setBookingOpen(true)
  }

  function submitBooking(event) {
    event.preventDefault()
    setBookingOpen(false)
    setToast('Đã gửi yêu cầu đặt lịch. Chúng tôi sẽ liên hệ sớm.')
    window.setTimeout(() => setToast(''), 3200)
  }

  function openChat(person) {
    setToast(`Đang mở chat với ${person.name}. Chức năng chat sẽ được kết nối sau.`)
    window.setTimeout(() => setToast(''), 3200)
  }

  function toggleFavorite(person) {
    const auth = readAuth()
    if (!auth?.user) {
      setToast('Vui lòng đăng nhập để thêm yêu thích.')
      window.setTimeout(() => setToast(''), 3200)
      return
    }

    const personId = String(person.id)
    const nextFavorites = favoriteIds.includes(personId)
      ? favoriteIds.filter((id) => id !== personId)
      : [...favoriteIds, personId]
    setFavoriteIds(nextFavorites)
    saveFavorites(auth.user, nextFavorites)
    saveFavoritesToApi(nextFavorites).catch(() => {})
    setToast(nextFavorites.includes(personId) ? `Đã thêm ${person.name} vào yêu thích.` : `Đã bỏ ${person.name} khỏi yêu thích.`)
    window.setTimeout(() => setToast(''), 2400)
  }

  return (
    <div className="kawaii-page">
      <CustomCursor />
      <div id="scrollProgressBar" />
      {toast && <div className="toast show">{toast}</div>}

      <PromoOverlay
        companion={featured}
        promo={promo}
        isOpen={isPromoOpen}
        onClose={() => setPromoOpen(false)}
        onBook={() => {
          setPromoOpen(false)
          openBooking(featured, 'Lãng Mạn')
        }}
      />

      <header className="hero" id="top">
        <StarCanvas />
        <AccountActions />

        <div className="hero-blob blob1" />
        <div className="hero-blob blob2" />
        <div className="hero-blob blob3" />
        <FloatingHearts />

        <div className="hero-content">
          <div className="hero-badge">✨ Trải nghiệm đồng hành cao cấp</div>
          <h1 className="hero-title">Mọi đen-Date</h1>
          <p className="hero-sub">Tìm bạn đồng hành lý tưởng cho mọi dịp, đặt lịch nhanh và quản lý lịch hẹn gọn gàng.</p>
          <a className="hero-cta magnetic" href="#catalog">
            💝 Bú mút ngay!
          </a>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-n">12K+</div>
              <div className="stat-l">Thành viên</div>
            </div>
            <div className="stat">
              <div className="stat-n">58K+</div>
              <div className="stat-l">Buổi hẹn</div>
            </div>
            <div className="stat">
              <div className="stat-n">9.8K+</div>
              <div className="stat-l">Đánh giá tốt</div>
            </div>
          </div>
        </div>
        <a className="scroll-arrow" href="#catalog" aria-label="Cuộn xuống">
          ↓
        </a>
      </header>

      <section className="section cards-section" id="catalog">
        <SectionHeader eyebrow="💖 Danh sách các ông bố đơn thân nổi bật" title="Chọn một ông bố hoàn hảo" highlight="hôm nay" />
        <div className="cards-grid">
          {companions.map((person, index) => (
            <article
              className="gf-card reveal"
              style={{ '--delay': `${index * 0.08}s` }}
              key={person.id}
              tabIndex={0}
            >
              <div className="card-visual" style={{ background: person.bg }}>
                {person.badge && <span className={`card-badge-top ${person.badgeClass}`}>{person.badge}</span>}
                <img className="card-avatar-img" src={person.image || '/uploads/avatars/companions-1.jpg'} alt={person.name} />
                <CompanionInfoPanel
                  person={person}
                  isFavorite={favoriteIds.includes(String(person.id))}
                  onBook={openBooking}
                  onChat={openChat}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <RentProps items={visibleRentProps} hero={rentHero} />

      <section className="section how-section">
        <SectionHeader eyebrow="🗺️ Quy trình" title="Dễ dàng chỉ" highlight="4 bước" />
        <div className="steps-grid">
          {steps.map(([icon, title, desc], index) => (
            <article className="step-card reveal" style={{ '--delay': `${index * 0.1}s` }} key={title}>
              <div className="step-icon" data-num={index + 1}>
                {icon}
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section pricing-section">
        <SectionHeader eyebrow="💎 Gói dịch vụ" title="Chọn gói" highlight="phù hợp" />
        <div className="pricing-grid">
          {servicePlans.map((plan, index) => (
            <article
              className={`plan-card reveal ${plan.featured ? 'featured' : ''}`}
              style={{ '--delay': `${index * 0.12}s` }}
              key={plan.id}
            >
              {plan.featured && <span className="plan-badge">⭐ Phổ biến nhất</span>}
              <div className="plan-icon">{plan.icon}</div>
              <h3>{plan.name}</h3>
              <p>{plan.desc}</p>
              <div className="plan-price-row">
                <strong>{plan.price}</strong>
                <span>/ {plan.duration}</span>
              </div>
              <div className="plan-features">
                {plan.features.map((feature) => (
                  <div className="plan-feature" key={feature}>
                    <span>✓</span> {feature}
                  </div>
                ))}
              </div>
              <button className={plan.featured ? 'btn-plan btn-plan-primary' : 'btn-plan btn-plan-outline'} onClick={() => openBooking(null, plan.name)}>
                Chọn gói này
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section testimonials-section">
        <SectionHeader eyebrow="💬 Phản hồi" title="Khách hàng" highlight="nói gì?" />
        <div className="testi-viewport">
          <div className="testi-track">
            {[...reviews, ...reviews].map((review, index) => (
              <article className="testi-card" key={`${review.id}-${index}`}>
                <div className="testi-stars">{'⭐'.repeat(review.stars)}</div>
                <p>"{review.text}"</p>
                <div className="testi-user">
                  <span>{review.avatar}</span>
                  <div>
                    <strong>{review.name}</strong>
                    <small>{review.date}</small>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="logo">Mọi đen-Date 💕</div>
        <p>Dịch vụ đồng hành chuyên nghiệp, an toàn và được chuẩn bị cẩn thận.</p>
        <p>Website được phát triển bởi CEO - Phạm Tùng Dương.</p>
        <small>© 2026 mọi đen-Date. Đã đăng ký bản quyền.</small>
      </footer>

      <BookingModal
        isOpen={isBookingOpen}
        companions={companions}
        plans={servicePlans}
        selectedCompanion={selectedCompanion}
        selectedPlan={selectedPlan}
        onClose={() => setBookingOpen(false)}
        onSubmit={submitBooking}
      />
    </div>
  )
}

function CompanionInfoPanel({ person, isFavorite, onBook, onChat, onToggleFavorite }) {
  const tags = person.tags?.length ? person.tags : String(person.interests || '')
    .split(/[,·]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 4)
  const rows = [
    ['🎂', 'Ngày sinh', formatBirthDate(person.birthDate)],
    ['↕', 'Chiều cao', person.height || 'Đang cập nhật'],
    ['⚖', 'Cân nặng', person.weight || 'Đang cập nhật'],
    ['✦', 'Số đo 3 vòng', person.measurements || 'Đang cập nhật'],
  ]

  return (
    <div className="companion-info-panel">
      <div className="companion-info-head">
        <div className="companion-info-identity">
          <span className="companion-online-dot" />
          <div>
            <strong>{person.name}</strong>
            <small>{person.fullName || 'Sẵn sàng đồng hành cùng bạn'}</small>
          </div>
        </div>
        <span className="companion-rating">★ {person.rating}</span>
        <button
          type="button"
          className={`card-heart-btn companion-heart-btn ${isFavorite ? 'active' : ''}`}
          aria-label={isFavorite ? `Bỏ yêu thích ${person.name}` : `Thêm yêu thích ${person.name}`}
          onClick={(event) => {
            event.stopPropagation()
            onToggleFavorite(person)
          }}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>
      {tags.length > 0 && (
        <div className="companion-info-tags">
          <em>Thẻ</em>
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
      <dl className="companion-info-stats">
        {rows.map(([icon, label, value]) => (
          <div key={label}>
            <span className="companion-stat-icon" aria-hidden="true">{icon}</span>
            <div>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <div className="companion-interests">
        <span>♡ Mô tả</span>
        <p>{person.desc || 'Đang cập nhật'}</p>
      </div>
      <div className="companion-price-row">
        <span>Giá mỗi buổi</span>
        <strong>{person.price || 'Liên hệ'} <small>/ buổi</small></strong>
      </div>
      <div className="companion-info-actions">
        <button onClick={(event) => {
          event.stopPropagation()
          onBook(person)
        }}>
          <span>💝</span> Đặt lịch
        </button>
        <button type="button" onClick={(event) => {
          event.stopPropagation()
          onChat(person)
        }}>
          <span>💬</span> Chat SEX
        </button>
      </div>
    </div>
  )
}

function formatBirthDate(value) {
  if (!value) return 'Đang cập nhật'
  const [year, month, day] = String(value).split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

function SectionHeader({ eyebrow, title, highlight }) {
  return (
    <div className="section-header reveal">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title">
        {title} <span>{highlight}</span>
      </h2>
    </div>
  )
}

function AccountActions() {
  const [auth, setAuth] = useState(() => readAuth())
  const [isOpen, setOpen] = useState(false)
  const user = auth?.user

  function logout() {
    localStorage.removeItem('blackdate_auth')
    setAuth(null)
    setOpen(false)
  }

  if (!user) {
    return (
      <div className="account-actions">
        <Link className="btn-register-account" to="/login">
          Đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <div className="account-actions account-actions-signed">
      <button className="account-user-main" onClick={() => setOpen((value) => !value)} aria-expanded={isOpen} aria-haspopup="menu">
        <span className="account-user-avatar">{isImage(user.avatar) ? <img src={user.avatar} alt={user.name} /> : user.avatar || initials(user.name)}</span>
        <span className="account-user-text">
          <strong className="account-user-name">{user.name}</strong>
          <small className="account-user-role">{user.role}</small>
        </span>
      </button>
      {user.role === 'admin' && (
        <Link className="btn-manage-account" to="/admin">
          Trang quản lý
        </Link>
      )}
      <div className={`account-menu ${isOpen ? 'open' : ''}`} role="menu">
        <Link to="/account" role="menuitem" onClick={() => setOpen(false)}>
          Hồ sơ
        </Link>
        <button onClick={logout} role="menuitem">
          Đăng xuất
        </button>
      </div>
    </div>
  )
}

function readAuth() {
  try {
    return JSON.parse(localStorage.getItem('blackdate_auth') || 'null')
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

function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring || window.matchMedia('(pointer: coarse)').matches) return undefined

    function onMove(event) {
      dot.style.left = `${event.clientX}px`
      dot.style.top = `${event.clientY}px`
      ring.style.left = `${event.clientX}px`
      ring.style.top = `${event.clientY}px`
    }

    function onOver(event) {
      if (!event.target.closest('a, button, input, select, textarea, .magnetic')) return
      ring.classList.add('cursor-hover')
    }

    function onOut(event) {
      if (!event.target.closest('a, button, input, select, textarea, .magnetic')) return
      ring.classList.remove('cursor-hover')
    }

    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
    }
  }, [])

  return (
    <>
      <div className="cursor-dot" ref={dotRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  )
}

function StarCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined

    let frame = 0
    let raf = 0
    let stars = []

    function resize() {
      const ratio = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.8 + 0.4,
        speed: Math.random() * 0.45 + 0.12,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    function draw() {
      frame += 0.012
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)
      stars.forEach((star) => {
        star.y += star.speed
        if (star.y > window.innerHeight + 8) {
          star.y = -8
          star.x = Math.random() * window.innerWidth
        }
        const alpha = 0.25 + Math.sin(frame + star.phase) * 0.2
        context.beginPath()
        context.fillStyle = `rgba(255, 220, 235, ${alpha})`
        context.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        context.fill()
      })
      raf = window.requestAnimationFrame(draw)
    }

    resize()
    draw()
    window.addEventListener('resize', resize)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas id="starCanvas" ref={canvasRef} aria-hidden="true" />
}

function FloatingHearts() {
  const items = useMemo(() => ['💕', '💖', '✨', '🌸', '💗', '⭐', '💝', '🌙', '💕', '✨', '💖', '🌸'], [])

  return (
    <div className="floating-hearts" aria-hidden="true">
      {items.map((heart, index) => (
        <span key={`${heart}-${index}`} style={{ '--i': index }}>
          {heart}
        </span>
      ))}
    </div>
  )
}

function PromoOverlay({ companion, promo, isOpen, onClose, onBook }) {
  const [seconds, setSeconds] = useState(promo?.countdownSec || 9 * 60 + 59)

  useEffect(() => {
    if (!isOpen) return undefined
    const timer = window.setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : value)), 1000)
    return () => window.clearInterval(timer)
  }, [isOpen])

  if (!isOpen || !companion || !promo) return null

  const minutesText = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secondsText = String(seconds % 60).padStart(2, '0')

  return (
    <div id="promoOverlay" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <div className="promo-card">
        <div className="promo-ribbon">⚡ {promo.ribbon}</div>
        <div className="promo-img-wrap">
          <button className="promo-x" onClick={onClose} aria-label="Đóng ưu đãi">
            ✕
          </button>
          <span className="promo-sparkle">✨</span>
          <span className="promo-sparkle">💖</span>
          <span className="promo-sparkle">🌸</span>
          <div className="promo-avatar-big">
            <img src={promo.image || companion.image} alt={promo.name || companion.name} />
          </div>
          <div className="promo-img-badge">🔥 {promo.badge}</div>
        </div>
        <div className="promo-body">
          <div className="promo-name">{promo.name || companion.name}</div>
          <div className="promo-meta">
            {[promo.tag1, promo.tag2].filter(Boolean).map((tag) => (
              <span className="promo-tag" key={tag}>
                {tag}
              </span>
            ))}
            <span className="promo-rating">⭐ {promo.rating}</span>
          </div>
          <p className="promo-desc">{promo.desc || companion.desc}</p>
          <div className="promo-price-row">
            <div className="promo-price">{promo.price}</div>
            <div className="promo-price-unit">{promo.unit}</div>
            <div className="promo-old-price">{promo.oldPrice}</div>
          </div>
          <div className="promo-btns">
            <button className="btn-promo-call" onClick={onBook}>
              Đặt lịch ngay
            </button>
            <button className="btn-promo-close-soft" onClick={onClose}>
              Để sau
            </button>
          </div>
          <div className="promo-countdown">
            Ưu đãi hết hạn sau: <span>{minutesText}:{secondsText}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function RentProps({ items, hero }) {
  const trackRef = useRef(null)

  function scrollByCard(direction) {
    trackRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' })
  }

  return (
    <section className="rent-props-section" id="rentProps">
      <div className="rent-props-inner">
        <div className="rent-props-left reveal">
          <img className="rent-props-left-img" src={hero?.image || '/uploads/avatars/companions-2.jpg'} alt="Đạo cụ buổi hẹn" />
          <div className="rent-props-left-overlay" />
          <div className="rent-props-left-label">
            <div className="eyebrow">🎭 {hero?.eyebrow || 'Đạo cụ cao cấp'}</div>
            <h2>{hero?.title || 'Rent Props'}</h2>
            <p>{hero?.desc || 'Thuê phụ kiện, trang phục và bộ set chụp ảnh để buổi hẹn có nhiều điểm nhớ hơn.'}</p>
          </div>
        </div>

        <div className="rent-props-right">
          <div className="rent-props-top-row reveal">
            <h3>
              {hero?.subtitle || 'Bộ sưu tập'}<br />
              <span>{hero?.highlight || 'đạo cụ nổi bật'}</span>
            </h3>
            <div className="rent-props-nav">
              <button className="rent-nav-btn" onClick={() => scrollByCard(-1)} aria-label="Truoc">
                ←
              </button>
              <button className="rent-nav-btn" onClick={() => scrollByCard(1)} aria-label="Sau">
                →
              </button>
            </div>
          </div>

          <div className="rent-track" ref={trackRef}>
            {items.map((prop) => (
              <article className="prop-card reveal" style={{ background: prop.bg }} key={prop.id}>
                <div className="prop-card-tag">{prop.category}</div>
                <button className="prop-card-btn-cart" title="Thêm giỏ">
                  🛍️
                </button>
                <div className="prop-card-img-wrap">
                  <span className="prop-card-emoji">{prop.emoji}</span>
                </div>
                <div className="prop-card-body">
                  <div className="prop-card-name">{prop.name}</div>
                  <div className="prop-card-footer">
                    <div>
                      <span className="prop-card-price">{prop.price}</span>
                      <span className="prop-card-unit">/ {prop.unit}</span>
                    </div>
                    <span className="prop-card-rating">⭐ {prop.rating}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="rent-drag-hint">{hero?.dragHint || 'Giữ Shift + lăn chuột hoặc bấm mũi tên để xem thêm'}</div>
        </div>
      </div>
    </section>
  )
}

function BookingModal({ isOpen, companions: companionOptions, plans, selectedCompanion, selectedPlan, onClose, onSubmit }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay active" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <form className="modal" onSubmit={onSubmit}>
        <button className="modal-close" type="button" onClick={onClose} aria-label="Đóng form">
          ✕
        </button>
        <div className="modal-title">💝 Đặt lịch hẹn</div>
        <div className="modal-sub">Điền thông tin để chúng tôi xác nhận lịch hẹn của bạn.</div>

        <div className="modal-selected-girl">
          {selectedCompanion ? (
            <img className="modal-girl-img" src={selectedCompanion.image} alt={selectedCompanion.name} />
          ) : (
            <div className="modal-girl-ava">BD</div>
          )}
          <div>
            <div className="modal-girl-name">{selectedCompanion?.name || 'Chọn đối tác'}</div>
            <div className="modal-girl-tag">Gói: {selectedPlan}</div>
          </div>
        </div>

        <div className="order-form-grid">
          <label className="form-group">
            <span className="form-label">Họ và tên</span>
            <input className="form-input" type="text" placeholder="Nguyễn Văn A" required />
          </label>
          <label className="form-group">
            <span className="form-label">Số điện thoại</span>
            <input className="form-input" type="tel" placeholder="0912 345 678" required />
          </label>
          <label className="form-group">
            <span className="form-label">Chọn đối tác</span>
            <select className="form-select" defaultValue={selectedCompanion?.id || ''}>
              <option value="">Chọn bạn đồng hành</option>
              {companionOptions.map((person) => (
                <option value={person.id} key={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Gói dịch vụ</span>
            <select className="form-select" defaultValue={selectedPlan}>
              {plans.map((plan) => (
                <option value={plan.name} key={plan.id}>
                  {plan.name} - {plan.price} / {plan.duration}
                </option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Ngày hẹn</span>
            <input className="form-input" type="date" />
          </label>
          <label className="form-group">
            <span className="form-label">Giờ hẹn</span>
            <input className="form-input" type="time" defaultValue="14:00" />
          </label>
          <label className="form-group full">
            <span className="form-label">Địa điểm gặp mặt</span>
            <input className="form-input" type="text" placeholder="Ví dụ: Highlands Coffee Lê Lợi" />
          </label>
          <label className="form-group full">
            <span className="form-label">Ghi chú thêm</span>
            <textarea className="form-textarea" placeholder="Bạn muốn trải nghiệm như thế nào?" />
          </label>
        </div>
        <button className="btn-submit" type="submit">
          Xác nhận đặt lịch
        </button>
      </form>
    </div>
  )
}

function useRevealOnScroll() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('.reveal'))
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible')
        })
      },
      { threshold: 0.12 },
    )
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])
}

function useScrollProgress() {
  useEffect(() => {
    const progress = document.getElementById('scrollProgressBar')
    if (!progress) return undefined

    function update() {
      const max = document.documentElement.scrollHeight - window.innerHeight
      progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])
}
