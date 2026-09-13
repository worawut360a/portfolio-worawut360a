'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, logAction } from '@/lib/auth'
import { db, now, one, all } from '@/lib/db'
import { str, int, date, pick, media } from '@/lib/form'
import type { MediaSource } from '@/lib/media'

type Entity = 'award' | 'self_dev'
interface RowIn { source?: unknown; ref?: unknown; caption?: unknown; original_name?: unknown }

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
  }).slice(0, 60)
}

/** เขียนรูปและไฟล์แนบทับทั้งชุด (ใช้ร่วมกันทั้งรางวัลและการพัฒนาตนเอง) */
async function writeItemMedia(entity: Entity, id: number, f: FormData, t: string) {
  const images = parseRows(str(f, 'images', 60000))
  await db.execute({ sql: 'DELETE FROM item_images WHERE entity_type = ? AND entity_id = ?', args: [entity, id] })
  for (const [i, im] of images.entries()) {
    await db.execute({
      sql: `INSERT INTO item_images (entity_type, entity_id, source, ref, caption, sort_order, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [entity, id, im.source, im.ref, im.caption, i, t],
    })
  }
  const files = parseRows(str(f, 'files', 60000))
  await db.execute({ sql: 'DELETE FROM item_files WHERE entity_type = ? AND entity_id = ?', args: [entity, id] })
  for (const [i, fl] of files.entries()) {
    await db.execute({
      sql: `INSERT INTO item_files (entity_type, entity_id, source, ref, original_name, sort_order, created_at)
            VALUES (?,?,?,?,?,?,?)`,
      args: [entity, id, fl.source, fl.ref, fl.name, i, t],
    })
  }
}

/* ---------------- การพัฒนาตนเอง ---------------- */

const DEV_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'PLC', 'วิทยากร'] as const

export type Result = { ok: true; id: number } | { ok: false; error: string }

export interface SelfDevEdit {
  id: number; title: string; organizer: string; type: string
  start_date: string; end_date: string; hours: number; fiscal_year: number
  certificate_source: MediaSource | null; certificate_ref: string | null
  note: string; summary: string; content: string
  video_url: string; link_url: string; link_label: string
  images: { id?: number; source: MediaSource; ref: string; caption: string }[]
  files: { id?: number; source: MediaSource; ref: string; original_name: string }[]
}

/** อ่านรูปและไฟล์แนบของรายการหนึ่ง (ใช้ร่วมกันทั้งรางวัลและการพัฒนาตนเอง) */
async function readItemMedia(entity: Entity, id: number) {
  const [images, files] = await Promise.all([
    all<{ id: number; source: MediaSource; ref: string; caption: string }>(
      `SELECT id, source, ref, caption FROM item_images
       WHERE entity_type = ? AND entity_id = ? ORDER BY sort_order, id`, [entity, id]),
    all<{ id: number; source: MediaSource; ref: string; original_name: string }>(
      `SELECT id, source, ref, original_name FROM item_files
       WHERE entity_type = ? AND entity_id = ? ORDER BY sort_order, id`, [entity, id]),
  ])
  return { images, files }
}

export async function getSelfDevForEdit(id: number): Promise<SelfDevEdit | null> {
  await requireAdmin()
  const r = await one<Record<string, unknown>>(
    'SELECT * FROM self_developments WHERE id = ? AND deleted_at IS NULL', [id])
  if (!r) return null
  const { images, files } = await readItemMedia('self_dev', id)
  return {
    id: Number(r.id),
    title: String(r.title ?? ''),
    organizer: String(r.organizer ?? ''),
    type: String(r.type ?? 'อบรม'),
    start_date: String(r.start_date ?? ''),
    end_date: String(r.end_date ?? ''),
    hours: Number(r.hours ?? 0),
    fiscal_year: Number(r.fiscal_year ?? 0),
    certificate_source: (r.certificate_source as MediaSource) ?? null,
    certificate_ref: (r.certificate_ref as string) ?? null,
    note: String(r.note ?? ''),
    summary: String(r.summary ?? ''),
    content: String(r.content ?? ''),
    video_url: String(r.video_url ?? ''),
    link_url: String(r.link_url ?? ''),
    link_label: String(r.link_label ?? ''),
    images, files,
  }
}

export async function saveSelfDev(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const title = str(f, 'title', 255)
  if (!title) return { ok: false, error: 'กรุณากรอกชื่อหลักสูตร / กิจกรรม' }
  if (!date(f, 'start_date')) return { ok: false, error: 'กรุณาเลือกวันที่เริ่ม' }

  const fy = int(f, 'fiscal_year')
  if (fy < 2500 || fy > 2700) return { ok: false, error: 'ปีงบประมาณต้องอยู่ระหว่าง 2500–2700' }

  const hours = int(f, 'hours')
  if (hours < 0 || hours > 2000) return { ok: false, error: 'จำนวนชั่วโมงต้องอยู่ระหว่าง 0–2000' }

  if (id && !await one('SELECT id FROM self_developments WHERE id = ? AND deleted_at IS NULL', [id]))
    return { ok: false, error: 'ไม่พบรายการที่ต้องการแก้ไข' }

  const cert = media(f, 'cert')
  const t = now()
  const args = [
    title, str(f, 'organizer', 200), pick(f, 'type', DEV_TYPES, 'อบรม'),
    date(f, 'start_date'), date(f, 'end_date'), hours, fy,
    cert.source, cert.ref, str(f, 'note', 400), str(f, 'summary', 500),
    str(f, 'content', 20000), str(f, 'video_url', 255),
    str(f, 'link_url', 255), str(f, 'link_label', 120), t,
  ]

  let rowId = id
  if (id) {
    await db.execute({
      sql: `UPDATE self_developments SET title=?, organizer=?, type=?, start_date=?, end_date=?,
              hours=?, fiscal_year=?, certificate_source=?, certificate_ref=?, note=?, summary=?,
              content=?, video_url=?, link_url=?, link_label=?, updated_at=? WHERE id=?`,
      args: [...args, id],
    })
  } else {
    const res = await db.execute({
      sql: `INSERT INTO self_developments (title, organizer, type, start_date, end_date, hours,
              fiscal_year, certificate_source, certificate_ref, note, summary, content,
              video_url, link_url, link_label, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...args, t],
    })
    rowId = Number(res.lastInsertRowid)
  }

  await writeItemMedia('self_dev', rowId, f, t)
  await logAction(id ? 'แก้ไขการพัฒนาตนเอง' : 'เพิ่มการพัฒนาตนเอง', 'self_developments', rowId, title)
  revalidatePath('/', 'layout')
  return { ok: true, id: rowId }
}

