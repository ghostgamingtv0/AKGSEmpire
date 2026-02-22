import 'dotenv/config'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { pool } from './db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  const [rows] = await pool.query('SELECT * FROM users')
  const json = JSON.stringify(rows, null, 2)
  const outPath = join(__dirname, 'USER_EXPORT.json')
  fs.writeFileSync(outPath, json, 'utf8')
  console.log('User export written to', outPath)
}

main().then(() => {
  process.exit(0)
}).catch(err => {
  console.error('User export failed', err)
  process.exit(1)
})
