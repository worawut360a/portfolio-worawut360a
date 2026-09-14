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

export type WorkloadCategory =
  typeof WORKLOAD_CATEGORIES[number]

export interface Workload {
  id: number
  academic_year: number
  semester: number
  category: string

  subject_code: string
  subject_name: string
  grade_level: string

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


/* ============================================================
   เตรียมตาราง
   รองรับฐานข้อมูลเดิมที่มี workloads อยู่แล้ว
   ============================================================ */

let setupPromise: Promise<void> | null = null

async function ensureTables() {

  if (setupPromise) {
    return setupPromise
  }

  setupPromise = (async () => {

    /*
     * ตารางหลัก
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS workloads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        academic_year INTEGER NOT NULL,
        semester INTEGER NOT NULL DEFAULT 1,

        category TEXT NOT NULL,

        subject_code TEXT NOT NULL DEFAULT '',
        subject_name TEXT NOT NULL DEFAULT '',
        grade_level TEXT NOT NULL DEFAULT '',

        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',

        hours REAL NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        deleted_at TEXT NULL
      )
    `)


    /*
     * ตารางเก็บรูปและไฟล์หลักฐาน
     */
    await db.execute(`
      CREATE TABLE IF NOT EXISTS workload_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        workload_id INTEGER NOT NULL,

        source TEXT NOT NULL DEFAULT 'drive',
        ref TEXT NOT NULL,

        media_type TEXT NOT NULL DEFAULT 'image',

        original_name TEXT NOT NULL DEFAULT '',
        caption TEXT NOT NULL DEFAULT '',

        sort_order INTEGER NOT NULL DEFAULT 0,

        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (workload_id)
          REFERENCES workloads(id)
          ON DELETE CASCADE
      )
    `)


    /*
     * ฐานข้อมูลเดิมของเว็บมี workloads อยู่แล้ว
     * แต่ยังไม่มีช่อง รหัสวิชา / รายวิชา / ชั้น
     *
     * ตรวจสอบก่อน แล้วค่อยเพิ่มเฉพาะช่องที่ยังไม่มี
     */
    const columns = await all<{ name: string }>(
      `PRAGMA table_info(workloads)`
    )

    const names = new Set(
      columns.map((c) => String(c.name))
    )


    const additions = [
      [
        'subject_code',
        `
          ALTER TABLE workloads
          ADD COLUMN subject_code
          TEXT NOT NULL DEFAULT ''
        `,
      ],

      [
        'subject_name',
        `
          ALTER TABLE workloads
          ADD COLUMN subject_name
          TEXT NOT NULL DEFAULT ''
        `,
      ],

      [
        'grade_level',
        `
          ALTER TABLE workloads
          ADD COLUMN grade_level
          TEXT NOT NULL DEFAULT ''
        `,
      ],
    ] as const


    for (const [name, sql] of additions) {

      if (!names.has(name)) {
        await db.execute(sql)
      }

    }

  })()


  try {

    await setupPromise

  } catch (error) {

    setupPromise = null

    throw error

  }

}


/* ============================================================
   อ่านรายการภาระงาน
   ============================================================ */

export async function getWorkloads(): Promise<Workload[]> {

  await ensureTables()

  return all<Workload>(`

    SELECT

      w.id,
      w.academic_year,
      w.semester,
      w.category,

      w.subject_code,
      w.subject_name,
      w.grade_level,

      w.title,
      w.description,
      w.hours,


      /* รูปหลักฐาน */
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


      /* ไฟล์หลักฐาน */
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


      COALESCE(

        (
          SELECT MIN(wm.sort_order)

          FROM workload_media wm

          WHERE wm.workload_id = w.id
        ),

        0

      ) AS sort_order


    FROM workloads w


    WHERE w.deleted_at IS NULL


    ORDER BY
      w.category,
      sort_order,
      w.id

  `)

}


/* ============================================================
   อ่านภาระงาน 1 รายการ
   ============================================================ */

export async function getWorkload(
  id: number
): Promise<Workload | null> {

  await ensureTables()

  return one<Workload>(`

    SELECT

      w.id,
      w.academic_year,
      w.semester,
      w.category,

      w.subject_code,
      w.subject_name,
      w.grade_level,

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


      COALESCE(

        (
          SELECT MIN(wm.sort_order)

          FROM workload_media wm

          WHERE wm.workload_id = w.id
        ),

        0

      ) AS sort_order


    FROM workloads w


    WHERE w.id = ?
      AND w.deleted_at IS NULL

  `, [id])

}


/* ============================================================
   บันทึกภาระงาน
   ============================================================ */

export async function saveWorkload(
  f: FormData
): Promise<{ ok: boolean; error?: string }> {

  'use server'

  await requireAdmin()

  await ensureTables()


  const id =
    int(f, 'id')


  const academicYear =
    int(f, 'academic_year')


  const semester =
    int(f, 'semester')


  const category =
    str(f, 'category', 200)


  const subjectCode =
    str(f, 'subject_code', 100)


  const subjectName =
    str(f, 'subject_name', 255)


  const gradeLevel =
    str(f, 'grade_level', 100)


  const title =
    str(f, 'title', 255)


  const description =
    str(f, 'description', 5000)


  const hours =
    num(f, 'hours')


  const sortOrder =
    int(f, 'sort_order')


  const image =
    media(f, 'image')


  const file =
    media(f, 'file')


  const fileName =
    str(f, 'file_name', 255)


  const t =
    now()


  /* ตรวจสอบข้อมูล */

  if (
    academicYear < 2500 ||
    academicYear > 2700
  ) {

    return {
      ok: false,
      error: 'ปีการศึกษาไม่ถูกต้อง',
    }

  }


  if (
    semester !== 1 &&
    semester !== 2
  ) {

    return {
      ok: false,
      error: 'ภาคเรียนไม่ถูกต้อง',
    }

  }


  if (
    !(WORKLOAD_CATEGORIES as readonly string[])
      .includes(category)
  ) {

    return {
      ok: false,
      error: 'กรุณาเลือกหมวดภาระงาน',
    }

  }


  if (!subjectCode) {

    return {
      ok: false,
      error: 'กรุณากรอกรหัสวิชา',
    }

  }


  if (!subjectName) {

    return {
      ok: false,
      error: 'กรุณากรอกรายวิชา',
    }

  }


  if (!gradeLevel) {

    return {
      ok: false,
      error: 'กรุณากรอกชั้น',
    }

  }


  if (!title) {

    return {
      ok: false,
      error: 'กรุณากรอกชื่อภาระงาน',
    }

  }


  if (
    hours < 0 ||
    hours > 100
  ) {

    return {
      ok: false,
      error:
        'จำนวนชั่วโมงต้องอยู่ระหว่าง 0–100 ชั่วโมง/สัปดาห์',
    }

  }


  /* ==========================================================
     แก้ไขรายการเดิม
     ========================================================== */

  if (id) {

    const exists =
      await one<{ id: number }>(

        `
          SELECT id

          FROM workloads

          WHERE id = ?
            AND deleted_at IS NULL
        `,

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

          subject_code = ?,
          subject_name = ?,
          grade_level = ?,

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

        subjectCode,
        subjectName,
        gradeLevel,

        title,
        description,

        hours,

        t,

        id,

      ],

    })


