-- ============================================================
-- 01_extensions.sql
-- Kích hoạt các extension cần thiết cho BlackDate
-- ============================================================

-- pgcrypto: hỗ trợ hàm gen_random_uuid() để tạo UUID v4
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- citext: so sánh chuỗi không phân biệt hoa thường (cho email)
CREATE EXTENSION IF NOT EXISTS citext;

-- btree_gin: hỗ trợ index kết hợp giữa kiểu btree và GIN (cho tags)
CREATE EXTENSION IF NOT EXISTS btree_gin;
