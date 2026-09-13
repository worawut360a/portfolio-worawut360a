'use client'

import { useCallback, useEffect, useState } from 'react'
import { useWorkModal } from './WorkModal'
import { deleteWork } from '@/app/admin/indicator/[id]/actions'
import { confirmDelete, toastSuccess, toastError, alertError } from '@/lib/ui'

interface Row {
  id: number; title: string; url: string; cover_url: string | null
  semester: number; academic_year: number; status: string
  view_count: number; is_featured: number; image_count: number; file_count: number
}

const PER_PAGE = 10

/**
 * ตารางผลงานของตัวชี้วัด — ยกมาจากสคริปต์ใน admin/indicator.php
 * ค้นหา/กรอง/เรียง/แบ่งหน้า ผ่าน /api/works เหมือนเดิม ไม่โหลดหน้าใหม่
 */
export default function AdminWorkTable({
  indicatorId, years,
}: { indicatorId: number; years: number[] }) {
  const { add, edit } = useWorkModal()
  const [q, setQ] = useState('')
  const [year, setYear] = useState(0)
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)

  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // หน่วงการค้นหาไว้ 350ms เหมือนเว็บ PHP จะได้ไม่ยิง API ทุกตัวอักษร
  const [qDebounced, setQDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setQDebounced(q.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [q])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({
        indicator_id: String(indicatorId), q: qDebounced, academic_year: String(year),
        status, sort, page: String(page), per_page: String(PER_PAGE), admin: '1',
      })
      const res = await fetch(`/api/works?${p}`, { cache: 'no-store' })
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRows(json.rows)
      setTotal(json.total)
      setLastPage(json.last_page)
      if (json.page !== page) setPage(json.page)
    } catch {
      toastError('โหลดข้อมูลไม่สำเร็จ')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [indicatorId, qDebounced, year, status, sort, page])

  useEffect(() => { void load() }, [load])

  async function remove(r: Row) {
    if (!(await confirmDelete(r.title))) return
    try {
      const res = await deleteWork(r.id)
      if (!res.ok) { alertError(res.error || 'ลบไม่สำเร็จ'); return }
      toastSuccess(`ลบผลงาน “${r.title}” เรียบร้อยแล้ว`)
      void load()
    } catch {
      alertError('ลบไม่สำเร็จ')
    }
  }

  return (
    <>
      {/* ตัวกรอง */}
      <section className="mt-4 card-soft p-4 md:p-5">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-2.5">
          <label className="flex items-center gap-2 bg-white border-2 border-[color:var(--border)] rounded-full px-4 min-h-[46px] focus-within:border-primary transition-colors">
            <span>🔍</span>
            <input type="search" placeholder="ค้นหาชื่อผลงาน แท็ก หรือเนื้อหา…" aria-label="ค้นหา"
              className="bg-transparent outline-none w-full py-2.5 text-[13px]"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <select className="inp !rounded-full !py-2.5 text-[12.5px]" aria-label="ปีการศึกษา"
            value={year} onChange={(e) => { setYear(Number(e.target.value)); setPage(1) }}>
            <option value="0">ทุกปีการศึกษา</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="inp !rounded-full !py-2.5 text-[12.5px]" aria-label="สถานะ"
            value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">ทุกสถานะ</option>
            <option value="published">เผยแพร่</option>
            <option value="draft">ฉบับร่าง</option>
          </select>
          <select className="inp !rounded-full !py-2.5 text-[12.5px]" aria-label="เรียงตาม"
            value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}>
            <option value="latest">ล่าสุด</option><option value="oldest">เก่าสุด</option>
            <option value="popular">ยอดชม</option><option value="title">ชื่อผลงาน</option>
          </select>
        </div>
      </section>

      {/* ตาราง */}
      <section className="mt-4 card-soft p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h2 className="font-bold text-[16px]">📚 ผลงานในตัวชี้วัดนี้</h2>
          <p className="text-[12.5px] text-ink-muted">
            {loading ? 'กำลังโหลด…' : <>พบ <b className="text-primary-deep">{total}</b> ผลงานในตัวชี้วัดนี้ (รวมฉบับร่าง)</>}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="adm-table min-w-[760px] md:min-w-0">
            <thead>
              <tr><th className="col-no">#</th><th>ชื่อผลงาน</th><th>ปีการศึกษา</th><th>สถานะ</th><th>รูป/ไฟล์</th><th>เข้าชม</th><th>จัดการ</th></tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-10 text-center text-ink-muted">
                  <span className="spin inline-block mr-1">⏳</span> กำลังโหลด…
                </td></tr>
              )}
              {!loading && rows.map((w, idx) => (
                <tr key={w.id}>
                  {/* ลำดับต่อเนื่องข้ามหน้า (หน้า 2 เริ่มที่ 11 เมื่อหน้าละ 10) */}
                  <td className="col-no" data-label="ลำดับ">{(page - 1) * PER_PAGE + idx + 1}</td>
                  <td data-label="ชื่อผลงาน">
                    <span className="flex items-center gap-3 min-w-0 md:max-w-[380px]">
                      {w.cover_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={w.cover_url} alt="" loading="lazy"
                            className="w-14 h-11 rounded-xl object-cover shrink-0 border border-[color:var(--border)]" />
                        : <span className="w-14 h-11 rounded-xl grid place-items-center text-lg shrink-0 grad-soft">🖼️</span>}
                      <span className="min-w-0">
                        <b className="block text-[13px] leading-snug line-2">
                          {w.title.length > 56 ? w.title.slice(0, 56) + '…' : w.title}
                        </b>
                        {Number(w.is_featured) === 1 && (
                          <span className="mt-1 inline-flex gap-1">
                            <span className="chip chip-accent !px-2 !py-1 !text-[10px]">⭐ เด่น</span>
                          </span>
                        )}
                      </span>
                    </span>
                  </td>
                  <td data-label="ปีการศึกษา"><span className="font-semibold text-ink-soft">{w.semester}/{w.academic_year}</span></td>
                  <td data-label="สถานะ">
                    <span className={`chip ${w.status === 'published' ? 'chip-2' : 'chip-accent'}`}>
                      {w.status === 'published' ? '● เผยแพร่' : '○ ฉบับร่าง'}
                    </span>
                  </td>
                  <td data-label="รูป/ไฟล์"><span className="text-ink-soft whitespace-nowrap">🖼️ {w.image_count} · 📎 {w.file_count}</span></td>
                  <td data-label="เข้าชม"><span className="font-semibold">{Number(w.view_count) || '—'}</span></td>
                  <td data-label="จัดการ">
                    <span className="inline-flex gap-1.5 justify-end">
                      <a className="icon-btn" href={w.url} target="_blank" rel="noreferrer" title="ดูหน้าเว็บ" aria-label="ดูหน้าเว็บ">👁️</a>
                      <button type="button" className="icon-btn edit" title="แก้ไข" aria-label="แก้ไข"
                        onClick={() => void edit(w.id)}>✏️</button>
                      <button type="button" className="icon-btn del" title="ลบ" aria-label="ลบ"
                        onClick={() => void remove(w)}>🗑️</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <p className="text-center text-ink-muted py-12 text-[13px]">
            <span className="block text-5xl mb-3">🌸</span>ยังไม่มีผลงานในตัวชี้วัดนี้<br />
            <button type="button" className="btn btn-primary btn-sm mt-4" onClick={add}>+ เพิ่มผลงานใหม่</button>
          </p>
        )}

        <nav className="flex justify-center items-center gap-2 pt-6 flex-wrap" aria-label="แบ่งหน้า">
          {lastPage > 1 && Array.from({ length: lastPage }, (_, i) => i + 1).map((i) => (
            <button key={i} type="button" aria-label={`หน้า ${i}`} aria-current={i === page ? 'page' : undefined}
              onClick={() => setPage(i)}
              className={`w-10 h-10 rounded-full font-bold text-sm transition ${i === page
                ? 'grad-bg text-white shadow-glow'
                : 'bg-white border-2 border-[color:var(--border)] text-ink-soft hover:border-primary-line'}`}>
              {i}
            </button>
          ))}
        </nav>
      </section>
    </>
  )
}
