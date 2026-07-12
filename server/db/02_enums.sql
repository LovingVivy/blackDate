-- ============================================================
-- 02_enums.sql
-- Các kiểu ENUM dùng chung trong hệ thống
-- Dùng ENUM thay vì VARCHAR để đảm bảo tính toàn vẹn dữ liệu
-- ============================================================

-- Vai trò người dùng
CREATE TYPE user_role AS ENUM ('customer', 'companion', 'admin');

-- Trạng thái tài khoản
CREATE TYPE account_status AS ENUM ('active', 'suspended', 'deleted');

-- Trạng thái lịch hẹn
CREATE TYPE booking_status AS ENUM (
  'pending',      -- chờ xác nhận
  'confirmed',    -- đã xác nhận
  'in_progress',  -- đang diễn ra
  'completed',    -- đã hoàn thành
  'cancelled',    -- đã hủy
  'no_show'       -- vắng mặt
);

-- Trạng thái thanh toán
CREATE TYPE payment_status AS ENUM (
  'pending',      -- chờ thanh toán
  'paid',         -- đã thanh toán
  'refunded',     -- đã hoàn tiền
  'failed'        -- thất bại
);

-- Phương thức thanh toán
CREATE TYPE payment_method AS ENUM ('cod', 'bank_transfer', 'momo', 'vnpt_epay', 'stripe');

-- Trạng thái bạn đồng hành
CREATE TYPE companion_status AS ENUM ('available', 'busy', 'offline');

-- Loại event người dùng (cho bảng events)
CREATE TYPE event_type AS ENUM (
  'page_view',
  'companion_view',
  'booking_started',
  'booking_completed',
  'payment_success',
  'payment_failed',
  'review_submitted',
  'search',
  'favorite_added',
  'favorite_removed',
  'login',
  'logout'
);
