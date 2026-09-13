'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now, one, all } from '@/lib/db'
import { str, int, num, date, pick, media } from '@/lib/form'
import type { Profile, Agreement } from '@/lib/types'

const STATUS = ['draft', 'in_progress', 'evaluated'] as const
const RESULT = ['', 'pass', 'fail'] as const

/** ผลลัพธ์ที่ส่งกลับให้ฟอร์มฝั่ง client — ok=false พร้อมข้อความไว้โชว์ใต้ช่องกรอก */
export type Result = { ok: true; id?: number } | { ok: false; error: string }

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/* ============================================================ สร้างปีงบประมาณใหม่ */

/**
 * สร้างข้อตกลงของปีงบประมาณใหม่
 * copy_from = id ของปีที่จะคัดลอกโครง 15 ตัวชี้วัดมา (0 = เริ่มจากแบบเปล่า)
 * ค่าตั้งต้นอื่น ๆ ดึงจากปีที่คัดลอก ถ้าไม่มีก็ใช้ประวัติครู
 */
export async function newYear(f: FormData): Promise<Result> {
  await requireAdmin()

  const fy = int(f, 'fiscal_year')
  if (fy < 2500 || fy > 2700) return { ok: false, error: 'ปีงบประมาณต้องอยู่ระหว่าง 2500–2700' }
  if (await one('SELECT id FROM pa_agreements WHERE fiscal_year = ? AND deleted_at IS NULL', [fy]))
    return { ok: false, error: `มีข้อตกลงของปีงบประมาณ ${fy} อยู่แล้ว` }

  const profile = await one<Profile>('SELECT * FROM profile WHERE id = 1')
  const copyFrom = int(f, 'copy_from')
  const src = copyFrom
    ? await one<Agreement>('SELECT * FROM pa_agreements WHERE id = ? AND deleted_at IS NULL', [copyFrom])
    : null

  const t = now()
  const res = await db.execute({
    sql: `INSERT INTO pa_agreements (fiscal_year, round, period_start, period_end, position,
            academic_standing, school, affiliation, subject_group, teaching_hours, support_hours,
            status, note, created_at, updated_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      fy, clamp(int(f, 'round', 1), 1, 2),
      `${fy - 544}-10-01`,   // 1 ต.ค. ปีก่อนหน้า (ค.ศ.)
      `${fy - 543}-09-30`,   // 30 ก.ย. ปีนั้น (ค.ศ.)
      src?.position ?? profile?.position ?? '',
      src?.academic_standing ?? profile?.academic_standing ?? '',
      src?.school ?? profile?.school ?? '',
      src?.affiliation ?? profile?.area_office ?? '',
      src?.subject_group ?? profile?.subject_group ?? '',
      src?.teaching_hours ?? profile?.teaching_hours ?? 0,
      src?.support_hours ?? 0,
      'draft',
      src ? `คัดลอกโครงจากปีงบประมาณ ${src.fiscal_year}` : '',
      t, t,
    ],
  })
  const newId = Number(res.lastInsertRowid)

  if (src) {
    await db.execute({
      sql: `INSERT INTO pa_details (agreement_id, indicator_id, task_description,
              expected_quantity, expected_quality, sort_order, created_at, updated_at)
            SELECT ?, indicator_id, task_description, expected_quantity, expected_quality, sort_order, ?, ?
            FROM pa_details WHERE agreement_id = ?`,
      args: [newId, t, t, src.id],
    })
  }

  await logAction('เพิ่มข้อตกลง PA', 'pa_agreements', newId, `ปีงบประมาณ ${fy}`)
  revalidatePath('/', 'layout')
  return { ok: true, id: newId }
}

/* ============================================================ ตอนที่ 1 · ข้อมูลผู้จัดทำ */

export async function saveAgreementInfo(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const cur = await one<Agreement>('SELECT * FROM pa_agreements WHERE id = ? AND deleted_at IS NULL', [id])
  if (!cur) return { ok: false, error: 'ไม่พบข้อตกลงนี้' }

  const score = str(f, 'evaluation_score', 10)
  const result = pick(f, 'evaluation_result', RESULT, '')

  await db.execute({
    sql: `UPDATE pa_agreements SET round=?, period_start=?, period_end=?, position=?,
            academic_standing=?, school=?, affiliation=?, subject_group=?, teaching_hours=?,
            support_hours=?, status=?, evaluation_score=?, evaluation_result=?, note=?, updated_at=?
          WHERE id=?`,
    args: [
      clamp(int(f, 'round', 1), 1, 2), date(f, 'period_start'), date(f, 'period_end'),
      str(f, 'position', 100), str(f, 'academic_standing', 100), str(f, 'school', 200),
      str(f, 'affiliation', 200), str(f, 'subject_group', 200),
      num(f, 'teaching_hours'), num(f, 'support_hours'),
      pick(f, 'status', STATUS, 'draft'),
      score === '' ? null : clamp(num(f, 'evaluation_score'), 0, 100),
      result === '' ? null : result,
      str(f, 'note', 500), now(), id,
    ],
  })

  await logAction('แก้ไขข้อตกลง PA', 'pa_agreements', id, `ปีงบประมาณ ${cur.fiscal_year}`)
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

/* ============================================================ ไฟล์ PDF (PA1/ส) */

export async function savePdf(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const cur = await one<Agreement>('SELECT * FROM pa_agreements WHERE id = ? AND deleted_at IS NULL', [id])
  if (!cur) return { ok: false, error: 'ไม่พบข้อตกลงนี้' }

  const pdf = media(f, 'pdf')
  if (!pdf.ref) return { ok: false, error: 'ยังไม่ได้วางลิงก์ไฟล์ PDF จาก Google Drive' }

  await db.execute({
    sql: 'UPDATE pa_agreements SET pdf_source=?, pdf_ref=?, pdf_name=?, updated_at=? WHERE id=?',
    args: [pdf.source, pdf.ref, str(f, 'pdf_name', 200) || 'แบบบันทึกข้อตกลง PA1/ส.pdf', now(), id],
  })

  await logAction('แก้ไขข้อตกลง PA', 'pa_agreements', id, `ไฟล์ PDF ปีงบประมาณ ${cur.fiscal_year}`)
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

export async function removePdf(id: number): Promise<Result> {
  await requireAdmin()
  await db.execute({
    sql: 'UPDATE pa_agreements SET pdf_source=NULL, pdf_ref=NULL, pdf_name=NULL, updated_at=? WHERE id=?',
    args: [now(), id],
  })
  await logAction('แก้ไขข้อตกลง PA', 'pa_agreements', id, 'ลบไฟล์ PDF')
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

/* ============================================================ ตอนที่ 2 · ข้อตกลงรายตัวชี้วัด */

export async function saveDetail(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const agreementId = int(f, 'agreement_id')
  const indicatorId = int(f, 'indicator_id')
  const task = str(f, 'task_description', 1000)
  if (!agreementId) return { ok: false, error: 'ไม่พบปีงบประมาณ' }
  if (!indicatorId) return { ok: false, error: 'กรุณาเลือกตัวชี้วัด' }
  if (!task) return { ok: false, error: 'กรุณากรอกงานที่จะปฏิบัติ' }

  // 1 ตัวชี้วัดมีข้อตกลงได้ข้อเดียวต่อปี — กันกรอกซ้ำจนแถวซ้อนกันในหน้าเว็บ
  const dup = await one<{ id: number }>(
    'SELECT id FROM pa_details WHERE agreement_id = ? AND indicator_id = ? AND id <> ?',
    [agreementId, indicatorId, id])
  if (dup) return { ok: false, error: 'ตัวชี้วัดนี้กรอกข้อตกลงของปีนี้ไว้แล้ว' }

  const qty = str(f, 'expected_quantity', 400)
  const qual = str(f, 'expected_quality', 400)
  const t = now()

  if (id) {
    await db.execute({
      sql: `UPDATE pa_details SET indicator_id=?, task_description=?, expected_quantity=?,
              expected_quality=?, updated_at=? WHERE id=? AND agreement_id=?`,
      args: [indicatorId, task, qty, qual, t, id, agreementId],
    })
  } else {
    const order = await one<{ n: number }>(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM pa_details WHERE agreement_id = ?', [agreementId])
    await db.execute({
      sql: `INSERT INTO pa_details (agreement_id, indicator_id, task_description,
              expected_quantity, expected_quality, sort_order, created_at, updated_at)
            VALUES (?,?,?,?,?,?,?,?)`,
      args: [agreementId, indicatorId, task, qty, qual, Number(order?.n ?? 0), t, t],
    })
  }

  await logAction(id ? 'แก้ไขข้อตกลง PA' : 'เพิ่มข้อตกลง PA', 'pa_details', id || agreementId, task.slice(0, 60))
  revalidatePath('/', 'layout')
  return { ok: true, id: agreementId }
}

export async function deleteDetail(id: number): Promise<Result> {
  await requireAdmin()
  await db.execute({ sql: 'DELETE FROM pa_details WHERE id = ?', args: [id] })
  await logAction('ลบข้อตกลง PA', 'pa_details', id)
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

/* ============================================================ ตอนที่ 3 · ประเด็นท้าทาย */

export async function saveChallenge(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const agreementId = int(f, 'agreement_id')
  const topic = str(f, 'topic', 300)
  if (!agreementId) return { ok: false, error: 'ไม่พบปีงบประมาณ' }
  if (!topic) return { ok: false, error: 'กรุณากรอกชื่อประเด็นท้าทาย' }

  const args = [
    topic, str(f, 'problem_statement', 2000), str(f, 'method', 2000),
    str(f, 'expected_outcome', 2000), now(),
  ]

  if (id) {
    await db.execute({
      sql: `UPDATE pa_challenges SET topic=?, problem_statement=?, method=?,
              expected_outcome=?, updated_at=? WHERE id=? AND agreement_id=?`,
      args: [...args, id, agreementId],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO pa_challenges (topic, problem_statement, method, expected_outcome,
              updated_at, agreement_id, created_at) VALUES (?,?,?,?,?,?,?)`,
      args: [...args, agreementId, now()],
    })
  }

  await logAction(id ? 'แก้ไขประเด็นท้าทาย' : 'เพิ่มประเด็นท้าทาย', 'pa_challenges', id || agreementId, topic.slice(0, 60))
  revalidatePath('/', 'layout')
  return { ok: true, id: agreementId }
}

export async function deleteChallenge(id: number): Promise<Result> {
  await requireAdmin()
  await db.execute({ sql: 'DELETE FROM pa_challenges WHERE id = ?', args: [id] })
  await logAction('ลบประเด็นท้าทาย', 'pa_challenges', id)
  revalidatePath('/', 'layout')
  return { ok: true, id }
}

/* ============================================================ ลบทั้งปี */

export async function deleteAgreement(id: number): Promise<Result> {
  await requireAdmin()
  const cur = await one<Agreement>('SELECT fiscal_year FROM pa_agreements WHERE id = ?', [id])
  await db.execute({ sql: 'UPDATE pa_agreements SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบข้อตกลง PA', 'pa_agreements', id, `ปีงบประมาณ ${cur?.fiscal_year ?? ''}`)
  revalidatePath('/', 'layout')
  return { ok: true }
}

/** ตัวชี้วัดทั้งหมดสำหรับ dropdown ในโมดัล — ใช้ตอนสลับปี */
export async function listIndicators() {
  await requireAdmin()
  return all('SELECT id, code, name, domain_id FROM indicators ORDER BY sort_order')
}
