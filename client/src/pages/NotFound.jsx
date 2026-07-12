import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <section className="not-found-page">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này không tồn tại trong ứng dụng.</p>
      <Link to="/">Quay về trang chủ</Link>
    </section>
  )
}
