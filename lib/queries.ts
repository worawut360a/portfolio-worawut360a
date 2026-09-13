import { cache } from 'react'
import { all, one, scalar } from './db'
import type {
  Profile, Domain, Indicator, Work, WorkImage, WorkFile, Agreement,
  PaDetail, PaChallenge, SelfDev, Award, ItemImage, ItemFile, Education, CareerPath,
} from './types'

/* ---------------- โปรไฟล์ / ประวัติ ---------------- */

/**
 * โปรไฟล์ครู — คืน null ถ้าฐานข้อมูลยังไม่พร้อม
 * ต้องกันไว้ เพราะ layout เรียกใช้ทุกหน้า ถ้าโยน error ตอนยังไม่ติดตั้งเว็บจะ 500 ทั้งเว็บ
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  try { return await one<Profile>('SELECT * FROM teacher_profile WHERE id = 1') }
  catch { return null }
})

export const getEducations = () =>
  all<Education>('SELECT * FROM educations WHERE deleted_at IS NULL ORDER BY sort_order, year_th DESC')

export const getCareerPaths = () =>
  all<CareerPath>('SELECT * FROM career_paths WHERE deleted_at IS NULL ORDER BY sort_order')

export const getSetting = cache(async (key: string): Promise<string | null> => {
  try { return await scalar<string>('SELECT value FROM site_settings WHERE key = ?', [key]) }
  catch { return null }
})

/* ---------------- ด้าน / ตัวชี้วัด ---------------- */

export const getDomains = cache(() =>
  all<Domain>('SELECT * FROM domains ORDER BY code'))

export const getIndicators = cache(() =>
  all<Indicator>(`SELECT i.*, d.code AS domain_code, d.name AS domain_name
                  FROM indicators i JOIN domains d ON d.id = i.domain_id
                  ORDER BY d.code, i.sort_order`))

export const getIndicator = (id: number) =>
  one<Indicator>(`SELECT i.*, d.code AS domain_code, d.name AS domain_name
                  FROM indicators i JOIN domains d ON d.id = i.domain_id WHERE i.id = ?`, [id])

/**
 * จำนวนผลงานของแต่ละตัวชี้วัด — ใช้โชว์ตัวเลขบนการ์ด
 * includeDraft = true สำหรับหลังบ้าน (ครูต้องเห็นฉบับร่างของตัวเองด้วย)
 */
export async function getWorkCountByIndicator(includeDraft = false): Promise<Map<number, number>> {
  const rows = await all<{ indicator_id: number; n: number }>(
    `SELECT indicator_id, COUNT(*) AS n FROM works
     WHERE deleted_at IS NULL ${includeDraft ? '' : "AND status = 'published'"}
     GROUP BY indicator_id`)
  return new Map(rows.map((r) => [Number(r.indicator_id), Number(r.n)]))
}

/* ---------------- ผลงาน ---------------- */

const WORK_SELECT = `SELECT w.*, i.code AS indicator_code, i.name AS indicator_name, d.code AS domain_code
                     FROM works w
                     JOIN indicators i ON i.id = w.indicator_id
                     JOIN domains d ON d.id = i.domain_id`

export interface WorkFilter {
  indicatorId?: number
  domainCode?: number
  academicYear?: number
  q?: string
  featuredOnly?: boolean
  limit?: number
  offset?: number
}

export async function getWorks(f: WorkFilter = {}): Promise<Work[]> {
  const where: string[] = ["w.deleted_at IS NULL", "w.status = 'published'"]
  const args: (string | number)[] = []
  if (f.indicatorId) { where.push('w.indicator_id = ?'); args.push(f.indicatorId) }
  if (f.domainCode) { where.push('d.code = ?'); args.push(f.domainCode) }
  if (f.academicYear) { where.push('w.academic_year = ?'); args.push(f.academicYear) }
  if (f.featuredOnly) { where.push('w.is_featured = 1') }
  if (f.q) {
    where.push('(w.title LIKE ? OR w.summary LIKE ? OR w.tags LIKE ?)')
    const like = `%${f.q}%`; args.push(like, like, like)
  }
  let sql = `${WORK_SELECT} WHERE ${where.join(' AND ')} ORDER BY w.work_date DESC, w.id DESC`
  if (f.limit) { sql += ' LIMIT ?'; args.push(f.limit) }
  if (f.offset) { sql += ' OFFSET ?'; args.push(f.offset) }
  return all<Work>(sql, args)
}

