-- ============================================================
-- 05_indexes.sql
-- Index tối ưu cho các query thường dùng
-- Nguyên tắc:
--   - Index theo filter (WHERE) và sort (ORDER BY) phổ biến
--   - Dùng partial index cho subset thường query
--   - Dùng GIN cho JSONB / array để search nhanh
-- ============================================================

-- ------------------------------------------------------------
-- USERS
-- ------------------------------------------------------------
-- email & phone đã UNIQUE (tự có index). Thêm index cho soft delete
CREATE INDEX idx_users_role_status ON users (role, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at  ON users (created_at DESC);

-- ------------------------------------------------------------
-- COMPANIONS
-- ------------------------------------------------------------
CREATE INDEX idx_companions_status     ON companions (status);
CREATE INDEX idx_companions_rating     ON companions (rating DESC, rating_count DESC);
-- GIN index cho tags (JSONB) để query WHERE tags ? 'Cà phê'
CREATE INDEX idx_companions_tags_gin   ON companions USING GIN (tags jsonb_path_ops);

-- ------------------------------------------------------------
-- SERVICE_PLANS
-- ------------------------------------------------------------
CREATE INDEX idx_plans_active      ON service_plans (is_active, is_featured);

-- ------------------------------------------------------------
-- BOOKINGS
-- ------------------------------------------------------------
-- Tìm booking theo khách hàng + trạng thái
CREATE INDEX idx_bookings_customer_status ON bookings (customer_id, status);
-- Tìm booking theo companion + ngày
CREATE INDEX idx_bookings_companion_date  ON bookings (companion_id, scheduled_date);
-- Báo cáo theo thời gian (cho materialized views)
CREATE INDEX idx_bookings_created_at      ON bookings (created_at);
CREATE INDEX idx_bookings_completed_at    ON bookings (completed_at) WHERE status = 'completed';
-- Tìm theo code
-- (code đã UNIQUE nên có index sẵn)

-- ------------------------------------------------------------
-- PAYMENTS
-- ------------------------------------------------------------
CREATE INDEX idx_payments_status_paid ON payments (status, paid_at);
CREATE INDEX idx_payments_customer   ON payments (customer_id, created_at DESC);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
CREATE INDEX idx_reviews_companion ON reviews (companion_id, is_published, created_at DESC);

-- ------------------------------------------------------------
-- NOTIFICATIONS
-- ------------------------------------------------------------
CREATE INDEX idx_notif_user_unread ON notifications (user_id, is_read, created_at DESC)
  WHERE is_read = FALSE;

-- ------------------------------------------------------------
-- EVENTS (partitioned)
-- Index được tạo ở bảng cha sẽ tự cascade xuống các partition con
-- ------------------------------------------------------------
CREATE INDEX idx_events_user_time      ON events (user_id, occurred_at DESC);
CREATE INDEX idx_events_type_time      ON events (type, occurred_at DESC);
CREATE INDEX idx_events_session        ON events (session_id);
CREATE INDEX idx_events_properties_gin ON events USING GIN (properties jsonb_path_ops);
