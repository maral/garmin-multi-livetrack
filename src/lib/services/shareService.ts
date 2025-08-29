import { createSharedGridRepository, createServerSharedGridRepository } from '../database'
import { generateShareId, generateStateHash } from '../shareUtils'
import type { SharedGridState } from '../supabase'

export interface ShareResult {
  success: boolean
  shareUrl?: string
  shareId?: string
  isExisting?: boolean
  error?: string
}

export interface GridState {
  rows: number
  cols: number
  cellData: Record<string, { url: string; isEditing: boolean }>
}

export class ShareService {
  constructor(
    private repository = createSharedGridRepository(),
    private baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  ) {}

  /**
   * Find or create a share for the given grid state
   */
  async findOrCreateShare(gridState: GridState): Promise<ShareResult> {
    try {
      const stateHash = generateStateHash(gridState.rows, gridState.cols, gridState.cellData)

      // First, check if a share already exists for this state
      const existingShare = await this.repository.findByStateHash(stateHash)
      
      if (existingShare) {
        return {
          success: true,
          shareUrl: `${this.baseUrl}/share/${existingShare.share_id}`,
          shareId: existingShare.share_id,
          isExisting: true
        }
      }

      // No existing share found, create a new one
      const shareId = await this.generateUniqueShareId()
      
      const newShare: Omit<SharedGridState, 'id' | 'created_at'> = {
        share_id: shareId,
        rows: gridState.rows,
        cols: gridState.cols,
        cell_data: gridState.cellData,
        state_hash: stateHash
      }

      await this.repository.create(newShare)

      return {
        success: true,
        shareUrl: `${this.baseUrl}/share/${shareId}`,
        shareId,
        isExisting: false
      }
    } catch (error) {
      console.error('Error in findOrCreateShare:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create share'
      }
    }
  }

  /**
   * Get a shared grid by share ID
   */
  async getSharedGrid(shareId: string): Promise<SharedGridState | null> {
    try {
      return await this.repository.findByShareId(shareId)
    } catch (error) {
      console.error('Error getting shared grid:', error)
      return null
    }
  }

  /**
   * Check if the current grid state has an existing share
   */
  async hasExistingShare(gridState: GridState): Promise<ShareResult | null> {
    try {
      const stateHash = generateStateHash(gridState.rows, gridState.cols, gridState.cellData)
      const existingShare = await this.repository.findByStateHash(stateHash)
      
      if (existingShare) {
        return {
          success: true,
          shareUrl: `${this.baseUrl}/share/${existingShare.share_id}`,
          shareId: existingShare.share_id,
          isExisting: true
        }
      }
      
      return null
    } catch (error) {
      console.error('Error checking for existing share:', error)
      return null
    }
  }

  /**
   * Generate a unique share ID that doesn't exist in the database
   */
  private async generateUniqueShareId(): Promise<string> {
    let shareId = generateShareId()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const exists = await this.repository.shareIdExists(shareId)
      if (!exists) {
        return shareId
      }
      shareId = generateShareId()
      attempts++
    }

    throw new Error('Failed to generate unique share ID after maximum attempts')
  }
}

// Factory functions
export const createShareService = () => new ShareService()
export const createServerShareService = (baseUrl?: string) => 
  new ShareService(createServerSharedGridRepository(), baseUrl)