export async function countWorks(f: WorkFilter = {}): Promise<number> {
  const where: string[] = ["w.deleted_at IS NULL", "w.status = 'published'"]
  const args: (string | number)[] = []
  if (f.indicatorId) { where.push('w.indicator_id = ?'); args.push(f.indicatorId) }
  if (f.domainCode) { where.push('d.code = ?'); args.push(f.domainCode) }
  if (f.academicYear) { where.push('w.academic_year = ?'); args.push(f.academicYear) }
  if (f.q) {
    where.push('(w.title LIKE ? OR w.summary LIKE ? OR w.tags LIKE ?)')
    const like = `%${f.q}%`; args.push(like, like, like)
  }
  const n = await scalar<number>(
    `SELECT COUNT(*) FROM works w
     JOIN indicators i ON i.id = w.indicator_id
     JOIN domains d ON d.id = i.domain_id
     WHERE ${where.join(' AND ')}`, args)
  return Number(n ?? 0)
}

export const getWorkBySlug = (slug: string) =>
  one<Work>(`${WORK_SELECT} WHERE w.slug = ? AND w.deleted_at IS NULL`, [slug])

export const getWorkImages = (workId: number) =>
  all<WorkImage>('SELECT * FROM work_images WHERE work_id = ? ORDER BY sort_order, id', [workId])

export const getWorkFiles = (workId: number) =>
  all<WorkFile>('SELECT * FROM work_files WHERE work_id = ? ORDER BY sort_order, id', [workId])

export const getAcademicYears = async () =>
  (await all<{ y: number }>(
    `SELECT DISTINCT academic_year AS y FROM works
     WHERE deleted_at IS NULL AND status = 'published' ORDER BY y DESC`)).map((r) => Number(r.y))

/** ผลงานอื่นในตัวชี้วัดเดียวกัน */
export const getRelatedWorks = (indicatorId: number, exceptId: number, limit = 4) =>
  all<Work>(`${WORK_SELECT} WHERE w.indicator_id = ? AND w.id <> ?
             AND w.deleted_at IS NULL AND w.status = 'published'
             ORDER BY w.work_date DESC LIMIT ?`, [indicatorId, exceptId, limit])

/* ---------------- ข้อตกลง PA ---------------- */

export const getAgreements = cache(() =>
  all<Agreement & { detail_count: number; challenge_count: number }>(
    `SELECT a.*,
            (SELECT COUNT(*) FROM pa_details pd WHERE pd.agreement_id = a.id)    AS detail_count,
            (SELECT COUNT(*) FROM pa_challenges pc WHERE pc.agreement_id = a.id) AS challenge_count
     FROM pa_agreements a
     WHERE a.deleted_at IS NULL
     ORDER BY a.fiscal_year DESC`))

export const getAgreement = (fiscalYear: number) =>
  one<Agreement>('SELECT * FROM pa_agreements WHERE fiscal_year = ? AND deleted_at IS NULL', [fiscalYear])

export const getAgreementById = (id: number) =>
  one<Agreement>('SELECT * FROM pa_agreements WHERE id = ? AND deleted_at IS NULL', [id])

export const getPaDetails = (agreementId: number) =>
  all<PaDetail>(`SELECT p.*, i.code AS indicator_code, i.name AS indicator_name, d.code AS domain_code
                 FROM pa_details p
                 JOIN indicators i ON i.id = p.indicator_id
                 JOIN domains d ON d.id = i.domain_id
                 WHERE p.agreement_id = ? ORDER BY d.code, i.sort_order`, [agreementId])

/** ประเด็นท้าทายทั้งหมดของข้อตกลงปีนั้น — 1 ปีมีได้หลายข้อ */
export const getPaChallenges = (agreementId: number) =>
  all<PaChallenge>('SELECT * FROM pa_challenges WHERE agreement_id = ? ORDER BY id', [agreementId])

