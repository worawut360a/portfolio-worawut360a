export function Field({
  label, hint, children, required,
}: { label: string; hint?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] font-bold text-ink-muted mb-1">
        {label}{required && <span className="text-[#C0392B]"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-[11.5px] text-ink-faint mt-1">{hint}</span>}
    </label>
  )
}

export const inputClass =
  'w-full h-11 px-3.5 rounded-xl border border-[color:var(--border)] bg-white ' +
  'focus:border-[color:var(--primary)] focus:outline-none text-[14px]'

export const areaClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-[color:var(--border)] bg-white ' +
  'focus:border-[color:var(--primary)] focus:outline-none text-[14px] leading-relaxed'

export function Card({ title, children, actions }: { title?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className="card-soft p-5 md:p-6">
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && <h2 className="font-extrabold text-[16px]">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}
