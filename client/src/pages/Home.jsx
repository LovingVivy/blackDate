import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatDate'
import './Home.css'

export function Home() {
  return (
    <section className="home-page">
      <div className="home-copy">
        <p className="eyebrow">React starter</p>
        <h1>Khởi tạo dự án BlackDate</h1>
        <p className="lede">
          Cấu trúc nền đã sẵn sàng cho component, layout, page, route, hook,
          service và style riêng.
        </p>
        <div className="home-actions">
          <Button onClick={() => window.alert('Dự án đã sẵn sàng!')}>
            Kiểm tra nhanh
          </Button>
          <span className="today">Hôm nay: {formatDate(new Date())}</span>
        </div>
      </div>

      <div className="structure-panel" aria-label="Cấu trúc dự án">
        <h2>Cấu trúc chính</h2>
        <ul>
          <li>src/components - UI dùng lại</li>
          <li>src/layouts - khung giao diện</li>
          <li>src/pages - các màn hình</li>
          <li>src/routes - cấu hình điều hướng</li>
          <li>src/services - gọi API</li>
          <li>src/hooks và src/utils - logic dùng chung</li>
        </ul>
      </div>
    </section>
  )
}
