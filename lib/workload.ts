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

  // รูป/ไฟล์จะอ่านจาก workload_media
  image_source: 'drive' | 'static' | null
  image_ref: string | null

  file_source: 'drive' | 'static' | null
  file_ref: string | null
  file_name: string

  sort_order: number
}

/**
 * อ่านข้อมูลภาระงาน
 *
 * สำคัญ:
 * ตาราง workloads เก็บข้อมูลหลัก
 * ส่วนรูป/ไฟล์เก็บใน workload_media
 */
export async function getWorkloads(): Promise<Workload[]> {
  return all<Workload>(`
    SELECT
      w.id,
      w.academic_year,
      w.semester,
      w.category,
      w.title,
      w.description,
      w.hours,

      (
        SELECT wm.source
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'image'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS image_source,

      (
        SELECT wm.ref
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'image'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS image_ref,

      (
        SELECT wm.source
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'file'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS file_source,

      (
        SELECT wm.ref
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'file'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS file_ref,

      (
        SELECT wm.original_name
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'file'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS file_name,

      (
        SELECT MIN(wm.sort_order)
        FROM workload_media wm
        WHERE wm.workload_id = w.id
      ) AS sort_order

    FROM workloads w
    WHERE w.deleted_at IS NULL
    ORDER BY w.category, sort_order, w.id
  `)
}

export async function getWorkload(id: number): Promise<Workload | null> {
  return one<Workload>(`
    SELECT
      w.id,
      w.academic_year,
      w.semester,
      w.category,
      w.title,
      w.description,
      w.hours,

      (
        SELECT wm.source
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'image'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS image_source,

      (
        SELECT wm.ref
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'image'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS image_ref,

      (
        SELECT wm.source
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'file'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS file_source,

      (
        SELECT wm.ref
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'file'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS file_ref,

      (
        SELECT wm.original_name
        FROM workload_media wm
        WHERE wm.workload_id = w.id
          AND wm.media_type = 'file'
        ORDER BY wm.sort_order, wm.id
        LIMIT 1
      ) AS file_name,

      (
        SELECT MIN(wm.sort_order)
        FROM workload_media wm
        WHERE wm.workload_id = w.id
      ) AS sort_order

    FROM workloads w
    WHERE w.id = ?
      AND w.deleted_at IS NULL
  `, [id])
}


/* ============================================================
   เพิ่ม / แก้ไขภาระงาน
   ============================================================ */

export async function saveWorkload(
  f: FormData
): Promise<{ ok: boolean; error?: string }> {
  'use server'

  await requireAdmin()

  const id = int(f, 'id')
  const academicYear = int(f, 'academic_year')
  const semester = int(f, 'semester')
  const category = str(f, 'category', 200)
  const title = str(f, 'title', 255)
  const description = str(f, 'description', 5000)
  const hours = num(f, 'hours')
  const sortOrder = int(f, 'sort_order')

  if (academicYear < 2500 || academicYear > 2700) {
    return {
      ok: false,
      error: 'ปีการศึกษาไม่ถูกต้อง',
    }
  }

  if (semester !== 1 && semester !== 2) {
    return {
      ok: false,
      error: 'ภาคเรียนไม่ถูกต้อง',
    }
  }

  if (!(WORKLOAD_CATEGORIES as readonly string[]).includes(category)) {
    return {
      ok: false,
      error: 'กรุณาเลือกหมวดภาระงาน',
    }
  }

  if (!title) {
    return {
      ok: false,
      error: 'กรุณากรอกชื่อภาระงาน',
    }
  }

  if (hours < 0 || hours > 100) {
    return {
      ok: false,
      error: 'จำนวนชั่วโมงต้องอยู่ระหว่าง 0–100 ชั่วโมง/สัปดาห์',
    }
  }

  const image = media(f, 'image')
  const file = media(f, 'file')
  const fileName = str(f, 'file_name', 255)

  const t = now()

  /* ----------------------------------------------------------
     แก้ไข
     ---------------------------------------------------------- */

  if (id) {
    const exists = await one<{ id: number }>(
      'SELECT id FROM workloads WHERE id = ? AND deleted_at IS NULL',
      [id]
    )

    if (!exists) {
      return {
        ok: false,
        error: 'ไม่พบภาระงานที่ต้องการแก้ไข',
      }
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
        t,
        id,
      ],
    })

    // ลบไฟล์แนบเดิมก่อน
    await db.execute({
      sql: 'DELETE FROM workload_media WHERE workload_id = ?',
      args: [id],
    })

    // ใส่รูปใหม่
    if (image.ref && image.source) {
      await db.execute({
        sql: `
          INSERT INTO workload_media
            (workload_id, source, ref, media_type, original_name, caption, sort_order, created_at)
          VALUES (?, ?, ?, 'image', '', '', 0, ?)
        `,
        args: [
          id,
          image.source,
          image.ref,
          t,
        ],
      })
    }

    // ใส่ไฟล์ใหม่
    if (file.ref && file.source) {
      await db.execute({
        sql: `
          INSERT INTO workload_media
            (workload_id, source, ref, media_type, original_name, caption, sort_order, created_at)
          VALUES (?, ?, ?, 'file', ?, '', 1, ?)
        `,
        args: [
          id,
          file.source,
          file.ref,
          fileName,
          t,
        ],
      })
    }
  }

  /* ----------------------------------------------------------
     เพิ่มใหม่
     ---------------------------------------------------------- */

  else {
    const result = await db.execute({
      sql: `
        INSERT INTO workloads
          (
            academic_year,
            semester,
            category,
            title,
            description,
            hours,
            created_at,
            updated_at
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        academicYear,
        semester,
        category,
        title,
        description,
        hours,
        t,
        t,
      ],
    })

    const newId = Number(result.lastInsertRowid)

    // รูป
    if (image.ref && image.source) {
      await db.execute({
        sql: `
          INSERT INTO workload_media
            (workload_id, source, ref, media_type, original_name, caption, sort_order, created_at)
          VALUES (?, ?, ?, 'image', '', '', 0, ?)
        `,
        args: [
          newId,
          image.source,
          image.ref,
          t,
        ],
      })
    }

    // ไฟล์
    if (file.ref && file.source) {
      await db.execute({
        sql: `
          INSERT INTO workload_media
            (workload_id, source, ref, media_type, original_name, caption, sort_order, created_at)
          VALUES (?, ?, ?, 'file', ?, '', 1, ?)
        `,
        args: [
          newId,
          file.source,
          file.ref,
          fileName,
          t,
        ],
      })
    }
  }

  revalidatePath('/workload')
  revalidatePath('/admin/workload')

  return { ok: true }
}


/* ============================================================
   ลบภาระงาน
   ============================================================ */

export async function deleteWorkload(
  id: number
): Promise<{ ok: boolean; error?: string }> {
  'use server'

  await requireAdmin()

  await db.execute({
    sql: `
      UPDATE workloads
      SET
        deleted_at = ?,
        updated_at = ?
      WHERE id = ?
        AND deleted_at IS NULL
    `,
    args: [now(), now(), id],
  })

  revalidatePath('/workload')
  revalidatePath('/admin/workload')

  return { ok: true }
}