    /*
     * ลบหลักฐานเดิม
     */
    await db.execute({

      sql: `
        DELETE FROM workload_media
        WHERE workload_id = ?
      `,

      args: [id],

    })


    /*
     * เพิ่มรูปใหม่
     */
    if (
      image.source &&
      image.ref
    ) {

      await db.execute({

        sql: `

          INSERT INTO workload_media
          (
            workload_id,
            source,
            ref,
            media_type,
            original_name,
            caption,
            sort_order,
            created_at
          )

          VALUES
          (
            ?,
            ?,
            ?,
            'image',
            '',
            '',
            0,
            ?
          )

        `,

        args: [

          id,

          image.source,

          image.ref,

          t,

        ],

      })

    }


    /*
     * เพิ่มไฟล์ใหม่
     */
    if (
      file.source &&
      file.ref
    ) {

      await db.execute({

        sql: `

          INSERT INTO workload_media
          (
            workload_id,
            source,
            ref,
            media_type,
            original_name,
            caption,
            sort_order,
            created_at
          )

          VALUES
          (
            ?,
            ?,
            ?,
            'file',
            ?,
            '',
            1,
            ?
          )

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


  /* ==========================================================
     เพิ่มรายการใหม่
     ========================================================== */

  else {

    const result =
      await db.execute({

        sql: `

          INSERT INTO workloads
          (
            academic_year,
            semester,
            category,

            subject_code,
            subject_name,
            grade_level,

            title,
            description,

            hours,

            created_at,
            updated_at
          )

          VALUES
          (
            ?,
            ?,
            ?,

            ?,
            ?,
            ?,

            ?,
            ?,

            ?,

            ?,
            ?
          )

        `,

        args: [

          academicYear,
          semester,
          category,

          subjectCode,
          subjectName,
          gradeLevel,

          title,
          description,

          hours,

          t,
          t,

        ],

      })


    const newId =
      Number(result.lastInsertRowid)


    /*
     * รูป
     */
    if (
      image.source &&
      image.ref
    ) {

      await db.execute({

        sql: `

          INSERT INTO workload_media
          (
            workload_id,
            source,
            ref,
            media_type,
            original_name,
            caption,
            sort_order,
            created_at
          )

          VALUES
          (
            ?,
            ?,
            ?,
            'image',
            '',
            '',
            0,
            ?
          )

        `,

        args: [

          newId,

          image.source,

          image.ref,

          t,

        ],

      })

    }


    /*
     * ไฟล์
     */
    if (
      file.source &&
      file.ref
    ) {

      await db.execute({

        sql: `

          INSERT INTO workload_media
          (
            workload_id,
            source,
            ref,
            media_type,
            original_name,
            caption,
            sort_order,
            created_at
          )

          VALUES
          (
            ?,
            ?,
            ?,
            'file',
            ?,
            '',
            1,
            ?
          )

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


  /*
   * บังคับให้หน้าบ้าน/หลังบ้านดึงข้อมูลใหม่
   */
  revalidatePath('/workload')

  revalidatePath('/admin/workload')


  return {
    ok: true,
  }

}


/* ============================================================
   ลบภาระงาน
   ============================================================ */

export async function deleteWorkload(
  id: number
): Promise<{ ok: boolean; error?: string }> {

  'use server'

  await requireAdmin()

  await ensureTables()


  await db.execute({

    sql: `

      UPDATE workloads

      SET

        deleted_at = ?,
        updated_at = ?

      WHERE id = ?

        AND deleted_at IS NULL

    `,

    args: [
      now(),
      now(),
      id,
    ],

  })


  revalidatePath('/workload')

  revalidatePath('/admin/workload')


  return {
    ok: true,
  }

}