export async function deleteSelfDev(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE self_developments SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบการพัฒนาตนเอง', 'self_developments', id)
  revalidatePath('/', 'layout')
  return { ok: true }
}

/* ---------------- รางวัล ---------------- */

const LEVELS = ['โรงเรียน', 'เขตพื้นที่', 'จังหวัด', 'ภาค', 'ชาติ', 'นานาชาติ'] as const

export interface AwardEdit {
  id: number; title: string; awarder: string; level: string; award_date: string
  image_source: MediaSource | null; image_ref: string | null
  note: string; summary: string; content: string
  video_url: string; link_url: string; link_label: string
  images: { id?: number; source: MediaSource; ref: string; caption: string }[]
  files: { id?: number; source: MediaSource; ref: string; original_name: string }[]
}

export async function getAwardForEdit(id: number): Promise<AwardEdit | null> {
  await requireAdmin()
  const r = await one<Record<string, unknown>>(
    'SELECT * FROM awards WHERE id = ? AND deleted_at IS NULL', [id])
  if (!r) return null
  const { images, files } = await readItemMedia('award', id)
  return {
    id: Number(r.id),
    title: String(r.title ?? ''),
    awarder: String(r.awarder ?? ''),
    level: String(r.level ?? 'โรงเรียน'),
    award_date: String(r.award_date ?? ''),
    image_source: (r.image_source as MediaSource) ?? null,
    image_ref: (r.image_ref as string) ?? null,
    note: String(r.note ?? ''),
    summary: String(r.summary ?? ''),
    content: String(r.content ?? ''),
    video_url: String(r.video_url ?? ''),
    link_url: String(r.link_url ?? ''),
    link_label: String(r.link_label ?? ''),
    images, files,
  }
}

export async function saveAward(f: FormData): Promise<Result> {
  await requireAdmin()

  const id = int(f, 'id')
  const title = str(f, 'title', 255)
  if (!title) return { ok: false, error: 'กรุณากรอกชื่อรางวัล' }
  if (!date(f, 'award_date')) return { ok: false, error: 'กรุณาเลือกวันที่ได้รับ' }

  if (id && !await one('SELECT id FROM awards WHERE id = ? AND deleted_at IS NULL', [id]))
    return { ok: false, error: 'ไม่พบรางวัลที่ต้องการแก้ไข' }

  const img = media(f, 'image')
  const t = now()
  const args = [
    title, str(f, 'awarder', 200), pick(f, 'level', LEVELS, 'โรงเรียน'),
    date(f, 'award_date'), img.source, img.ref, str(f, 'note', 400),
    str(f, 'summary', 500), str(f, 'content', 20000), str(f, 'video_url', 255),
    str(f, 'link_url', 255), str(f, 'link_label', 120), t,
  ]

  let rowId = id
  if (id) {
    await db.execute({
      sql: `UPDATE awards SET title=?, awarder=?, level=?, award_date=?, image_source=?, image_ref=?,
              note=?, summary=?, content=?, video_url=?, link_url=?, link_label=?, updated_at=? WHERE id=?`,
      args: [...args, id],
    })
  } else {
    const res = await db.execute({
      sql: `INSERT INTO awards (title, awarder, level, award_date, image_source, image_ref, note,
              summary, content, video_url, link_url, link_label, updated_at, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [...args, t],
    })
    rowId = Number(res.lastInsertRowid)
  }

  await writeItemMedia('award', rowId, f, t)

  // ยังไม่ได้ใส่รูปปก → ใช้รูปแรกในแกลเลอรีแทน เหมือนที่เว็บ PHP บอกไว้ใต้ช่องรูปปก
  if (!img.ref) {
    const first = await one<{ source: MediaSource; ref: string }>(
      `SELECT source, ref FROM item_images WHERE entity_type = 'award' AND entity_id = ?
       ORDER BY sort_order, id LIMIT 1`, [rowId])
    if (first) {
      await db.execute({
        sql: 'UPDATE awards SET image_source=?, image_ref=? WHERE id=?',
        args: [first.source, first.ref, rowId],
      })
    }
  }

  await logAction(id ? 'แก้ไขรางวัล' : 'เพิ่มรางวัล', 'awards', rowId, title)
  revalidatePath('/', 'layout')
  return { ok: true, id: rowId }
}

export async function deleteAward(id: number): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin()
  await db.execute({ sql: 'UPDATE awards SET deleted_at = ? WHERE id = ?', args: [now(), id] })
  await logAction('ลบรางวัล', 'awards', id)
  revalidatePath('/', 'layout')
  return { ok: true }
}
