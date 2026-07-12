/**
 * tables.js — tiện ích xem nhanh các bảng & cấu trúc trên Neon.
 *
 * Cách chạy:
 *   npm run tables                 (xem danh sách tất cả bảng)
 *   node scripts/tables.js         (tương tự)
 *   node scripts/tables.js users   (xem chi tiết bảng users)
 */
import 'dotenv/config'
import { Client } from 'pg'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const argTable = process.argv[2]

async function main() {
  await client.connect()

  if (!argTable) {
    // Liệt kê tất cả bảng + số dòng
    const { rows } = await client.query(`
      SELECT
        c.relname AS table_name,
        c.reltuples::bigint AS approx_rows,
        pg_size_pretty(pg_total_relation_size(c.oid)) AS size
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'r'
        AND n.nspname = 'public'
      ORDER BY c.relname;
    `)
    console.log('\n📋 Các bảng trong schema public:\n')
    console.table(rows)
    console.log(`Tổng cộng: ${rows.length} bảng\n`)
  } else {
    // Xem chi tiết 1 bảng
    const { rows } = await client.query(`
      SELECT
        a.attname AS column_name,
        format_type(a.atttypid, a.atttypmod) AS data_type,
        a.attnotnull AS not_null,
        COALESCE(pg_get_constraintdef(con.oid), '') AS constraint_def
      FROM pg_attribute a
      LEFT JOIN pg_constraint con
        ON con.conrelid = a.attrelid
       AND a.attnum = ANY(con.conkey)
      WHERE a.attrelid = $1::regclass
        AND a.attnum > 0
        AND NOT a.attisdropped
      ORDER BY a.attnum;
    `, [argTable])
    console.log(`\n🏗️  Cấu trúc bảng "${argTable}":\n`)
    console.table(rows)
  }
}

main()
  .catch((e) => { console.error('❌', e.message); process.exit(1) })
  .finally(() => client.end())
