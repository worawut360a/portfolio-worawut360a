import DevelopmentView from '@/components/DevelopmentView'
import { getSelfDevYears } from '@/lib/queries'

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return { title: `การพัฒนาตนเอง ปีงบประมาณ ${year}` }
}

/** สร้างหน้าของทุกปีงบประมาณไว้ล่วงหน้า */
export async function generateStaticParams() {
  const years = await getSelfDevYears()
  return years.map((y) => ({ year: String(y) }))
}

export default async function DevelopmentYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return <DevelopmentView year={Number(year) || undefined} />
}
