-- ============================================================
-- 04_events_partitioned.sql
-- Bảng EVENTS - dữ liệu hành vi người dùng (time-series)
--
-- Đặc điểm của event:
--   - Volume rất lớn (hàng triệu - hàng tỷ dòng)
--   - Chỉ INSERT, hiếm khi UPDATE/DELETE
--   - Query theo khoảng thời gian
-- => Giải pháp: PARTITION theo RANGE(occurred_at) theo TUAÀN
-- ============================================================

CREATE TABLE events (
  id            BIGSERIAL,
  occurred_at   TIMESTAMPTZ NOT NULL,
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id    VARCHAR(64),
  type          event_type NOT NULL,
  companion_id  UUID REFERENCES companions(id) ON DELETE SET NULL,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  -- Thuộc tính sự kiện (url,utm, giá trị...). JSONB cho phép tuỳ biến
  properties    JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Nguồn sự kiện
  source        VARCHAR(40) NOT NULL DEFAULT 'web',  -- web/app/server
  ip            INET,
  user_agent    TEXT,
  PRIMARY KEY (id, occurred_at)              -- partition key phải nằm trong PK
) PARTITION BY RANGE (occurred_at);

-- Tạo partition mẫu cho các tuần trong 3 tháng tới (2026-07, 08, 09)
-- Trong production: dùng cron / pg_partman để tự động tạo partition tương lai
CREATE TABLE events_2026_w28 PARTITION OF events
  FOR VALUES FROM ('2026-07-06') TO ('2026-07-13');
CREATE TABLE events_2026_w29 PARTITION OF events
  FOR VALUES FROM ('2026-07-13') TO ('2026-07-20');
CREATE TABLE events_2026_w30 PARTITION OF events
  FOR VALUES FROM ('2026-07-20') TO ('2026-07-27');
CREATE TABLE events_2026_w31 PARTITION OF events
  FOR VALUES FROM ('2026-07-27') TO ('2026-08-03');
CREATE TABLE events_2026_w32 PARTITION OF events
  FOR VALUES FROM ('2026-08-03') TO ('2026-08-10');
CREATE TABLE events_2026_w33 PARTITION OF events
  FOR VALUES FROM ('2026-08-10') TO ('2026-08-17');
CREATE TABLE events_2026_w34 PARTITION OF events
  FOR VALUES FROM ('2026-08-17') TO ('2026-08-24');
CREATE TABLE events_2026_w35 PARTITION OF events
  FOR VALUES FROM ('2026-08-24') TO ('2026-08-31');
CREATE TABLE events_2026_w36 PARTITION OF events
  FOR VALUES FROM ('2026-08-31') TO ('2026-09-07');

-- Partition mặc định: bắt mọi event ngoài khoảng đã khai báo
-- (tránh lỗi khi insert ngoài vùng, nhưng cần giám sát để tách partition mới)
CREATE TABLE events_default PARTITION OF events DEFAULT;
