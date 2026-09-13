'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now, one } from '@/lib/db'
import { str, int, num, bool, media } from '@/lib/form'

export type Result = { ok: true; id?: number } | { ok: false; error: string }

/* ---------------- โปรไฟล์ครู ---------------- */

export async function saveProfile(f: FormData): Promise<Result> {
  await requireAdmin()                     // ด่านตรวจ — ห้ามตัดออกเด็ดขาด

  const fullName = str(f, 'full_name', 150)
  if (!fullName) return { ok: false, error: 'กรุณากรอกชื่อ–สกุล' }

  const avatar = media(f, 'avatar')
  await db.execute({
    sql: `UPDATE teacher_profile SET
            full_name=?, nickname=?, position=?, academic_standing=?, subject_group=?,
            school=?, affiliation=?, area_office=?, email=?, phone=?, facebook=?, line_id=?,
            avatar_source=?, avatar_ref=?, avatar_focus_x=?, avatar_focus_y=?,
            motto=?, philosophy=?, bio=?, experience_years=?, teaching_hours=?, updated_at=?
          WHERE id = 1`,
    args: [
      fullName, str(f, 'nickname', 60), str(f, 'position', 100),
      str(f, 'academic_standing', 100), str(f, 'subject_group', 150),
      str(f, 'school', 150), str(f, 'affiliation', 150), str(f, 'area_office', 150),
      str(f, 'email', 120), str(f, 'phone', 40), str(f, 'facebook', 150), str(f, 'line_id', 80),
      avatar.source, avatar.ref,
      Math.min(100, Math.max(0, int(f, 'avatar_focus_x', 50))),
      Math.min(100, Math.max(0, int(f, 'avatar_focus_y', 35))),
      str(f, 'motto', 255), str(f, 'philosophy', 255), str(f, 'bio', 4000),
      Math.min(60, Math.max(0, int(f, 'experience_years'))), num(f, 'teaching_hours'), now(),
    ],
  })

  await logAction('อัปเดตโปรไฟล์', 'teacher_profile', 1)
  revalidatePath('/', 'layout')
  return { ok: true }
}

/* ---------------- วุฒิการศึกษา ---------------- */

export async function saveEducation(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const degree = str(f, 'degree', 200)
  if (!degree) return { ok: false, error: 'กรุณากรอกชื่อวุฒิการศึกษา' }

  const year = int(f, 'year_th')
  if (year < 2400 || year > 2700) return { ok: false, error: 'ปี พ.ศ. ต้องอยู่ระหว่าง 2400–2700' }

  const t = now()
  const args = [year, degree, str(f, 'institute', 200), int(f, 'sort_order', 1), t]

  if (id) {
    if (!await one('SELECT id FROM educations WHERE id = ? AND deleted_at IS NULL', [id]))
      return { ok: false, error: 'ไม่พบวุฒิการศึกษาที่ต้องการแก้ไข' }
    await db.execute({
      sql: 'UPDATE educations SET year_th=?, degree=?, institute=?, sort_order=?, updated_at=? WHERE id=?',
      args: [...args, id],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO educations (year_th, degree, institute, sort_order, updated_at, created_at)
            VALUES (?,?,?,?,?,?)`,
      args: [...args, t],
    })
  }

  await logAction(id ? 'แก้ไขวุฒิการศึกษา' : 'เพิ่มวุฒิการศึกษา', 'educations', id, degree)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteEducation(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE educations SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบวุฒิการศึกษา', 'educations', id)
  revalidatePath('/', 'layout')
  return { ok: true }
}

/* ---------------- เส้นทางรับราชการ ---------------- */

export async function saveCareer(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const period = str(f, 'period', 60)
  const position = str(f, 'position', 120)
  if (!period) return { ok: false, error: 'กรุณากรอกช่วงเวลา' }
  if (!position) return { ok: false, error: 'กรุณากรอกตำแหน่ง' }

  const t = now()
  const args = [period, position, str(f, 'school', 150), bool(f, 'is_current'), int(f, 'sort_order', 1), t]

  if (id) {
    if (!await one('SELECT id FROM career_paths WHERE id = ? AND deleted_at IS NULL', [id]))
      return { ok: false, error: 'ไม่พบรายการที่ต้องการแก้ไข' }
    await db.execute({
      sql: `UPDATE career_paths SET period=?, position=?, school=?, is_current=?, sort_order=?,
              updated_at=? WHERE id=?`,
      args: [...args, id],
    })
  } else {
    await db.execute({
      sql: `INSERT INTO career_paths (period, position, school, is_current, sort_order, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [...args, t],
    })
  }

  await logAction(id ? 'แก้ไขเส้นทางรับราชการ' : 'เพิ่มเส้นทางรับราชการ', 'career_paths', id, position)
  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteCareer(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE career_paths SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบเส้นทางรับราชการ', 'career_paths', id)
  revalidatePath('/', 'layout')
  return { ok: true }
}
