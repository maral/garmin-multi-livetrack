import { notFound } from 'next/navigation'
import DynamicGrid from '@/components/DynamicGrid'
import { getSharedGridData } from '@/lib/shareData'

interface SharePageProps {
  params: Promise<{ shareId: string }>
}

export default async function SharePage({ params }: SharePageProps) {
  const { shareId } = await params
  
  if (!shareId) {
    notFound()
  }

  const sharedGrid = await getSharedGridData(shareId)
  
  if (!sharedGrid) {
    notFound()
  }

  const initialState = {
    rows: sharedGrid.rows,
    cols: sharedGrid.cols,
    cellData: sharedGrid.cell_data
  }

  return (
    <main className="min-h-screen bg-white">
      <DynamicGrid 
        initialState={initialState}
      />
    </main>
  )
}
