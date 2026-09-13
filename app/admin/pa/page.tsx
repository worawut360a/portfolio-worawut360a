import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import {
  getAgreements, getAgreementById, getDomains, getIndicators,
  getPaChallenges, getPaDetails, getIndicatorOverviewGrouped,
} from '@/lib/queries'
import { domainTheme, currentFiscalYear, excerpt } from '@/lib/theme'
import { fileUrl } from '@/lib/media'
import PageHead from '@/components/admin/PageHead'
import YearSelect from '@/components/YearSelect'
import Tabs from '@/components/admin/Tabs'
import { NewYearProvider, NewYearButton } from '@/components/admin/NewYearModal'
import AjaxForm, { SubmitButton } from '@/components/admin/AjaxForm'
import ConfirmDelete from '@/components/admin/ConfirmDelete'
import DriveLinkInput from '@/components/admin/DriveLinkInput'
import { PaDetailProvider, AddDetailButton, EditDetailButton } from '@/components/admin/PaDetailModal'
import { ChallengeProvider, NewChallengeButton, EditChallengeButton } from '@/components/admin/PaChallengeModal'
import { saveAgreementInfo, savePdf, deleteDetail, deleteChallenge, deleteAgreement } from './actions'

const STATUS_LABEL: Record<string, string> = {
  draft: 'ฉบับร่าง', in_progress: 'กำลังดำเนินการ', evaluated: 'ประเมินแล้ว',
}

/** ตัดศูนย์ท้ายทศนิยมทิ้งเหมือน PHP ที่ cast เป็น (float) แล้วพิมพ์ */
const trimNum = (n: unknown) => String(Number(n ?? 0))

