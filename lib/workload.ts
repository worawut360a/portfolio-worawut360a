import 'server-only'

import { revalidatePath } from 'next/cache'
import { db, all, one, now } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { str, int, num, media } from '@/lib/form'

export const WORKLOAD_CATEGORIES = [
  'การจัดการเรียนรู้',
  'งานส่งเสริมและสนับสนุนการจัดการเรียนรู้',
  'งานพัฒนาคุณภาพการศึกษาของสถานศึกษา',
  'งานตอบสนองนโยบายและจุดเน้น',
] as const

export type WorkloadCategory = typeof WORKLOAD_CATEGORIES[number]

export interface Workload {
  id: number
  academic_year: number
  semester: number
  category: string
  title: string
  description: string
  hours: number
  image_source: 'drive' | 'static' | null
  image_ref: string | null
  file_source: 'drive' | 'static' | null
  file_ref: string | null
  file_name: string
  sort_order: number
}

let ready = false

async function ensureTables() {
  if (ready) return

  await db.batch([
    `CREATE TABLE IF NOT EXISTS workloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year INTEGER NOT NULL,
      semester INTEGER NOT NULL DEFAULT 1,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      hours REAL NOT NULL DEFAULT 0,
      image_source TEXT NULL,
      image_ref TEXT NULL,
      file_source TEXT NULL,
      file_ref TEXT NULL,
      file_name TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT NULL
    )`,
  ], 'write')

  ready = true
}

export async function getWorkloads(): Promise<Workload[]> {
  await ensureTables()

  return all<Workload>(`
    SELECT
      id,
      academic_year,
      semester,
      category,
      title,
      description,
      hours,
      image_source,
      image_ref,
      file_source,
      file_ref,
      file_name,
      sort_order
    FROM workloads
    WHERE deleted_at IS NULL
    ORDER BY category, sort_order, id
  `)
}

export async function getWorkload(id: number): Promise<Workload | null> {
  await ensureTables()

  return one<Workload>(`
    SELECT
      id,
      academic_year,
      semester,
      category,
      title,
      description,
      hours,
      image_source,
      image_ref,
      file_source,
      file_ref,
      file_name,
      sort_order
    FROM workloads
    WHERE id = ? AND deleted_at IS NULL
  `, [id])
}

export async function saveWorkload(f: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await ensureTables()

  const id = int(f, 'id')
  const academicYear = int(f, 'academic_year')
  const semester = int(f, 'semester')
  const category = str(f, 'category', 200)
  const title = str(f, 'title', 255)
  const description = str(f, 'description', 5000)
  const hours = num(f, 'hours')
  const sortOrder = int(f, 'sort_order')

  if (academicYear < 2500 || academicYear > 2700) {
    return { ok: false, error: 'ปีการศึกษาไม่ถูกต้อง' }
  }

  if (semester !== 1 && semester !== 2) {
    return { ok: false, error: 'ภาคเรียนไม่ถูกต้อง' }
  }

  if (!(WORKLOAD_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, error: 'กรุณาเลือกหมวดภาระงาน' }
  }

  if (!title) {
    return { ok: false, error: 'กรุณากรอกชื่อภาระงาน' }
  }

  if (hours < 0 || hours > 100) {
    return { ok: false, error: 'จำนวนชั่วโมงต้องอยู่ระหว่าง 0–100 ชั่วโมง/สัปดาห์' }
  }

  const image = media(f, 'image')
  const file = media(f, 'file')
  const fileName = str(f, 'file_name', 255)
  const t = now()

  if (id) {
    const exists = await one(
      'SELECT id FROM workloads WHERE id = ? AND deleted_at IS NULL',
      [id]
    )

    if (!exists) {
      return { ok: false, error: 'ไม่พบภาระงานที่ต้องการแก้ไข' }
    }

    await db.execute({
      sql: `
        UPDATE workloads
        SET
          academic_year = ?,
          semester = ?,
          category = ?,
          title = ?,
          description = ?,
          hours = ?,
          image_source = ?,
          image_ref = ?,
          file_source = ?,
          file_ref = ?,
          file_name = ?,
          sort_order = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        academicYear,
        semester,
        category,
        title,
        description,
        hours,
        image.source,
        image.ref,
        file.source,
        file.ref,
        fileName,
        sortOrder,
        t,
        id,
      ],
    })
  } else {
    const result = await db.execute({
      sql: `
        INSERT INTO workloads (
          academic_year,
          semester,
          category,
          title,
          description,
          hours,
          image_source,
          image_ref,
          file_source,
          file_ref,
          file_name,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        academicYear,
        semester,
        category,
        title,
        description,
        hours,
        image.source,
        image.ref,
        file.source,
        file.ref,
        fileName,
        sortOrder,
        t,
        t,
      ],
    })

    void result
  }

  revalidatePath('/workload')
  revalidatePath('/admin/workload')

  return { ok: true }
}

export async function deleteWorkload(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await ensureTables()

  await db.execute({
    sql: `
      UPDATE workloads
      SET deleted_at = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `,
    args: [now(), now(), id],
  })

  revalidatePath('/workload')
  revalidatePath('/admin/workload')

  return { ok: true }
}
