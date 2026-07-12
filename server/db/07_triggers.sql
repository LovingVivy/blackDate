-- ============================================================
-- 07_triggers.sql
-- Triggers & Functions tự động hoá
-- ============================================================

-- ------------------------------------------------------------
-- 1) Hàm cập nhật updated_at tự động
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Áp dụng cho mọi bảng có updated_at
CREATE TRIGGER trg_users_updated_at       BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_companions_updated_at  BEFORE UPDATE ON companions
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_service_plans_updated_at BEFORE UPDATE ON service_plans
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_bookings_updated_at    BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_payments_updated_at    BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_reviews_updated_at     BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- ------------------------------------------------------------
-- 2) Sinh mã booking code tự động
--    Định dạng: BD-YYYYMMDD-NNNN  (vd: BD-20260712-0001)
-- ------------------------------------------------------------
CREATE SEQUENCE seq_booking_code;

CREATE OR REPLACE FUNCTION fn_gen_booking_code()
RETURNS TRIGGER AS $$
DECLARE
  seq_val INTEGER;
BEGIN
  IF NEW.code IS NULL THEN
    seq_val := nextval('seq_booking_code');
    NEW.code := 'BD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_val::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_gen_code BEFORE INSERT ON bookings
  FOR EACH ROW WHEN (NEW.code IS NULL)
  EXECUTE FUNCTION fn_gen_booking_code();

-- ------------------------------------------------------------
-- 3) Validate chuyển trạng thái booking (state machine)
--    Đảm bảo lifecycle đúng:
--    pending -> confirmed -> in_progress -> completed
--                                   \-> cancelled
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_check_booking_status_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status <> OLD.status THEN
    CASE
      -- pending -> confirmed | cancelled
      WHEN OLD.status = 'pending' AND NEW.status NOT IN ('confirmed','cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: % -> %', OLD.status, NEW.status;
      -- confirmed -> in_progress | cancelled
      WHEN OLD.status = 'confirmed' AND NEW.status NOT IN ('in_progress','cancelled') THEN
        RAISE EXCEPTION 'Invalid transition: % -> %', OLD.status, NEW.status;
      -- in_progress -> completed | no_show
      WHEN OLD.status = 'in_progress' AND NEW.status NOT IN ('completed','no_show') THEN
        RAISE EXCEPTION 'Invalid transition: % -> %', OLD.status, NEW.status;
      -- completed/cancelled/no_show là trạng thái cuối
      WHEN OLD.status IN ('completed','cancelled','no_show') THEN
        RAISE EXCEPTION 'Cannot change from terminal status: %', OLD.status;
      ELSE
        NULL;
    END CASE;
  END IF;

  -- Cập nhật timestamp tương ứng khi đổi trạng thái
  NEW.updated_at := NOW();
  IF NEW.status = 'confirmed' AND OLD.status <> 'confirmed' THEN
    NEW.confirmed_at := NOW();
  ELSIF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    NEW.completed_at := NOW();
  ELSIF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    NEW.cancelled_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_status_transition
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION fn_check_booking_status_transition();

-- ------------------------------------------------------------
-- 4) Đồng bộ rating companion khi có review mới
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recompute_companion_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE companions c SET
    rating       = ROUND(AVG(r.stars)::NUMERIC, 1),
    rating_count = COUNT(*)
  FROM reviews r
  WHERE r.companion_id = c.id
    AND r.is_published = TRUE
    AND c.id = COALESCE(NEW.companion_id, OLD.companion_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_recompute_rating
  AFTER INSERT OR DELETE OR UPDATE OF stars ON reviews
  FOR EACH ROW EXECUTE FUNCTION fn_recompute_companion_rating();