export default async function PaAdmin({
  searchParams,
}: { searchParams: Promise<{ id?: string; new?: string }> }) {
  await requireAdmin()   // ต้องตรวจในทุกหน้า ไม่ใช่แค่ layout — Next render layout กับ page พร้อมกัน
  const sp = await searchParams

  const [agreements, indicators, domains] = await Promise.all([
    getAgreements(), getIndicators(), getDomains(),
  ])

  const wanted = Number(sp.id ?? 0)
  const cur = (wanted ? await getAgreementById(wanted) : null) ?? agreements[0] ?? null
  const curId = cur ? Number(cur.id) : 0

  const [details, challenges, overview] = await Promise.all([
    curId ? getPaDetails(curId) : Promise.resolve([]),
    curId ? getPaChallenges(curId) : Promise.resolve([]),
    getIndicatorOverviewGrouped(curId, true),   // รวมฉบับร่าง — หลังบ้านต้องเห็นของตัวเองครบ
  ])
  const totalWorks = [...overview.values()]
    .reduce((s, rows) => s + rows.reduce((a, r) => a + Number(r.work_count), 0), 0)

  const nextYear = Number(agreements[0]?.fiscal_year ?? currentFiscalYear() - 1) + 1
  const years = agreements.map((a) => ({ id: Number(a.id), fiscal_year: Number(a.fiscal_year) }))

  const groups = domains.map((d) => ({
    code: Number(d.code),
    name: d.name,
    indicators: indicators.filter((i) => Number(i.domain_code) === Number(d.code))
      .map((i) => ({ id: Number(i.id), code: i.code, name: i.name })),
  }))

  const yearItems = agreements.map((a) => ({
    year: Number(a.fiscal_year),
    meta: `รอบที่ ${a.round} · ${STATUS_LABEL[a.status] ?? '—'}`
      + ` · ตัวชี้วัด ${a.detail_count}/15 · PDF ${a.pdf_ref ? '✓' : '—'}`,
    url: `/admin/pa?id=${a.id}`,
    active: Number(a.id) === curId,
  }))

  /* ---------------- ตอนที่ 1 ---------------- */
  const panel1 = cur && (
    <section className="card-soft p-5 md:p-7">
      <div className="mb-5">
        <h2 className="font-bold text-[16px]">🧑‍🏫 ตอนที่ 1 · ข้อมูลผู้จัดทำข้อตกลง</h2>
        <p className="text-[12.5px] text-ink-muted mt-0.5">
          ตำแหน่ง สถานศึกษา รอบการประเมิน และผลการประเมินของปีงบประมาณ {cur.fiscal_year}
        </p>
      </div>
      <AjaxForm action={saveAgreementInfo} successMsg="บันทึกตอนที่ 1 สำเร็จ!">
        <input type="hidden" name="id" value={curId} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className="lbl" htmlFor="a_pos">ตำแหน่ง</label><input className="inp" id="a_pos" name="position" defaultValue={cur.position} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_std">วิทยฐานะ</label><input className="inp" id="a_std" name="academic_standing" defaultValue={cur.academic_standing} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_grp">กลุ่มสาระ</label><input className="inp" id="a_grp" name="subject_group" defaultValue={cur.subject_group} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_school">สถานศึกษา</label><input className="inp" id="a_school" name="school" defaultValue={cur.school} /><span className="field-error"></span></div>
          <div className="lg:col-span-2"><label className="lbl" htmlFor="a_aff">สังกัด</label><input className="inp" id="a_aff" name="affiliation" defaultValue={cur.affiliation} /><span className="field-error"></span></div>

          <div><label className="lbl" htmlFor="a_start">เริ่มรอบการประเมิน</label><input className="inp" id="a_start" name="period_start" type="date" defaultValue={cur.period_start ?? ''} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_end">สิ้นสุดรอบ</label><input className="inp" id="a_end" name="period_end" type="date" defaultValue={cur.period_end ?? ''} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_round">รอบที่</label>
            <select className="inp" id="a_round" name="round" defaultValue={String(cur.round)}>
              <option value="1">รอบที่ 1</option>
              <option value="2">รอบที่ 2</option>
            </select></div>

          <div><label className="lbl" htmlFor="a_th">ชั่วโมงสอน/สัปดาห์</label><input className="inp" id="a_th" name="teaching_hours" type="number" step="0.5" min="0" defaultValue={trimNum(cur.teaching_hours)} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_sh">ชม.งานส่งเสริมสนับสนุน/สัปดาห์</label><input className="inp" id="a_sh" name="support_hours" type="number" step="0.5" min="0" defaultValue={trimNum(cur.support_hours)} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_status">สถานะ</label>
            <select className="inp" id="a_status" name="status" defaultValue={cur.status}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></div>

          <div><label className="lbl" htmlFor="a_score">คะแนนประเมิน (ร้อยละ)</label>
            <input className="inp" id="a_score" name="evaluation_score" type="number" step="0.01" min="0" max="100"
              defaultValue={cur.evaluation_score !== null ? trimNum(cur.evaluation_score) : ''} /><span className="field-error"></span></div>
          <div><label className="lbl" htmlFor="a_result">ผลการประเมิน</label>
            <select className="inp" id="a_result" name="evaluation_result" defaultValue={cur.evaluation_result ?? ''}>
              <option value="">ยังไม่ประเมิน</option>
              <option value="pass">ผ่าน</option>
              <option value="fail">ไม่ผ่าน</option>
            </select></div>
          <div className="lg:col-span-3"><label className="lbl" htmlFor="a_note">หมายเหตุ</label><input className="inp" id="a_note" name="note" maxLength={500} defaultValue={cur.note} /><span className="field-error"></span></div>
        </div>
        <div className="flex justify-end mt-6 pt-5 border-t border-[color:var(--divider)]">
          <SubmitButton>💾 บันทึกตอนที่ 1</SubmitButton>
        </div>
      </AjaxForm>
    </section>
  )

  /* ---------------- ตอนที่ 2 ---------------- */
  const panel2 = cur && (
    <PaDetailProvider agreementId={curId} fiscalYear={Number(cur.fiscal_year)} groups={groups}>
      <div className="card-soft px-4 md:px-5 py-3.5 mb-4 flex items-start gap-3 bg-sunny-soft/50 border-sunny/40">
        <span className="text-xl leading-none mt-0.5">💡</span>
        <p className="text-[12.5px] text-ink-soft leading-relaxed">
          แต่ละแถวคือ 1 ตัวชี้วัด · ปุ่ม <b className="text-ink">✏️</b> แก้ไขข้อความข้อตกลงของปีงบประมาณ {cur.fiscal_year}
          {' '}· ปุ่ม <b className="text-ink">📚 ผลงาน</b> เปิดหน้าเพิ่ม/แก้ไข/ลบผลงานของตัวชี้วัดนั้น
          {' '}(รวม <b className="text-ink">{totalWorks}</b> ผลงาน)
        </p>
      </div>

      {domains.map((d) => {
        const dc = Number(d.code)
        const t = domainTheme(dc)
        const rows = overview.get(dc) ?? []
        const dFill = rows.filter((r) => r.pa !== null).length
        const dWorks = rows.reduce((a, r) => a + Number(r.work_count), 0)
        const dPct = rows.length ? Math.round((dFill / rows.length) * 100) : 0

        return (
          <section key={d.id} className="card-soft overflow-hidden mb-4">
            {/* หัวด้าน */}
            <div className="relative overflow-hidden px-4 md:px-5 py-4 text-white" style={{ background: t.grad }}>
              <div className="absolute inset-0 dots opacity-25 pointer-events-none" />
              <div className="relative flex flex-wrap items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-white/20 grid place-items-center text-xl shrink-0">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10.5px] font-semibold tracking-[.14em] uppercase text-white/80">ด้านที่ {dc}</p>
                  <h3 className="text-[15px] md:text-[16px] font-extrabold leading-tight truncate">{d.name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="chip chip-glass">📝 ข้อตกลง {dFill}/{rows.length}</span>
                  <span className="chip chip-glass">📚 {dWorks} ผลงาน</span>
                </div>
              </div>
              <div className="relative mt-3 bar !bg-white/25 !h-[6px]"><span className="!bg-white" style={{ width: `${dPct}%` }} /></div>
            </div>

            {/* แถวตัวชี้วัด */}
            <div className="p-3 md:p-4 flex flex-col gap-2.5">
              {rows.map((r) => {
                const pa = r.pa
                const n = Number(r.work_count)
                return (
                  <div key={r.id}
                    className={`rounded-[1.25rem] border-2 px-4 py-3.5 transition-colors ${
                      pa ? 'bg-white border-[color:var(--border)] hover:border-primary-line' : 'bg-sunny-soft/40 border-sunny/40'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start gap-3">
                      <span className="shrink-0 h-9 min-w-[3.25rem] px-2.5 rounded-xl grid place-items-center text-[12.5px] font-extrabold"
                        style={{ background: t.soft, color: t.deep }}>{r.code}</span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-bold leading-snug">{r.name}</p>
                        {pa ? (
                          <>
                            <p className="mt-1 text-[12.5px] text-ink-soft leading-relaxed">{pa.task_description}</p>
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-muted leading-relaxed">
                              <span><b className="text-mint-deep">ปริมาณ:</b> {pa.expected_quantity || '—'}</span>
                              <span><b className="text-sky-deep">คุณภาพ:</b> {pa.expected_quality || '—'}</span>
                            </div>
                          </>
                        ) : (
                          <p className="mt-1 text-[12px] text-sunny-deep font-semibold">
                            ⚠️ ยังไม่ได้กรอกข้อตกลงของปีงบประมาณ {cur.fiscal_year}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2 flex-wrap lg:justify-end">
                        <Link href={`/admin/indicator/${r.id}`} className="btn btn-ghost btn-sm whitespace-nowrap"
                          title="เพิ่ม/แก้ไข/ลบผลงานของตัวชี้วัดนี้">
                          📚 ผลงาน <b className="ml-0.5 rounded-full px-2 py-0.5 text-[11px] text-white" style={{ background: t.solid }}>{n}</b>
                        </Link>

                        {pa ? (
                          <>
                            <EditDetailButton detail={pa} code={r.code} />
                            <ConfirmDelete action={deleteDetail.bind(null, Number(pa.id))}
                              name={`ข้อตกลงตัวชี้วัด ${r.code}`}
                              title="ลบข้อตกลงของตัวชี้วัดนี้" ariaLabel="ลบข้อตกลง" />
                          </>
                        ) : (
                          <AddDetailButton indicatorId={Number(r.id)} code={r.code} />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <p className="text-[11.5px] text-ink-muted px-1">
        กรอกข้อตกลงแล้ว <b className="text-ink">{details.length}</b> จาก 15 ตัวชี้วัด · ข้อมูลนี้เป็นของปีงบประมาณ {cur.fiscal_year} เท่านั้น
      </p>
    </PaDetailProvider>
  )

  /* ---------------- ตอนที่ 3 ---------------- */
  const panel3 = cur && (
    <ChallengeProvider agreementId={curId}>
      <section className="card-soft p-5 md:p-7">
        <div className="flex justify-between items-center gap-3 flex-wrap mb-4">
          <div>
            <h2 className="font-bold text-[16px]">🎯 ประเด็นท้าทายในการพัฒนาผลลัพธ์ผู้เรียน</h2>
            <p className="text-[12.5px] text-ink-muted mt-0.5">ตอนที่ 3 ของข้อตกลง · ปีงบประมาณ {cur.fiscal_year}</p>
          </div>
          <NewChallengeButton />
        </div>

        {challenges.length === 0 && (
          <div className="text-center py-10">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-ink-muted text-[13px]">ยังไม่มีประเด็นท้าทายในปีนี้</p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {challenges.map((c) => (
            <div key={c.id} className="relative overflow-hidden rounded-[1.5rem] grad-soft border border-[color:var(--border)] p-5">
              <div className="absolute inset-0 dots opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-2xl grad-bg text-white shadow-glow grid place-items-center text-lg shrink-0">🎯</span>
                    <h4 className="text-[16px] font-extrabold leading-snug text-ink pt-1.5">{c.topic}</h4>
                  </div>
                  <span className="flex gap-1.5 shrink-0">
                    <EditChallengeButton challenge={c} />
                    <ConfirmDelete action={deleteChallenge.bind(null, Number(c.id))}
                      name={excerpt(c.topic, 40)} title="ลบ" ariaLabel="ลบประเด็นท้าทาย" />
                  </span>
                </div>
                <div className="mt-4 grid md:grid-cols-3 gap-3">
                  {([['🔎', 'สภาพปัญหา', c.problem_statement],
                     ['🛠️', 'วิธีดำเนินการ', c.method],
                     ['🌟', 'ผลลัพธ์ที่คาดหวัง', c.expected_outcome]] as const).map(([ic, k, v]) => (
                    <div key={k} className="bg-white/85 backdrop-blur rounded-2xl px-4 py-3 border border-white">
                      <p className="text-[11px] font-extrabold text-primary-deep">{ic} {k}</p>
                      <p className="mt-1 text-[12.5px] text-ink-soft leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </ChallengeProvider>
  )

  /* ---------------- ไฟล์ PDF ---------------- */
  const pdfHref = cur ? fileUrl({ source: cur.pdf_source, ref: cur.pdf_ref }) : null
  const panel4 = cur && (
    <section className="card-soft p-5 md:p-7">
      <div className="mb-5">
        <h2 className="font-bold text-[16px]">📕 ไฟล์แบบบันทึกข้อตกลง PA1/ส</h2>
        <p className="text-[12.5px] text-ink-muted mt-0.5">
          วางลิงก์ไฟล์ PDF ฉบับลงนามจาก Google Drive ของปีงบประมาณ {cur.fiscal_year}
        </p>
      </div>
      <AjaxForm action={savePdf} successMsg="บันทึกไฟล์ PDF สำเร็จ!" className="max-w-lg">
        <input type="hidden" name="id" value={curId} />
        {pdfHref && (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-[color:var(--border)] bg-primary-soft/40 px-4 py-3 mb-5">
            <span className="w-12 h-12 rounded-2xl grad-bg text-white shadow-glow grid place-items-center text-[20px] shrink-0">📕</span>
            <span className="flex-1 min-w-0">
              <span className="block text-[13px] font-bold truncate">{cur.pdf_name || 'แบบบันทึกข้อตกลง PA1/ส'}</span>
              <span className="block text-[11px] text-ink-muted">
                {cur.pdf_source === 'drive' ? 'ลิงก์ Google Drive' : 'ไฟล์ที่มากับเทมเพลต'} · ไฟล์ปัจจุบัน
              </span>
            </span>
            <a href={pdfHref} target="_blank" rel="noreferrer" className="btn btn-white btn-sm">เปิดดู</a>
          </div>
        )}

        <label className="lbl" htmlFor="a_pdf">ลิงก์แบบบันทึกข้อตกลง PA1/ส (PDF บน Google Drive)</label>
        <DriveLinkInput name="pdf" id="a_pdf" defaultSource={cur.pdf_source} defaultRef={cur.pdf_ref} />

        <label className="lbl mt-4" htmlFor="a_pdf_name">ชื่อไฟล์ที่จะแสดง</label>
        <input className="inp" id="a_pdf_name" name="pdf_name" maxLength={200}
          defaultValue={cur.pdf_name ?? ''} placeholder="แบบบันทึกข้อตกลง PA1/ส.pdf" />

        <p className="text-[11.5px] text-ink-muted mt-2">
          ลิงก์เดิมจะถูกแทนที่ · ตั้งค่าไฟล์ใน Drive เป็น “ทุกคนที่มีลิงก์” ก่อน · ไฟล์นี้ผูกกับปีงบประมาณ {cur.fiscal_year} เท่านั้น
        </p>
        <div className="flex justify-end mt-6 pt-5 border-t border-[color:var(--divider)]">
          <SubmitButton>💾 บันทึกไฟล์ PDF</SubmitButton>
        </div>
      </AjaxForm>
    </section>
  )

  return (
    <NewYearProvider nextYear={nextYear} years={years} autoOpen={sp.new === '1'}>
    <div className="flex flex-col gap-0">
      <PageHead
        title="ข้อตกลง PA · ตัวชี้วัด · ผลงาน 📋"
        sub="แยกเก็บรายปีงบประมาณ · ตอนที่ 2 คือประตูเข้าสู่ผลงานของแต่ละตัวชี้วัด"
        actions={
          <NewYearButton className="btn btn-primary text-[12.5px]">+ สร้างปีงบประมาณใหม่</NewYearButton>
        }
      />

      {/* ===== เลือกปีงบประมาณ (dropdown) ===== */}
      <div className="mt-5 bg-white rounded-[1.6rem] p-5 shadow-soft border border-[color:var(--border)]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="w-11 h-11 rounded-2xl grid place-items-center text-xl bg-primary-soft shrink-0">📅</span>
          <div className="min-w-0">
            <h2 className="font-bold text-[15px]">ปีงบประมาณที่กำลังแก้ไข</h2>
            <p className="text-[12px] text-ink-muted mt-0.5">ข้อมูลแต่ละปีแยกจากกันโดยสมบูรณ์</p>
          </div>
          <div className="ml-auto">
            <NewYearButton className="btn btn-ghost btn-sm">+ สร้างปีงบประมาณ {nextYear}</NewYearButton>
          </div>
        </div>

        <div className="mt-4">
          <YearSelect items={yearItems} label="" tone="light"
            head="เลือกปีงบประมาณที่จะแก้ไข" note={`ทั้งหมด ${agreements.length} ปี`} />
        </div>
      </div>

      {!cur ? (
        <div className="mt-6 card-soft p-12 text-center">
          <div className="text-5xl mb-3 float">📋</div>
          <h2 className="font-extrabold text-[20px] leading-tight">ยังไม่มี<span className="grad-text">ข้อตกลง PA</span></h2>
          <p className="text-[13px] text-ink-muted mt-1">กด “สร้างปีงบประมาณใหม่” เพื่อเริ่มต้น</p>
          <NewYearButton className="btn btn-primary mt-5">+ สร้างปีงบประมาณใหม่</NewYearButton>
        </div>
      ) : (
        <>
          {/* ===== แถบปีที่กำลังแก้ไข ===== */}
          <section className="mt-6 relative overflow-hidden rounded-[1.8rem] grad-hero text-white shadow-glow">
            <div className="absolute inset-0 dots opacity-25 pointer-events-none" />
            <div className="blob blob-2 w-[220px] h-[220px] -right-16 -bottom-24 opacity-40" />
            <div className="relative px-5 md:px-7 py-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center text-2xl shrink-0">✏️</span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold tracking-[.14em] uppercase text-white/80">กำลังแก้ไข</p>
                  <h2 className="text-white font-extrabold text-[20px] md:text-[24px] leading-tight">
                    ปีงบประมาณ {cur.fiscal_year}{' '}
                    <span className="text-white/80 text-[15px] font-semibold">(รอบที่ {cur.round})</span>
                  </h2>
                </div>
              </div>
              <span className="chip chip-glass !text-[11.5px] self-start md:self-auto">
                🔒 มีผลเฉพาะปี {cur.fiscal_year} — ไม่กระทบปีอื่น
              </span>
            </div>
          </section>

          <Tabs
            tabs={[
              `📚 ตอนที่ 2 · ตัวชี้วัดและผลงาน (${details.length}/15)`,
              '🧑‍🏫 ตอนที่ 1 · ข้อมูลผู้จัดทำ',
              '🎯 ตอนที่ 3 · ประเด็นท้าทาย',
              '📕 ไฟล์ PDF',
            ]}
            panels={[panel2, panel1, panel3, panel4]}
          />

          {/* ===== ดูหน้าเว็บ + โซนอันตราย ===== */}
          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="card-soft p-5 flex items-center gap-3">
              <span className="w-11 h-11 rounded-2xl bg-primary-soft grid place-items-center text-xl shrink-0">👁️</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold">ดูหน้าเว็บสาธารณะของปีนี้</p>
                <p className="text-[11.5px] text-ink-muted">ตรวจดูข้อตกลงปี {cur.fiscal_year} ในมุมมองผู้เยี่ยมชม</p>
              </div>
              <a href={`/pa/${cur.fiscal_year}`} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">เปิดดู →</a>
            </div>

            <div className="rounded-[1.9rem] p-5 flex items-center gap-3 border-2 border-coral/25 bg-coral-soft/40">
              <span className="w-11 h-11 rounded-2xl bg-white grid place-items-center text-xl shrink-0 shadow-soft">🗑️</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-bold text-coral-deep">ลบข้อตกลงปี {cur.fiscal_year}</p>
                <p className="text-[11.5px] text-ink-muted">ลบตอนที่ 1–3 และไฟล์ PDF ของปีนี้ทั้งหมด · กู้คืนไม่ได้</p>
              </div>
              <ConfirmDelete action={deleteAgreement.bind(null, curId)}
                name={`ข้อตกลงปีงบประมาณ ${cur.fiscal_year}`}
                className="btn btn-danger btn-sm" done="/admin/pa">ลบทั้งปี</ConfirmDelete>
            </div>
          </div>
        </>
      )}
    </div>
    </NewYearProvider>
  )
}
