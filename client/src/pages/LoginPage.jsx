import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { request } from '@/services/httpClient'

const AUTH_KEY = 'blackdate_auth'

export function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [isSubmitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const form = new FormData(event.currentTarget)
      const payload =
        mode === 'login'
          ? {
              identifier: form.get('identifier'),
              password: form.get('password'),
            }
          : {
              name: form.get('name'),
              email: form.get('email'),
              phone: form.get('phone'),
              gender: form.get('gender'),
              password: form.get('password'),
            }
      const result = await request(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      localStorage.setItem(AUTH_KEY, JSON.stringify(result))
      navigate(result.user.role === 'admin' ? '/admin' : '/account')
    } catch (submitError) {
      setError(submitError.message || 'Không thể đăng nhập lúc này.')
    } finally {
      setSubmitting(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <main className="auth-page">
      <div className="auth-glow one" />
      <div className="auth-glow two" />
      <div className="auth-shell">
        <Link className="auth-brand" to="/">
          BlackDate
        </Link>
        <section className="login-card">
          <div className="auth-kicker">{isLogin ? 'Truy cập thành viên' : 'Tạo tài khoản'}</div>
          <h1>{isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}</h1>
          <p>{isLogin ? 'Đăng nhập để quản lý lịch hẹn và bảng điều khiển.' : 'Tạo tài khoản khách hàng để đặt lịch nhanh hơn.'}</p>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={handleSubmit}>
            {isLogin ? (
              <label>
                Email hoặc username
                <input name="identifier" type="text" placeholder="admin hoặc ban@example.com" autoComplete="username" />
              </label>
            ) : (
              <>
                <label>
                  Họ và tên
                  <input name="name" type="text" placeholder="Nguyễn Văn A" autoComplete="name" />
                </label>
                <label>
                  Email
                  <input name="email" type="email" placeholder="ban@example.com" autoComplete="email" />
                </label>
                <label>
                  Số điện thoại
                  <input name="phone" type="tel" placeholder="0912345678" autoComplete="tel" />
                </label>
                <label>
                  Giới tính
                  <select name="gender" defaultValue="other">
                    <option value="other">Khác</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </label>
              </>
            )}
            <label>
              Mật khẩu
              <input name="password" type="password" placeholder="Nhập mật khẩu" autoComplete={isLogin ? 'current-password' : 'new-password'} />
            </label>
            {isLogin && (
              <div className="login-options">
                <label className="remember">
                  <input type="checkbox" /> Ghi nhớ đăng nhập
                </label>
                <a href="#forgot">Quên mật khẩu?</a>
              </div>
            )}
            <button className="btn-login" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>
          <div className="auth-switch">
            {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
            <button type="button" onClick={() => setMode(isLogin ? 'register' : 'login')}>
              {isLogin ? 'Đăng ký' : 'Đăng nhập'}
            </button>
          </div>
        </section>
        <Link className="back-home" to="/">
          Quay lại trang chủ
        </Link>
      </div>
    </main>
  )
}
