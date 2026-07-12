-- ============================================================
-- 03_oltp_tables.sql
-- Các bảng OLTP chính (giao dịch) của BlackDate
-- Nguyên tắc:
--   - Khóa chính UUID (gen_random_uuid)
--   - created_at / updated_at có timezone
--   - Dùng JSONB cho metadata linh hoạt (tags, tuỳ chọn thêm)
--   - FK ràng buộc đảm bảo tính toàn vẹn
-- ============================================================

-- ------------------------------------------------------------
-- USERS: tài khoản (khách hàng / bạn đồng hành / admin)
-- ------------------------------------------------------------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120) NOT NULL,
  email           CITEXT UNIQUE NOT NULL,
  phone           VARCHAR(20) UNIQUE,
  password_hash   TEXT NOT NULL,                    -- bcrypt/argon2
  role            user_role NOT NULL DEFAULT 'customer',
  status          account_status NOT NULL DEFAULT 'active',
  avatar          TEXT,
  gender          VARCHAR(10),                       -- male / female / other
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,-- sở thích, cài đặt tuỳ chọn
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ                        -- soft delete
);

-- ------------------------------------------------------------
-- COMPANIONS: bạn đồng hành (profile mở rộng từ user)
-- ------------------------------------------------------------
CREATE TABLE companions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name    VARCHAR(120) NOT NULL,
  avatar          TEXT,
  bio             TEXT,
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ["Cà phê","Đi dạo","Âm nhạc"]
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0), -- giá để cents tránh lỗi float
  currency        VARCHAR(3) NOT NULL DEFAULT 'VND',
  rating          NUMERIC(2,1) NOT NULL DEFAULT 0.0 CHECK (rating BETWEEN 0 AND 5),
  rating_count    INTEGER NOT NULL DEFAULT 0,
  status          companion_status NOT NULL DEFAULT 'available',
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb, -- bg gradient, badge...
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- SERVICE_PLANS: gói dịch vụ (Cơ Bản / Lãng Mạn / VIP Premium)
-- ------------------------------------------------------------
CREATE TABLE service_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(80) NOT NULL UNIQUE,
  slug            VARCHAR(80) NOT NULL UNIQUE,
  price_cents     INTEGER NOT NULL CHECK (price_cents >= 0),
  currency        VARCHAR(3) NOT NULL DEFAULT 'VND',
  duration_hours  NUMERIC(5,2) NOT NULL CHECK (duration_hours > 0),
  features        JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["Lịch linh hoạt","Quà tặng kèm"]
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- BOOKINGS: lịch hẹn
--   Đây là bảng giao dịch trung tâm, cần ACID cao
-- ------------------------------------------------------------
CREATE TABLE bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             VARCHAR(20) UNIQUE NOT NULL,        -- mã dễ đọc: BD-20260712-0001
  customer_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  companion_id     UUID NOT NULL REFERENCES companions(id) ON DELETE RESTRICT,
  plan_id          UUID NOT NULL REFERENCES service_plans(id) ON DELETE RESTRICT,
  -- Snapshot giá tại thời điểm đặt (tránh sói giá sau này)
  plan_name        VARCHAR(80) NOT NULL,
  price_cents      INTEGER NOT NULL CHECK (price_cents >= 0),
  currency         VARCHAR(3) NOT NULL DEFAULT 'VND',
  -- Thông tin lịch hẹn
  scheduled_date   DATE NOT NULL,
  scheduled_time   TIME NOT NULL,
  place            VARCHAR(255),
  notes            TEXT,
  -- Trạng thái & lifecycle
  status           booking_status NOT NULL DEFAULT 'pending',
  cancelled_reason VARCHAR(255),
  -- Timestamps cho lifecycle (để tính time-series)
  confirmed_at     TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  cancelled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint: ngày hẹn không được trong quá khứ khi tạo
  CONSTRAINT chk_booking_date_valid CHECK (scheduled_date >= DATE '2026-01-01')
);

-- ------------------------------------------------------------
-- PAYMENTS: thanh toán (1-1 với booking)
--   Tách riêng để đảm bảo mỗi giao dịch tiền có ledger rõ ràng
-- ------------------------------------------------------------
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE RESTRICT,
  customer_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  amount_cents      INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency          VARCHAR(3) NOT NULL DEFAULT 'VND',
  method            payment_method NOT NULL,
  status            payment_status NOT NULL DEFAULT 'pending',
  provider_txn_ref  VARCHAR(255),                   -- mã giao dịch từ cổng (Momo, Stripe...)
  paid_at           TIMESTAMPTZ,
  refunded_at       TIMESTAMPTZ,
  metadata          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- REVIEWS: đánh giá sau khi hoàn thành booking
-- ------------------------------------------------------------
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id    UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  stars           SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  text            TEXT,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- NOTIFICATIONS: thông báo trong app
-- ------------------------------------------------------------
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        VARCHAR(40) NOT NULL,           -- 'booking_confirmed', 'promo'...
  title       VARCHAR(200) NOT NULL,
  body        TEXT,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- FAVORITES: user lưu bạn đồng hành yêu thích
-- ------------------------------------------------------------
CREATE TABLE favorites (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  companion_id  UUID NOT NULL REFERENCES companions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, companion_id)
);
