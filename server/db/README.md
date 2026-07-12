# BlackDate Database Schema

Thiết kế database PostgreSQL theo tư duy Data Engineer: ACID chặt, time-series analytics, event tracking.

## Kiến trúc tổng thể

```
┌──────────────────────────────────────────────────────────┐
│  BlackDate DB (PostgreSQL 16+)                            │
│                                                            │
│  ┌───────────────  OLTP (giao dịch)  ───────────────┐    │
│  │  users, companions, service_plans                 │    │
│  │  bookings, payments (ACID)                        │    │
│  │  reviews, notifications, favorites                │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌───────────────  TIME-SERIES (events)  ───────────┐    │
│  │  events (PARTITION BY RANGE occurred_at)         │    │
│  │  → hàng triệu event/ngày, query theo tuần        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                            │
│  ┌───────────────  ANALYTICS (cache)  ──────────────┐    │
│  │  mv_revenue_daily (Materialized View)            │    │
│  │  v_revenue_monthly_with_growth (YoY/MoM)         │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## Thứ tự chạy các file

Chạy theo đúng thứ tự số (số thứ tự đảm bảo phụ thuộc FK/ENUM được tạo trước):

| # | File | Mục đích |
|---|------|----------|
| 01 | `01_extensions.sql`  | pgcrypto (UUID), citext, btree_gin |
| 02 | `02_enums.sql`       | Kiểu ENUM (status, role, type...) |
| 03 | `03_oltp_tables.sql` | Bảng giao dịch chính |
| 04 | `04_events_partitioned.sql` | Bảng events partition theo tuần |
| 05 | `05_indexes.sql`     | Index tối ưu query |
| 06 | `06_revenue_reporting.sql` | Hàm + MV báo cáo doanh thu |
| 07 | `07_triggers.sql`    | Tự động updated_at, sinh code, state machine |

### Lệnh chạy (đầy đủ, trên DB rỗng)

```bash
psql "$DATABASE_URL" \
  -f 01_extensions.sql \
  -f 02_enums.sql \
  -f 03_oltp_tables.sql \
  -f 04_events_partitioned.sql \
  -f 05_indexes.sql \
  -f 06_revenue_reporting.sql \
  -f 07_triggers.sql
```

## Các quyết định thiết kế quan trọng

### 1. UUID làm khóa chính
- Tránh lộ số lượng bản ghi (so với SERIAL)
- An toàn khi sinh phía client / phân tán
- Dùng `gen_random_uuid()` (từ pgcrypto) — không cần round-trip DB

### 2. Tiền tệ lưu bằng `INTEGER` (cents), không dùng `NUMERIC`/float
```sql
price_cents INTEGER NOT NULL  -- 299000 = 299.000đ, không bao giờ lỗi float
```
Lý do: float (double) gây lỗi làm tròn khi tính tổng; `NUMERIC` chậm hơn INTEGER.
Display chia 100 ở tầng UI.

### 3. JSONB cho trường linh hoạt (tags, metadata, properties)
- `companions.tags`     — `["Cà phê","Đi dạo"]`
- `events.properties`   — tuỳ biến theo loại event
- Có GIN index → query `WHERE tags ? 'Cà phê'` cực nhanh

### 4. Snapshot giá tại thời điểm booking
```sql
bookings.price_cents, bookings.plan_name  -- copy từ service_plans lúc đặt
```
Tránh "sói giá": dù admin đổi giá gói sau này, booking cũ vẫn giữ giá gốc.

### 5. Bảng EVENTS dùng PARTITION theo tuần
- Event **chỉ INSERT**, volume rất lớn (hàng triệu/ngày)
- Partition theo tuần → query 1 khoảng thời gian chỉ quét vài partition
- Cần cron / pg_partman để **tự động tạo partition tương lai**

### 6. Báo cáo doanh thu: 2 lớp
- **Real-time functions** (`revenue_by_hour/day/month/year`) — tính đúng lúc, cho báo cáo ad-hoc
- **Materialized Views** (`mv_revenue_daily`) — cache, REFRESH 5–15 phút/lần cho dashboard

## Ví dụ truy vấn thường dùng

```sql
-- 1. Doanh thu hôm nay chia theo giờ
SELECT * FROM revenue_by_hour(CURRENT_DATE);

-- 2. Doanh thu tháng 7/2026 theo ngày
SELECT * FROM revenue_by_day('2026-07-01','2026-07-31');

-- 3. Doanh thu cả năm 2026 theo tháng
SELECT * FROM revenue_by_month(2026);

-- 4. Doanh thu các năm (so sánh multi-year)
SELECT * FROM revenue_by_year('2024-01-01','2026-12-31');

-- 5. Top 5 companion doanh thu cao nhất tháng
SELECT c.display_name, SUM(p.amount_cents) AS revenue
FROM payments p JOIN bookings b ON b.id = p.booking_id
                JOIN companions c ON c.id = b.companion_id
WHERE p.status = 'paid'
  AND p.paid_at >= DATE_TRUNC('month', NOW())
GROUP BY c.display_name ORDER BY revenue DESC LIMIT 5;

-- 6. Số user mới theo ngày (7 ngày gần nhất)
SELECT DATE(created_at) AS day, COUNT(*) AS new_users
FROM users WHERE deleted_at IS NULL
GROUP BY day ORDER BY day DESC LIMIT 7;

-- 7. Đếm event view companion trong tuần này
SELECT companion_id, COUNT(*) AS views
FROM events
WHERE type = 'companion_view'
  AND occurred_at >= DATE_TRUNC('week', NOW())
GROUP BY companion_id ORDER BY views DESC;
```

## Bảo đảm ACID (ví dụ transaction tạo booking + payment)

```sql
BEGIN;

-- Lock companion để tránh double-booking cùng khung giờ
SELECT * FROM companions WHERE id = $companionId FOR UPDATE;

INSERT INTO bookings (customer_id, companion_id, plan_id, plan_name,
                      price_cents, scheduled_date, scheduled_time, place)
VALUES (...);

INSERT INTO payments (booking_id, customer_id, amount_cents, method)
VALUES (...);

COMMIT;   -- hoặc ROLLBACK; nếu có lỗi
```

## Bảo trì

| Công việc | Tần suất | Lệnh |
|-----------|----------|------|
| Refresh MV doanh thu | 5–15 phút | `SELECT refresh_revenue_daily();` |
| Tạo partition events mới | Hàng tuần (cron) | Tạo `events_YYYY_wNN` tiếp theo |
| VACUUM ANALYZE | Hàng ngày | Tự động (autovacuum) |
| Backup | Hàng ngày | `pg_dump` + pg_basebackup |

## Khi nào cần mở rộng (scale)

| Tình huống | Giải pháp |
|------------|-----------|
| Event quá lớn (>100M/tháng) | Tách sang ClickHouse hoặc TimescaleDB |
| Báo cáo nặng | Tách read replica PostgreSQL |
| Cần search full-text | Thêm OpenSearch/Meilisearch |
| Cần realtime dashboard | Debezium + Kafka → OLAP |
