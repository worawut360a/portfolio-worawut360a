'use client'

import { useState } from 'react'

/**
 * หีบเพลงย่อ/ขยายรายด้าน — ยกมาจากสคริปต์ .js-accordion ในหน้า pa-agreement.php
 * เปิดไว้เป็นค่าเริ่มต้นเหมือนเว็บ PHP
 *
 * รับ header เป็นเนื้อหา (ไม่ใช่ฟังก์ชัน) เพราะ Server Component
 * ส่งฟังก์ชันข้ามมาให้ Client Component ไม่ได้ — ป้ายย่อ/ขยายจึงวาดในนี้เอง
 */
export default function DomainAccordion({
  header, children,
}: { header: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <>
      <button type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="js-accordion relative overflow-hidden w-full px-5 md:px-6 py-4 flex items-center gap-3.5 text-left text-white min-h-[64px]"
        style={{ background: 'var(--acc-bg)' }}>
        {header}
        <span className="relative js-caret shrink-0 chip chip-glass !text-ink !text-[11.5px]">
          {open ? '▲ ย่อ' : '▼ ขยาย'}
        </span>
      </button>
      <div className={`js-panel p-3 md:p-4 grid gap-3${open ? '' : ' hidden'}`}>{children}</div>
    </>
  )
}