export const getPaChallenge = (agreementId: number) =>
  one<PaChallenge>('SELECT * FROM pa_challenges WHERE agreement_id = ? ORDER BY id', [agreementId])

/* ---------------- การพัฒนาตนเอง / รางวัล ---------------- */

export const getSelfDevs = (fiscalYear?: number) =>
  all<SelfDev>(
    `SELECT * FROM self_developments WHERE deleted_at IS NULL
     ${fiscalYear ? 'AND fiscal_year = ?' : ''}
     ORDER BY start_date DESC, id DESC`, fiscalYear ? [fiscalYear] : [])

export const getSelfDev = (id: number) =>
  one<SelfDev>('SELECT * FROM self_developments WHERE id = ? AND deleted_at IS NULL', [id])

export const getSelfDevYears = async () =>
  (await all<{ y: number }>(
    `SELECT DISTINCT fiscal_year AS y FROM self_developments
     WHERE deleted_at IS NULL ORDER BY y DESC`)).map((r) => Number(r.y))

export const getAwards = () =>
  all<Award>('SELECT * FROM awards WHERE deleted_at IS NULL ORDER BY award_date DESC, id DESC')

export const getAward = (id: number) =>
  one<Award>('SELECT * FROM awards WHERE id = ? AND deleted_at IS NULL', [id])

export const getItemImages = (type: 'award' | 'self_dev', id: number) =>
  all<ItemImage>(`SELECT * FROM item_images WHERE entity_type = ? AND entity_id = ?
                  ORDER BY sort_order, id`, [type, id])

export const getItemFiles = (type: 'award' | 'self_dev', id: number) =>
  all<ItemFile>(`SELECT * FROM item_files WHERE entity_type = ? AND entity_id = ?
                 ORDER BY sort_order, id`, [type, id])

/* ---------------- ตัวเลขสรุปหน้าแรก ---------------- */

/** ตัวเลขสรุป — รวมเป็นคำสั่งเดียว เพราะการวิ่งไปฐานข้อมูลแต่ละครั้งมีค่าหน่วงราว 150 ms */
export const getStats = cache(async () => {
  const r = await one<{ works: number; images: number; hours: number; awards: number }>(`
    SELECT
      (SELECT COUNT(*) FROM works WHERE deleted_at IS NULL AND status='published') AS works,
      (SELECT COUNT(*) FROM work_images)                                           AS images,
      (SELECT COALESCE(SUM(hours),0) FROM self_developments WHERE deleted_at IS NULL) AS hours,
      (SELECT COUNT(*) FROM awards WHERE deleted_at IS NULL)                       AS awards`)
  return {
    works: Number(r?.works ?? 0),
    images: Number(r?.images ?? 0),
    hours: Number(r?.hours ?? 0),
    awards: Number(r?.awards ?? 0),
  }
})


/* ---------------- ภาพรวมตัวชี้วัดของข้อตกลงปีหนึ่ง ---------------- */

export interface IndicatorOverview extends Indicator {
  work_count: number
  pa: PaDetail | null
}

/**
 * 15 ตัวชี้วัด พร้อมข้อตกลงของปีนั้นและจำนวนผลงานของแต่ละตัว จัดกลุ่มตามด้าน
 * ใช้ในหน้าข้อตกลง PA (ตอนที่ 2) — ตรงกับ Repository::indicatorOverviewGrouped ของเว็บ PHP
 */
export async function getIndicatorOverviewGrouped(
  agreementId: number,
  includeDraft = false,
): Promise<Map<number, IndicatorOverview[]>> {
  const [indicators, counts, details] = await Promise.all([
    getIndicators(),
    getWorkCountByIndicator(includeDraft),
    agreementId ? getPaDetails(agreementId) : Promise.resolve([]),
  ])
  const paByInd = new Map(details.map((d) => [Number(d.indicator_id), d]))

  const grouped = new Map<number, IndicatorOverview[]>([[1, []], [2, []], [3, []]])
  for (const ind of indicators) {
    const code = Number(ind.domain_code)
    grouped.get(code)?.push({
      ...ind,
      work_count: counts.get(ind.id) ?? 0,
      pa: paByInd.get(ind.id) ?? null,
    })
  }
  return grouped
}


