'use client'

import { useEffect, useRef, useState } from 'react'
import { imageUrl, IMG, type MediaSource } from '@/lib/media'

export interface GalleryImage {
  id: number; source: MediaSource; ref: string; caption: string
}

/**
 * สไลด์โชว์ผลงาน — แปลงจากส่วนแกลเลอรีของ work.php (Swiper + แถบภาพย่อ + ดูเต็มจอ)
 * พฤติกรรมเหมือนกัน: เลื่อนอัตโนมัติทุก 4 วินาที หยุดเมื่อชี้เมาส์ ปัดซ้าย-ขวาบนมือถือ คลิกดูเต็มจอ
 * เขียนเองด้วย React ไม่ต้องโหลดไลบรารี Swiper (ประหยัดขนาดที่ผู้ชมต้องดาวน์โหลด)
 */
export default function WorkGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(false)
  const [paused, setPaused] = useState(false)
  const touchX = useRef<number | null>(null)
  const n = images.length

  useEffect(() => {
    if (n <= 1 || paused || zoom) return
    const t = setInterval(() => setI((v) => (v + 1) % n), 4000)
    return () => clearInterval(t)
  }, [n, paused, zoom])

  useEffect(() => {
    if (!zoom) return
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(false) }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [zoom])

  if (n === 0) return null
  const cur = images[Math.min(i, n - 1)]!
  const go = (d: number) => setI((v) => (v + d + n) % n)

  /* ---------- รูปเดียว ---------- */
  if (n === 1) {
    return (
      <>
        <button type="button" onClick={() => setZoom(true)}
          className="group relative block w-full rounded-[2rem] overflow-hidden shadow-lift bg-[color:var(--divider)] h-[220px] sm:h-[340px] lg:h-[440px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(cur, IMG.full)} alt={cur.caption || `ภาพประกอบผลงาน ${title}`}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" />
          <span className="absolute top-4 right-4 chip chip-glass !text-[11px] opacity-90 group-hover:opacity-100 transition">🔍 ดูขนาดเต็ม</span>
          {cur.caption && (
            <span className="absolute left-4 right-4 bottom-4 glass-dark rounded-2xl px-4 py-2 text-[12px] font-medium line-2 pointer-events-none">
              {cur.caption}
            </span>
          )}
        </button>
        <p className="mt-2.5 text-[11.5px] text-ink-faint text-center">คลิกรูปเพื่อดูขนาดเต็ม (ปิดด้วย ESC)</p>
        {zoom && <Lightbox src={imageUrl(cur, IMG.full)} alt={cur.caption || title} onClose={() => setZoom(false)} />}
      </>
    )
  }

  /* ---------- หลายรูป ---------- */
  return (
    <div className="relative"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative w-full h-[220px] sm:h-[340px] lg:h-[440px] rounded-[2rem] overflow-hidden shadow-lift bg-white"
        onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null }}
        onTouchEnd={(e) => {
          const start = touchX.current
          const end = e.changedTouches[0]?.clientX
          if (start != null && end != null && Math.abs(end - start) > 40) go(end < start ? 1 : -1)
          touchX.current = null
        }}>
        <button type="button" onClick={() => setZoom(true)} className="block w-full h-full bg-[color:var(--divider)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(cur, IMG.full)} alt={cur.caption || `ภาพประกอบผลงาน ${title}`}
            className="w-full h-full object-cover" />
        </button>
        <span className="absolute top-4 left-4 z-10 chip chip-glass !text-[11px]">รูปที่ {i + 1}/{n}</span>
        {cur.caption && (
          <span className="absolute left-4 right-4 bottom-10 z-10 glass-dark rounded-2xl px-4 py-2 text-[12px] font-medium line-2 pointer-events-none">
            {cur.caption}
          </span>
        )}

        <button type="button" onClick={() => go(-1)} aria-label="รูปก่อนหน้า"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/85 hover:bg-white grid place-items-center font-bold shadow-soft transition">‹</button>
        <button type="button" onClick={() => go(1)} aria-label="รูปถัดไป"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/85 hover:bg-white grid place-items-center font-bold shadow-soft transition">›</button>

        <div className="absolute left-0 right-0 bottom-3 z-10 flex justify-center gap-1.5">
          {images.map((im, k) => (
            <button key={im.id} type="button" onClick={() => setI(k)} aria-label={`ไปรูปที่ ${k + 1}`}
              className={`h-2 rounded-full transition-all ${k === i ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/90'}`} />
          ))}
        </div>
      </div>

      {/* แถบ thumbnail */}
      <div className="w-full mt-3 flex gap-2 scroll-x pb-1">
        {images.map((im, k) => (
          <button key={im.id} type="button" onClick={() => setI(k)} aria-label={`ดูรูปที่ ${k + 1}`}
            className={`shrink-0 h-[64px] sm:h-[78px] w-[110px] rounded-xl overflow-hidden border-2 transition ${
              k === i ? 'border-[color:var(--primary)]' : 'border-transparent opacity-70 hover:opacity-100'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(im, IMG.thumb)} alt="ภาพย่อ" width={400} height={233} loading="lazy"
              className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-[11.5px] text-ink-faint text-center">
        สไลด์เลื่อนอัตโนมัติทุก 4 วินาที · หยุดเมื่อชี้เมาส์ · ปัดซ้าย-ขวาบนมือถือ · คลิกเพื่อดูเต็มจอ
      </p>

      {zoom && <Lightbox src={imageUrl(cur, IMG.full)} alt={cur.caption || title} onClose={() => setZoom(false)} />}
    </div>
  )
}

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/85 grid place-items-center p-4 cursor-zoom-out">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-w-full max-h-full object-contain rounded-lg" />
      <button type="button" aria-label="ปิด"
        className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/90 grid place-items-center font-bold">✕</button>
    </div>
  )
}
