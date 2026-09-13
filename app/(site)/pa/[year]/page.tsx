import PaView from '@/components/PaView'
import { getAgreements } from '@/lib/queries'

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return { title: `ข้อตกลงในการพัฒนางาน ปีงบประมาณ ${year}` }
}

/** สร้างหน้าของทุกปีงบประมาณไว้ล่วงหน้า */
export async function generateStaticParams() {
  const list = await getAgreements()
  return list.map((a) => ({ year: String(a.fiscal_year) }))
}

export default async function PaYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return <PaView year={Number(year) || undefined} />
}
