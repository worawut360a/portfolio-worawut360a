'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now, one, all } from '@/lib/db'
import { str, int, date, pick, slugify } from '@/lib/form'
import type { MediaSource } from '@/lib/media'

export type Result =
  | { ok: true; id: number; indicator_id: number }
  | { ok: false; error: string }

export interface ImageRow { id?: number; source: MediaSource; ref: string; caption: string }
export interface FileRow { id?: number; source: MediaSource; ref: string; original_name: string }

export interface WorkEdit {
  id: number; title: string; indicator_id: number; work_date: string
  academic_year: number; semester: number; status: string
  summary: string; content: string; video_url: string; tags: string
  is_featured: number
  images: ImageRow[]
  files: FileRow[]
}

/** อ่านผลงาน 1 ชิ้นพร้อมรูป/ไฟล์ — ตรงกับ GET api/works.php?admin=1&id= */
export async function getWorkForEdit(id: number): Promise<WorkEdit | null> {
  await requireAdmin()

  const w = await one<Record<string, unknown>>(
    'SELECT * FROM works WHERE id = ? AND deleted_at IS NULL', [id])
  if (!w) return null

  const [images, files] = await Promise.all([
    all<ImageRow>('SELECT id, source, ref, caption FROM work_images WHERE work_id = ? ORDER BY sort_order, id', [id]),
    all<FileRow>('SELECT id, source, ref, original_name FROM work_files WHERE work_id = ? ORDER BY sort_order, id', [id]),
  ])

  return {
    id: Number(w.id),
    title: String(w.title ?? ''),
    indicator_id: Number(w.indicator_id),
    work_date: String(w.work_date ?? ''),
    academic_year: Number(w.academic_year),
    semester: Number(w.semester),
    status: String(w.status ?? 'published'),
    summary: String(w.summary ?? ''),
    content: String(w.content ?? ''),
    video_url: String(w.video_url ?? ''),
    tags: String(w.tags ?? ''),
    is_featured: Number(w.is_featured ?? 0),
    images, files,
  }
}

interface RowIn { source?: unknown; ref?: unknown; caption?: unknown; original_name?: unknown }

/** อ่าน JSON ที่ฟอร์มส่งมา แล้วกรองให้เหลือเฉพาะค่าที่ใช้ได้จริง */
function parseRows(raw: string) {
  let data: unknown
  try { data = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(data)) return []
  return data.flatMap((r: RowIn) => {
    const ref = String(r.ref ?? '').trim()
    if (!ref || ref.length > 200) return []
    return [{
      source: (r.source === 'static' ? 'static' : 'drive') as MediaSource,
      ref,
      caption: String(r.caption ?? '').slice(0, 255),
      name: String(r.original_name ?? '').slice(0, 255) || 'ไฟล์แนบ',
    }]
  }).slice(0, 60)   // กันการยัดข้อมูลจำนวนมหาศาล
}

/** ทำให้ slug ไม่ซ้ำกับผลงานอื่น */
async function uniqueSlug(base: string, exceptId: number): Promise<string> {
  let slug = base
  for (let i = 2; i < 200; i++) {
    const hit = await one<{ id: number }>('SELECT id FROM works WHERE slug = ? AND id <> ?', [slug, exceptId])
    if (!hit) return slug
    slug = `${base}-${i}`
  }
  return `${base}-${Date.now()}`
}

const today = () => new Date().toISOString().slice(0, 10)

export async function saveWork(f: FormData): Promise<Result> {
  await requireAdmin()                          // ด่านตรวจ — ต้องมีทุก action

  const id = int(f, 'id')
  const title = str(f, 'title', 255)
  if (!title) return { ok: false, error: 'กรุณากรอกชื่อผลงาน' }

  const indicatorId = int(f, 'indicator_id')
  if (!await one('SELECT id FROM indicators WHERE id = ?', [indicatorId]))
    return { ok: false, error: 'กรุณาเลือกตัวชี้วัด' }

  const year = int(f, 'academic_year')
  if (year < 2500 || year > 2700) return { ok: false, error: 'ปีการศึกษาต้องอยู่ระหว่าง 2500–2700' }

  if (id && !await one('SELECT id FROM works WHERE id = ? AND deleted_at IS NULL', [id]))
    return { ok: false, error: 'ไม่พบผลงานที่ต้องการแก้ไข' }

  const t = now()
  const common = [
    indicatorId, title, str(f, 'summary', 500), str(f, 'content', 20000),
    year, Math.max(1, Math.min(3, int(f, 'semester', 1))),
    date(f, 'work_date') ?? today(), str(f, 'video_url', 500), str(f, 'tags', 255),
    f.get('is_featured') ? 1 : 0,
    pick(f, 'status', ['draft', 'published'] as const, 'published'), t,
  ]

  let workId = id
  if (id) {
    await db.execute({
      sql: `UPDATE works SET indicator_id=?, title=?, summary=?, content=?, academic_year=?,
              semester=?, work_date=?, video_url=?, tags=?, is_featured=?, status=?, updated_at=?
            WHERE id=?`,
      args: [...common, id],
    })
  } else {
    const slug = await uniqueSlug(slugify(title), 0)
    const res = await db.execute({
      sql: `INSERT INTO works (indicator_id, title, summary, content, academic_year, semester,
              work_date, video_url, tags, is_featured, status, updated_at, slug, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...common, slug, t],
    })
    workId = Number(res.lastInsertRowid)
  }

  // รูปและไฟล์: เขียนทับทั้งชุดตามลำดับที่ครูจัดไว้
  const images = parseRows(str(f, 'images', 60000))
  await db.execute({ sql: 'DELETE FROM work_images WHERE work_id = ?', args: [workId] })
  for (const [i, im] of images.entries()) {
    await db.execute({
      sql: `INSERT INTO work_images (work_id, source, ref, caption, sort_order, created_at)
            VALUES (?,?,?,?,?,?)`,
      args: [workId, im.source, im.ref, im.caption || `ภาพประกอบผลงาน ${title}`, i, t],
    })
  }

  const files = parseRows(str(f, 'files', 60000))
  await db.execute({ sql: 'DELETE FROM work_files WHERE work_id = ?', args: [workId] })
  for (const [i, fl] of files.entries()) {
    await db.execute({
      sql: `INSERT INTO work_files (work_id, source, ref, original_name, sort_order, created_at)
            VALUES (?,?,?,?,?,?)`,
      args: [workId, fl.source, fl.ref, fl.name, i, t],
    })
  }

  // ภาพปก = รูปแรกในแกลเลอรีเสมอ (เหมือนเว็บ PHP ที่หยิบรูปแรกมาเป็นปกถ้ายังไม่มี)
  const first = images[0] ?? null
  await db.execute({
    sql: 'UPDATE works SET cover_source=?, cover_ref=? WHERE id=?',
    args: [first?.source ?? null, first?.ref ?? null, workId],
  })

  await logAction(id ? 'แก้ไขผลงาน' : 'เพิ่มผลงาน', 'works', workId, title)
  revalidatePath('/', 'layout')
  return { ok: true, id: workId, indicator_id: indicatorId }
}

export async function deleteWork(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE works SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบผลงาน', 'works', id)
  revalidatePath('/', 'layout')
  return { ok: true }
}
