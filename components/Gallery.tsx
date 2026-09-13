'use client'

import { useState } from 'react'
import { imageUrl, IMG } from '@/lib/media'
import type { MediaSource } from '@/lib/media'

export interface GalleryItem {
  id: number; source: MediaSource; ref: string; caption: string
}

/**
 * สไลด์โชว์ + แถบภาพย่อ + กดดูเต็มจอ
 * เขียนเองด้วย React ล้วน ไม่พึ่งไลบรารีภายนอก (ลดขนาดที่ผู้ใช้ต้องโหลด)
 */
export default function Gallery({ images, title }: { images: GalleryItem[]; title: string }) {
  const [i, setI] = useState(0)
  const [zoom, setZoom] = useState(false)
  const n = images.length
  if (n === 0) return null
  const cur = images[Math.min(i, n - 1)]!
  const go = (d: number) => setI((v) => (v + d + n) % n)

  return (
    <div>
      <div className="relative rounded-[1.4rem] overflow-hidden shadow-[var(--shadow-lg)] bg-white
                      h-[220px] sm:h-[340px] lg:h-[440px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(cur, IMG.full)}
          alt={cur.caption || title}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={() => setZoom(true)}
        />
        <span className="absolute top-4 left-4 chip chip-glass !text-[11px]">รูปที่ {i + 1}/{n}</span>
        {cur.caption && (
          <span className="absolute left-4 right-4 bottom-4 rounded-2xl px-4 py-2 text-[12px] font-medium
                           text-white bg-black/55 backdrop-blur-sm line-2 pointer-events-none">
            {cur.caption}
          </span>
        )}
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="รูปก่อนหน้า"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white
                         grid place-items-center font-bold shadow">‹</button>
            <button type="button" onClick={() => go(1)} aria-label="รูปถัดไป"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white
                         grid place-items-center font-bold shadow">›</button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="mt-3 flex gap-2 scroll-x pb-1">
          {images.map((im, k) => (
            <button key={im.id} type="button" onClick={() => setI(k)} aria-label={`ดูรูปที่ ${k + 1}`}
              className={`shrink-0 w-[110px] h-[68px] rounded-xl overflow-hidden border-2 transition ${
                k === i ? 'border-[color:var(--primary)]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(im, IMG.thumb)} alt="" loading="lazy" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="mt-2.5 text-[11.5px] text-ink-faint text-center">
        คลิกรูปเพื่อดูขนาดเต็ม{n > 1 && ' · เลือกจากแถบภาพย่อด้านล่าง'}
      </p>

      {zoom && (
        <div role="dialog" aria-modal="true" onClick={() => setZoom(false)}
          className="fixed inset-0 z-[100] bg-black/85 grid place-items-center p-4 cursor-zoom-out">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl(cur, IMG.full)} alt={cur.caption || title}
            className="max-w-full max-h-full object-contain rounded-lg" />
          <button type="button" aria-label="ปิด"
            className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/90 grid place-items-center font-bold">✕</button>
        </div>
      )}
    </div>
  )
}