/* ---------------- ตัวเลขสรุปหน้าแรก (ตรงกับ Repository::stats ของเว็บ PHP) ---------------- */

export interface HomeStats {
  total_works: number
  works_by_domain: Map<number, number>
  filled: Map<number, number>
  total_per_domain: Map<number, number>
  filled_total: number
  indicator_total: number
  self_dev_hours: number
  awards: number
}

export const getHomeStats = cache(async (): Promise<HomeStats> => {
  const [indicators, counts, byDomain, totals] = await Promise.all([
    getIndicators(),
    getWorkCountByIndicator(),
    all<{ code: number; n: number }>(
      `SELECT d.code AS code, COUNT(w.id) AS n
       FROM domains d
       JOIN indicators i ON i.domain_id = d.id
       LEFT JOIN works w ON w.indicator_id = i.id AND w.deleted_at IS NULL AND w.status = 'published'
       GROUP BY d.code`),
    one<{ works: number; hours: number; awards: number }>(`
      SELECT
        (SELECT COUNT(*) FROM works WHERE deleted_at IS NULL AND status='published') AS works,
        (SELECT COALESCE(SUM(hours),0) FROM self_developments WHERE deleted_at IS NULL) AS hours,
        (SELECT COUNT(*) FROM awards WHERE deleted_at IS NULL) AS awards`),
  ])

  const filled = new Map<number, number>([[1, 0], [2, 0], [3, 0]])
  const totalPerDomain = new Map<number, number>([[1, 0], [2, 0], [3, 0]])
  for (const ind of indicators) {
    const dc = Number(ind.domain_code)
    totalPerDomain.set(dc, (totalPerDomain.get(dc) ?? 0) + 1)
    if ((counts.get(ind.id) ?? 0) > 0) filled.set(dc, (filled.get(dc) ?? 0) + 1)
  }

  return {
    total_works: Number(totals?.works ?? 0),
    works_by_domain: new Map(byDomain.map((r) => [Number(r.code), Number(r.n)])),
    filled,
    total_per_domain: totalPerDomain,
    filled_total: [...filled.values()].reduce((a, b) => a + b, 0),
    indicator_total: indicators.length,
    self_dev_hours: Number(totals?.hours ?? 0),
    awards: Number(totals?.awards ?? 0),
  }
})


/* ---------------- ข้อมูลประกอบหน้าการพัฒนาตนเอง ---------------- */

/** จำนวนรายการและชั่วโมงแยกรายปีงบประมาณ — ใช้แสดงใน dropdown เลือกปี */
export const getSelfDevYearStats = cache(async (): Promise<Map<number, { n: number; h: number }>> => {
  const rows = await all<{ fiscal_year: number; n: number; h: number }>(
    `SELECT fiscal_year, COUNT(*) AS n, COALESCE(SUM(hours),0) AS h
     FROM self_developments WHERE deleted_at IS NULL GROUP BY fiscal_year`)
  return new Map(rows.map((r) => [Number(r.fiscal_year), { n: Number(r.n), h: Number(r.h) }]))
})

/** ชั่วโมงพัฒนาตนเอง — ระบุปีเพื่อดูเฉพาะปีนั้น ไม่ระบุคือรวมทุกปี */
export const getSelfDevHours = cache(async (fiscalYear?: number): Promise<number> => {
  const n = await scalar<number>(
    `SELECT COALESCE(SUM(hours),0) FROM self_developments
     WHERE deleted_at IS NULL ${fiscalYear ? 'AND fiscal_year = ?' : ''}`,
    fiscalYear ? [fiscalYear] : [])
  return Number(n ?? 0)
})

export interface AttachCount { images: number; files: number }

