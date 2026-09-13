/**
 * รวมไฟล์ .sql เข้าไปเป็นโมดูล TypeScript
 * เพื่อให้หน้า /setup รัน schema ได้เองบน Netlify โดยไม่ต้องอ่านไฟล์ตอนทำงาน
 * (serverless อ่านไฟล์ในโปรเจกต์ไม่ได้เสมอไป การฝังไว้ในโค้ดแน่นอนกว่า)
 *
 * รันอัตโนมัติทุกครั้งก่อน build และก่อน dev
 */
import { readFileSync, writeFileSync } from 'node:fs'

const files = {
  SCHEMA_SQL: 'db/schema.sql',
  SEED_CORE_SQL: 'db/seed-core.sql',
  SEED_DEMO_SQL: 'db/seed-demo.sql',
}

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

let out = `// ไฟล์นี้สร้างอัตโนมัติโดย scripts/bundle-sql.mjs — อย่าแก้ด้วยมือ\n`
out += `// แก้ที่ db/*.sql แล้วรัน npm run gen:sql\n\n`
for (const [name, path] of Object.entries(files)) {
  out += `export const ${name} = \`${esc(readFileSync(path, 'utf8'))}\`\n\n`
}
writeFileSync('lib/sql-bundle.ts', out)
console.log('สร้าง lib/sql-bundle.ts แล้ว:', Object.values(files).join(', '))
