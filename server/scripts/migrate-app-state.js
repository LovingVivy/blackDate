import 'dotenv/config'
import { Client } from 'pg'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('Thiếu DATABASE_URL trong file .env')
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    const sql = await readFile(resolve(__dirname, '../db/08_app_state.sql'), 'utf8')
    await client.query(sql)
    console.log('Đã tạo/cập nhật bảng app_settings và user_favorite_items.')
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
