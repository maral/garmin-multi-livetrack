import { createServerShareService } from './services'
import type { SharedGridState } from './supabase'

export async function getSharedGridData(shareId: string): Promise<SharedGridState | null> {
  try {
    const shareService = createServerShareService()
    return await shareService.getSharedGrid(shareId)
  } catch (error) {
    console.error('Error in getSharedGridData:', error)
    return null
  }
}
