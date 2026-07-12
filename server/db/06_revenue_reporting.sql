-- ============================================================
-- 06_revenue_reporting.sql
-- Báo cáo doanh thu theo giờ / ngày / tháng / năm
--
-- Hai cách tiếp cận:
--   1) Hàm SQL trả về kết quả trực tiếp (real-time, mỗi query tính lại)
--   2) Materialized Views (tính trước, REFRESH định kỳ) - cho dashboard
-- ============================================================

-- ============================================================
-- PHẦN 1: HÀM BÁO CÁO DOANH THU (real-time)
-- ============================================================

-- ------------------------------------------------------------
-- Báo cáo doanh thu theo KHUNG GIỜ trong một ngày cụ thể
-- Ví dụ: xem doanh thu chia theo từng giờ của ngày 2026-07-12
-- Cách dùng:
--   SELECT * FROM revenue_by_hour('2026-07-12');
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION revenue_by_hour(day DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  hour_of_day    SMALLINT,
  revenue_cents  BIGINT,
  bookings_count BIGINT,
  unique_customers BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT
    EXTRACT(HOUR FROM p.paid_at)::SMALLINT          AS hour_of_day,
    COALESCE(SUM(p.amount_cents), 0)::BIGINT        AS revenue_cents,
    COUNT(*)::BIGINT                                AS bookings_count,
    COUNT(DISTINCT p.customer_id)::BIGINT           AS unique_customers
  FROM payments p
  WHERE p.status = 'paid'
    AND p.paid_at >= day
    AND p.paid_at <  day + INTERVAL '1 day'
  GROUP BY hour_of_day
  ORDER BY hour_of_day;
$$;

-- ------------------------------------------------------------
-- Báo cáo doanh thu theo NGÀY trong khoảng ngày
-- Cách dùng:
--   SELECT * FROM revenue_by_day('2026-07-01','2026-07-31');
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION revenue_by_day(d_from DATE, d_to DATE)
RETURNS TABLE (
  period         DATE,
  revenue_cents  BIGINT,
  bookings_count BIGINT,
  unique_customers BIGINT,
  avg_order_value NUMERIC
)
LANGUAGE sql STABLE AS $$
  SELECT
    DATE(p.paid_at)                                  AS period,
    COALESCE(SUM(p.amount_cents), 0)::BIGINT         AS revenue_cents,
    COUNT(*)::BIGINT                                 AS bookings_count,
    COUNT(DISTINCT p.customer_id)::BIGINT            AS unique_customers,
    ROUND(AVG(p.amount_cents), 2)                    AS avg_order_value
  FROM payments p
  WHERE p.status = 'paid'
    AND p.paid_at >= d_from
    AND p.paid_at <  d_to + INTERVAL '1 day'
  GROUP BY period
  ORDER BY period;
$$;

-- ------------------------------------------------------------
-- Báo cáo doanh thu theo THÁNG trong một năm
-- Cách dùng:
--   SELECT * FROM revenue_by_month(2026);
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION revenue_by_month(year_input INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INT)
RETURNS TABLE (
  period         TEXT,
  revenue_cents  BIGINT,
  bookings_count BIGINT,
  unique_customers BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('month', p.paid_at), 'YYYY-MM') AS period,
    COALESCE(SUM(p.amount_cents), 0)::BIGINT           AS revenue_cents,
    COUNT(*)::BIGINT                                   AS bookings_count,
    COUNT(DISTINCT p.customer_id)::BIGINT              AS unique_customers
  FROM payments p
  WHERE p.status = 'paid'
    AND EXTRACT(YEAR FROM p.paid_at) = year_input
  GROUP BY period
  ORDER BY period;
$$;

-- ------------------------------------------------------------
-- Báo cáo doanh thu theo NĂM (multi-year)
-- Cách dùng:
--   SELECT * FROM revenue_by_year('2024-01-01','2026-12-31');
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION revenue_by_year(d_from DATE, d_to DATE)
RETURNS TABLE (
  period         SMALLINT,
  revenue_cents  BIGINT,
  bookings_count BIGINT,
  unique_customers BIGINT
)
LANGUAGE sql STABLE AS $$
  SELECT
    EXTRACT(YEAR FROM p.paid_at)::SMALLINT            AS period,
    COALESCE(SUM(p.amount_cents), 0)::BIGINT          AS revenue_cents,
    COUNT(*)::BIGINT                                  AS bookings_count,
    COUNT(DISTINCT p.customer_id)::BIGINT             AS unique_customers
  FROM payments p
  WHERE p.status = 'paid'
    AND p.paid_at >= d_from
    AND p.paid_at <  d_to + INTERVAL '1 day'
  GROUP BY period
  ORDER BY period;
$$;

-- ============================================================
-- PHẦN 2: MATERIALIZED VIEWS (dashboard cache)
-- Dùng cho dashboard admin, REFRESH mỗi 5-15 phút bằng cron job
-- ============================================================

-- Doanh thu tổng hợp theo NGÀY (chạy nền, query dashboard nhanh)
CREATE MATERIALIZED VIEW mv_revenue_daily AS
SELECT
  DATE(p.paid_at)                       AS day,
  EXTRACT(YEAR  FROM p.paid_at)::SMALLINT AS yr,
  EXTRACT(MONTH FROM p.paid_at)::SMALLINT AS mon,
  SUM(p.amount_cents)::BIGINT           AS revenue_cents,
  COUNT(*)::BIGINT                      AS bookings_count,
  COUNT(DISTINCT p.customer_id)::BIGINT AS unique_customers,
  ROUND(AVG(p.amount_cents), 2)         AS avg_order_value
FROM payments p
WHERE p.status = 'paid' AND p.paid_at IS NOT NULL
GROUP BY day, yr, mon;

CREATE UNIQUE INDEX mv_revenue_daily_day_uidx ON mv_revenue_daily (day);

-- Function REFRESH đồng thời (không lock dashboard)
-- Cách dùng: SELECT refresh_revenue_daily();
CREATE OR REPLACE FUNCTION refresh_revenue_daily() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_revenue_daily;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PHẦN 3: CÔNG THỨC RUNNING TOTAL & TĂNG TRƯỞNG (YoY/MoM)
-- Window functions: dùng trực tiếp khi query
-- ============================================================

-- Ví dụ: Doanh thu luỹ kế theo tháng + tăng trưởng so với tháng trước
-- (gọi từ backend khi cần)
CREATE OR REPLACE VIEW v_revenue_monthly_with_growth AS
SELECT
  yr,
  mon,
  revenue_cents,
  SUM(revenue_cents) OVER (PARTITION BY yr ORDER BY mon) AS cumulative_revenue,
  LAG(revenue_cents) OVER (PARTITION BY yr ORDER BY mon) AS prev_month_revenue,
  ROUND(
    100.0 * (revenue_cents - LAG(revenue_cents) OVER (PARTITION BY yr ORDER BY mon))
    / NULLIF(LAG(revenue_cents) OVER (PARTITION BY yr ORDER BY mon), 0), 2
  ) AS mom_growth_pct
FROM (
  SELECT yr, mon, SUM(revenue_cents) AS revenue_cents
  FROM mv_revenue_daily
  GROUP BY yr, mon
) m
ORDER BY yr, mon;