/** จำนวนรูปและไฟล์แนบของแต่ละรายการ — ใช้แสดงชิป "🖼️ n · 📎 n" */
export const getItemAttachmentCounts = cache(
  async (type: 'award' | 'self_dev'): Promise<Map<number, AttachCount>> => {
    const [imgs, files] = await Promise.all([
      all<{ entity_id: number; n: number }>(
        'SELECT entity_id, COUNT(*) AS n FROM item_images WHERE entity_type = ? GROUP BY entity_id', [type]),
      all<{ entity_id: number; n: number }>(
        'SELECT entity_id, COUNT(*) AS n FROM item_files WHERE entity_type = ? GROUP BY entity_id', [type]),
    ])
    const out = new Map<number, AttachCount>()
    const get = (id: number) => out.get(id) ?? { images: 0, files: 0 }
    for (const r of imgs) out.set(Number(r.entity_id), { ...get(Number(r.entity_id)), images: Number(r.n) })
    for (const r of files) out.set(Number(r.entity_id), { ...get(Number(r.entity_id)), files: Number(r.n) })
    return out
  })


/* ---------------- ผลงานแบบแบ่งหน้า + จำนวนรูป/ไฟล์ (ใช้ในหน้าตัวชี้วัด) ---------------- */

export interface WorkRow extends Work {
  image_count: number
  file_count: number
}

export interface WorkPage {
  rows: WorkRow[]
  total: number
  page: number
  last_page: number
}

export type WorkSort = 'latest' | 'oldest' | 'popular' | 'title'

const SORT_SQL: Record<WorkSort, string> = {
  latest: 'w.work_date DESC, w.id DESC',
  oldest: 'w.work_date ASC, w.id ASC',
  popular: 'w.view_count DESC, w.id DESC',
  title: 'w.title ASC',
}

/** ค้นหา/กรอง/เรียง/แบ่งหน้า — ตรงกับ Repository::works() ของเว็บ PHP */
export async function getWorkPage(opts: {
  indicatorId?: number; academicYear?: number; q?: string
  sort?: WorkSort; page?: number; perPage?: number
  /** หลังบ้านต้องเห็นฉบับร่างของตัวเองด้วย */
  includeDraft?: boolean
  status?: 'draft' | 'published'
}): Promise<WorkPage> {
  const perPage = Math.min(48, Math.max(1, opts.perPage ?? 9))
  const page = Math.max(1, opts.page ?? 1)
  const sort = SORT_SQL[opts.sort ?? 'latest'] ?? SORT_SQL.latest

  const where = ['w.deleted_at IS NULL']
  const args: (string | number)[] = []
  if (opts.status) { where.push('w.status = ?'); args.push(opts.status) }
  else if (!opts.includeDraft) where.push("w.status = 'published'")
  if (opts.indicatorId) { where.push('w.indicator_id = ?'); args.push(opts.indicatorId) }
  if (opts.academicYear) { where.push('w.academic_year = ?'); args.push(opts.academicYear) }
  if (opts.q) {
    where.push('(w.title LIKE ? OR w.summary LIKE ? OR w.tags LIKE ?)')
    const like = `%${opts.q}%`
    args.push(like, like, like)
  }
  const cond = where.join(' AND ')

  const total = Number(await scalar<number>(
    `SELECT COUNT(*) FROM works w WHERE ${cond}`, args) ?? 0)
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const safePage = Math.min(page, lastPage)

  const rows = await all<WorkRow>(
    `SELECT w.*, i.code AS indicator_code, i.name AS indicator_name, d.code AS domain_code,
            (SELECT COUNT(*) FROM work_images wi WHERE wi.work_id = w.id) AS image_count,
            (SELECT COUNT(*) FROM work_files wf WHERE wf.work_id = w.id)  AS file_count
     FROM works w
     JOIN indicators i ON i.id = w.indicator_id
     JOIN domains d ON d.id = i.domain_id
     WHERE ${cond}
     ORDER BY ${sort}
     LIMIT ? OFFSET ?`, [...args, perPage, (safePage - 1) * perPage])

  return { rows, total, page: safePage, last_page: lastPage }
}

