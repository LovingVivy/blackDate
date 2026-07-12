/**
 * migrate.js
 * Chạy toàn bộ schema SQL lên Neon (PostgreSQL).
 *
 * Cách chạy:
 *   npm run migrate          (từ server workspace)
 *   node scripts/migrate.js  (chạy trực tiếp)
 *
 * Đọc DATABASE_URL từ server/.env rồi chạy lần lượt 7 file SQL
 * theo đúng thứ tự số (để đảm bảo ENUM/FK tạo trước).
 */
import 'dotenv/config'
import { Client } from 'pg'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Các file SQL theo đúng thứ tự chạy
const SQL_FILES = [
  '01_extensions.sql',
  '02_enums.sql',
  '03_oltp_tables.sql',
  '04_events_partitioned.sql',
  '05_indexes.sql',
  '06_revenue_reporting.sql',
  '07_triggers.sql',
  '08_app_state.sql',
]

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('❌ Thiếu DATABASE_URL trong file .env')
    process.exit(1)
  }

  console.log('🔌 Đang kết nối tới Neon...')
  const client = new Client({
    connectionString,
    // Neon yêu cầu SSL
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('✅ Đã kết nối.\n')

    for (const file of SQL_FILES) {
      const filePath = resolve(__dirname, '../db', file)
      process.stdout.write(`▶ Đang chạy ${file} ... `)
      try {
        const sql = await readFile(filePath, 'utf8')
        await client.query(sql)
        console.log('✅')
      } catch (err) {
        console.log('❌ LỖI')
        console.error(`   ${err.message}`)
        console.error(`   (dừng tại file ${file})`)
        process.exit(1)
      }
    }

    console.log('\n🎉 Tất cả schema đã được tạo thành công!')

    // Kiểm tra nhanh: liệt kê các bảng đã tạo
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `)
    console.log(`\n📋 Các bảng đã tạo (${rows.length}):`)
    for (const r of rows) console.log(`   - ${r.tablename}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\n💥 Lỗi không xác định:', err)
  process.exit(1)
})
