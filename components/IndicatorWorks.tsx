'use client'

import Link from 'next/link'
import AdminOnly from '@/components/AdminOnly'
import { useEffect, useRef, useState } from 'react'

/**
 * แถบเครื่องมือ + ตารางผลงาน + ตัวแบ่งหน้า ของหน้าตัวชี้วัด
 * แปลงจากสคริปต์ท้าย indicator.php ของเว็บ PHP (ค้นหา · กรองปี · เรียง · แบ่งหน้า)
 *
 * ทำงานแบบเดียวกัน: เรียก API แล้ววาดการ์ดใหม่โดยไม่โหลดหน้าใหม่
 * หน้าเว็บจึงยังถูกแคชได้ เพราะไม่ต้องอ่านเงื่อนไขจาก URL ตอน render ฝั่งเซิร์ฟเวอร์
 */

export interface ApiWork {
  id: number; title: string; url: string; cover_url: string
  indicator_code: string; indicator_name: string; domain_code: number
  semester: number; academic_year: number; view_count: number
  is_featured: number; image_count: number; file_count: number
}

export default function IndicatorWorks({
  indicatorId, initial, years,
}: {
  indicatorId: number
  initial: { rows: ApiWork[]; total: number; page: number; last_page: number }
  years: number[]
}) {
  const [data, setData] = useState(initial)
  const [q, setQ] = useState('')
  const [year, setYear] = useState(0)
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(initial.page)
  const [loading, setLoading] = useState(false)
  const first = useRef(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollNext = useRef(false)

  useEffect(() => {
    if (first.current) { first.current = false; return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const p = new URLSearchParams({
          indicator_id: String(indicatorId), page: String(page), per_page: '9', sort,
        })
        if (year) p.set('academic_year', String(year))
        if (q) p.set('q', q)
        const res = await fetch(`/api/works?${p}`)
        if (res.ok) setData(await res.json())
      } finally {
        setLoading(false)
        if (scrollNext.current) {
          scrollNext.current = false
          gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }, 380)   // หน่วงเท่ากับ debounce ของเว็บ PHP
    return () => clearTimeout(timer)
  }, [indicatorId, q, year, sort, page])

  const change = (fn: () => void) => { fn(); setPage(1) }

  return (
    <>
      {/* แถบเครื่องมือ */}
      <div className="mt-6 flex flex-col md:flex-row gap-2.5">
        <label className="flex-1 flex items-center gap-2.5 bg-white border-2 border-[color:var(--border)] rounded-full px-5 shadow-soft
                          transition focus-within:border-primary focus-within:shadow-glow">
          <span aria-hidden="true">🔍</span>
          <input type="search" value={q} onChange={(e) => change(() => setQ(e.target.value.trim()))}
            className="w-full py-3 bg-transparent outline-none text-[13.5px] min-h-[44px]"
            placeholder="ค้นหาในผลงานของตัวชี้วัดนี้…" aria-label="ค้นหาผลงาน" />
        </label>
        <select value={year} onChange={(e) => change(() => setYear(Number(e.target.value)))}
          className="inp !w-auto !rounded-full !py-3 text-[13px] font-semibold" aria-label="ปีการศึกษา">
          <option value={0}>ปีการศึกษา: ทั้งหมด</option>
          {years.map((y) => <option key={y} value={y}>ปีการศึกษา {y}</option>)}
        </select>
        <select value={sort} onChange={(e) => change(() => setSort(e.target.value))}
          className="inp !w-auto !rounded-full !py-3 text-[13px] font-semibold" aria-label="เรียงตาม">
          <option value="latest">เรียงตาม: ล่าสุด</option>
          <option value="oldest">เรียงตาม: เก่าสุด</option>
          <option value="popular">เรียงตาม: ยอดชม</option>
          <option value="title">เรียงตาม: ชื่อผลงาน</option>
        </select>
      </div>

      <p className="text-[13.5px] text-ink-muted mt-4 md:hidden">พบ <b className="text-primary-deep">{data.total}</b> ผลงาน</p>

      <div ref={gridRef} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6 scroll-mt-24">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-pop overflow-hidden">
                <div className="h-[190px] skeleton" />
                <div className="p-5">
                  <div className="h-4 skeleton rounded-full" />
                  <div className="h-4 mt-2 w-2/3 skeleton rounded-full" />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="h-3 w-16 skeleton rounded-full" />
                    <div className="h-3 w-20 skeleton rounded-full" />
                  </div>
                </div>
              </div>
            ))
          : data.rows.map((w) => (
              <article key={w.id} className="card-pop overflow-hidden group">
                <Link href={w.url} className="block">
                  <div className="relative h-[190px] overflow-hidden rounded-t-[inherit] bg-[color:var(--divider)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.cover_url} alt={`ภาพประกอบผลงาน ${w.title}`} width={800} height={500} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/60 to-transparent" />
                    <span className="absolute left-3 bottom-3 chip chip-glass !text-[11px]">
                      <span className="w-2 h-2 rounded-full" style={{ background: `var(--d${w.domain_code || 3})` }} />
                      {w.indicator_code} · {w.indicator_name.slice(0, 26)}
                    </span>
                    {Number(w.is_featured) === 1 && (
                      <span className="absolute top-3 right-3 chip chip-grad !text-[11px]">⭐ เด่น</span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-[15.5px] md:text-base font-semibold leading-snug line-2 group-hover:text-primary-deep transition-colors">{w.title}</h3>
                    <div className="mt-3 flex items-center justify-between gap-2 text-[11.5px] text-ink-muted font-medium">
                      <span>📅 {w.semester}/{w.academic_year}</span>
                      <span className="flex items-center gap-2">
                        {w.image_count > 0 && <span>🖼️ {w.image_count}</span>}
                        {w.file_count > 0 && <span>📎 {w.file_count}</span>}
                        <span>👁️ {Number(w.view_count).toLocaleString('th-TH')}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
      </div>

      {!loading && data.rows.length === 0 && (
        <div className="card-soft rounded-[2rem] text-center py-14 mt-2 text-ink-muted">
          <div className="text-5xl mb-3">🌸</div>
          {q || year ? 'ไม่พบผลงานตามเงื่อนไขที่เลือก' : 'ยังไม่มีผลงานในตัวชี้วัดนี้'}
          {!q && !year && (
            <AdminOnly>
              <div className="mt-4">
                <Link href={`/admin/indicator/${indicatorId}?new=1`} className="btn btn-primary">+ เพิ่มผลงานชิ้นแรก</Link>
              </div>
            </AdminOnly>
          )}
        </div>
      )}

      <nav className="flex justify-center items-center gap-2 py-8 flex-wrap" aria-label="หน้า">
        {data.last_page > 1 && (() => {
          const btn = (label: string, target: number, active = false, disabled = false) => (
            <button key={label + target} type="button" disabled={disabled}
              onClick={() => { scrollNext.current = true; setPage(target) }}
              style={disabled ? { opacity: .4 } : undefined}
              className={`w-11 h-11 rounded-full grid place-items-center font-bold text-sm border-2 transition ${
                active ? 'grad-bg text-white border-transparent shadow-glow'
                       : 'bg-white border-[color:var(--border)] text-ink-soft hover:border-primary-line hover:text-primary-deep hover:-translate-y-0.5'}`}>
              {label}
            </button>
          )
          return [
            btn('‹', Math.max(1, data.page - 1), false, data.page === 1),
            ...Array.from({ length: data.last_page }, (_, i) => btn(String(i + 1), i + 1, i + 1 === data.page)),
            btn('›', Math.min(data.last_page, data.page + 1), false, data.page === data.last_page),
          ]
        })()}
      </nav>
    </>
  )
}