/** ตัวชี้วัดก่อนหน้า/ถัดไป ตามลำดับด้านและ sort_order */
export const getIndicatorNeighbors = cache(async (id: number) => {
  const list = await getIndicators()
  const i = list.findIndex((x) => x.id === id)
  return { prev: i > 0 ? list[i - 1]! : null, next: i >= 0 && i < list.length - 1 ? list[i + 1]! : null }
})


/* ---------------- ผลงานก่อนหน้า / ถัดไป ในตัวชี้วัดเดียวกัน ---------------- */

export interface WorkNeighbor { id: number; title: string; slug: string; work_date: string | null }

export async function getWorkNeighbors(indicatorId: number, workDate: string | null, id: number) {
  const [prev, next] = await Promise.all([
    one<WorkNeighbor>(
      `SELECT id, title, slug, work_date FROM works
       WHERE indicator_id = ? AND status='published' AND deleted_at IS NULL
         AND (work_date < ? OR (work_date = ? AND id < ?))
       ORDER BY work_date DESC, id DESC LIMIT 1`, [indicatorId, workDate, workDate, id]),
    one<WorkNeighbor>(
      `SELECT id, title, slug, work_date FROM works
       WHERE indicator_id = ? AND status='published' AND deleted_at IS NULL
         AND (work_date > ? OR (work_date = ? AND id > ?))
       ORDER BY work_date ASC, id ASC LIMIT 1`, [indicatorId, workDate, workDate, id]),
  ])
  return { prev, next }
}

/** จำนวนผลงานทั้งหมดในตัวชี้วัดหนึ่ง (ใช้บอกบริบทบนปุ่ม) */
export const getIndicatorWorkTotal = async (indicatorId: number): Promise<number> =>
  Number(await scalar<number>(
    `SELECT COUNT(*) FROM works WHERE indicator_id = ? AND status='published' AND deleted_at IS NULL`,
    [indicatorId]) ?? 0)


/* ---------------- ก่อนหน้า / ถัดไป ของรางวัลและการพัฒนาตนเอง ---------------- */

export interface AwardNeighbor { id: number; title: string; award_date: string | null; level: string }
export interface SelfDevNeighbor { id: number; title: string; start_date: string | null; type: string }

export async function getAwardNeighbors(awardDate: string | null, id: number) {
  const [prev, next] = await Promise.all([
    one<AwardNeighbor>(
      `SELECT id, title, award_date, level FROM awards
       WHERE deleted_at IS NULL AND (award_date < ? OR (award_date = ? AND id < ?))
       ORDER BY award_date DESC, id DESC LIMIT 1`, [awardDate, awardDate, id]),
    one<AwardNeighbor>(
      `SELECT id, title, award_date, level FROM awards
       WHERE deleted_at IS NULL AND (award_date > ? OR (award_date = ? AND id > ?))
       ORDER BY award_date ASC, id ASC LIMIT 1`, [awardDate, awardDate, id]),
  ])
  return { prev, next }
}

export async function getSelfDevNeighbors(startDate: string | null, id: number) {
  const [prev, next] = await Promise.all([
    one<SelfDevNeighbor>(
      `SELECT id, title, start_date, type FROM self_developments
       WHERE deleted_at IS NULL AND (start_date < ? OR (start_date = ? AND id < ?))
       ORDER BY start_date DESC, id DESC LIMIT 1`, [startDate, startDate, id]),
    one<SelfDevNeighbor>(
      `SELECT id, title, start_date, type FROM self_developments
       WHERE deleted_at IS NULL AND (start_date > ? OR (start_date = ? AND id > ?))
       ORDER BY start_date ASC, id ASC LIMIT 1`, [startDate, startDate, id]),
  ])
  return { prev, next }
}

/** จำนวนรายการพัฒนาตนเองในปีงบประมาณหนึ่ง */
export const getSelfDevCountByYear = async (fiscalYear: number): Promise<number> =>
  Number(await scalar<number>(
    'SELECT COUNT(*) FROM self_developments WHERE deleted_at IS NULL AND fiscal_year = ?',
    [fiscalYear]) ?? 0)


/* ---------------- ตัวเลขสำหรับแดชบอร์ดหลังบ้าน ---------------- */

