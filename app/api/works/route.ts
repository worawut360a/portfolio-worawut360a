import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { getWorkPage, type WorkSort } from '@/lib/queries'
import { imageUrl, IMG } from '@/lib/media'

/**
 * API ค้นหาผลงาน — ตรงกับ api/works.php ของเว็บ PHP
 * ใช้โดยหน้าตัวชี้วัดฝั่งหน้าเว็บ และตารางผลงานในหลังบ้าน
 *
 * admin=1 จะรวมฉบับร่างมาด้วย — แต่ต้องล็อกอินจริงเท่านั้น ไม่งั้นข้อมูลที่ยังไม่เผยแพร่จะรั่ว
 */
export const dynamic = 'force-dynamic'

const SORTS: WorkSort[] = ['latest', 'oldest', 'popular', 'title']

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const sortRaw = p.get('sort') ?? 'latest'
  const statusRaw = p.get('status') ?? ''
  const isAdmin = p.get('admin') === '1' && !!(await getSession())

  const result = await getWorkPage({
    indicatorId: Number(p.get('indicator_id')) || undefined,
    academicYear: Number(p.get('academic_year')) || undefined,
    q: (p.get('q') ?? '').trim().slice(0, 120) || undefined,
    sort: (SORTS as string[]).includes(sortRaw) ? (sortRaw as WorkSort) : 'latest',
    page: Number(p.get('page')) || 1,
    perPage: Number(p.get('per_page')) || 9,
    includeDraft: isAdmin,
    status: isAdmin && (statusRaw === 'draft' || statusRaw === 'published') ? statusRaw : undefined,
  })

  return NextResponse.json({
    ...result,
    rows: result.rows.map((w) => ({
      id: w.id,
      title: w.title,
      url: `/work/${w.slug}`,
      cover_url: imageUrl({ source: w.cover_source, ref: w.cover_ref }, IMG.card),
      indicator_code: w.indicator_code,
      indicator_name: w.indicator_name,
      domain_code: w.domain_code,
      semester: w.semester,
      academic_year: w.academic_year,
      status: w.status,
      view_count: w.view_count,
      is_featured: w.is_featured,
      image_count: w.image_count,
      file_count: w.file_count,
    })),
  })
}