export interface AdminStats extends HomeStats {
  /** รหัสตัวชี้วัดที่ยังไม่มีผลงาน */
  missing: string[]
  fiscal_year: number
}

/**
 * สถิติสำหรับหลังบ้าน — ตรงกับ Repository::stats() ของเว็บ PHP
 * includeDraft = true จะนับฉบับร่างด้วย (PHP เรียกทั้งสองแบบในหน้าแดชบอร์ด)
 */
export const getAdminStats = cache(async (includeDraft = false): Promise<AdminStats> => {
  const pubOnly = !includeDraft
  const statusCond = pubOnly ? " AND status='published'" : ''
  const wStatus = pubOnly ? " AND w.status='published'" : ''

  const [indicators, countRows, byDomain, totals, latestFy] = await Promise.all([
    getIndicators(),
    all<{ indicator_id: number; n: number }>(
      `SELECT indicator_id, COUNT(*) AS n FROM works
       WHERE deleted_at IS NULL${statusCond} GROUP BY indicator_id`),
    all<{ code: number; n: number }>(
      `SELECT d.code AS code, COUNT(w.id) AS n
       FROM domains d
       JOIN indicators i ON i.domain_id = d.id
       LEFT JOIN works w ON w.indicator_id = i.id AND w.deleted_at IS NULL${wStatus}
       GROUP BY d.code`),
    one<{ works: number; hours: number; awards: number }>(`
      SELECT
        (SELECT COUNT(*) FROM works WHERE deleted_at IS NULL${statusCond}) AS works,
        (SELECT COALESCE(SUM(hours),0) FROM self_developments WHERE deleted_at IS NULL) AS hours,
        (SELECT COUNT(*) FROM awards WHERE deleted_at IS NULL) AS awards`),
    scalar<number>('SELECT fiscal_year FROM pa_agreements WHERE deleted_at IS NULL ORDER BY fiscal_year DESC LIMIT 1'),
  ])

  const counts = new Map(countRows.map((r) => [Number(r.indicator_id), Number(r.n)]))
  const filled = new Map<number, number>([[1, 0], [2, 0], [3, 0]])
  const totalPerDomain = new Map<number, number>([[1, 0], [2, 0], [3, 0]])
  const missing: string[] = []
  for (const ind of indicators) {
    const dc = Number(ind.domain_code)
    totalPerDomain.set(dc, (totalPerDomain.get(dc) ?? 0) + 1)
    if ((counts.get(ind.id) ?? 0) > 0) filled.set(dc, (filled.get(dc) ?? 0) + 1)
    else missing.push(ind.code)
  }

  return {
    total_works: Number(totals?.works ?? 0),
    works_by_domain: new Map(byDomain.map((r) => [Number(r.code), Number(r.n)])),
    filled,
    total_per_domain: totalPerDomain,
    filled_total: [...filled.values()].reduce((a, b) => a + b, 0),
    indicator_total: indicators.length,
    self_dev_hours: Number(totals?.hours ?? 0),
    awards: Number(totals?.awards ?? 0),
    missing,
    fiscal_year: Number(latestFy ?? new Date().getFullYear() + 544),
  }
})

/** จำนวนผลงานที่เพิ่มในเดือนนี้ */
export const getWorksAddedThisMonth = async (): Promise<number> => {
  const first = new Date()
  const from = `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, '0')}-01 00:00:00`
  return Number(await scalar<number>(
    'SELECT COUNT(*) FROM works WHERE deleted_at IS NULL AND created_at >= ?', [from]) ?? 0)
}

/** ผลงานล่าสุดรวมฉบับร่าง (ใช้ในแดชบอร์ดหลังบ้าน) */
export const getRecentWorksIncludingDraft = (limit = 6) =>
  all<Work>(`SELECT w.*, i.code AS indicator_code, i.name AS indicator_name, d.code AS domain_code
             FROM works w
             JOIN indicators i ON i.id = w.indicator_id
             JOIN domains d ON d.id = i.domain_id
             WHERE w.deleted_at IS NULL
             ORDER BY w.work_date DESC, w.id DESC LIMIT ?`, [limit])
