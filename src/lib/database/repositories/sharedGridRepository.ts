import { supabase } from '../../supabase'
import { supabaseServer } from '../../supabaseServer'
import type { SharedGridState } from '../../supabase'

export class SharedGridRepository {
  constructor(private client = supabase) {}

  /**
   * Find an existing share by state hash
   */
  async findByStateHash(stateHash: string): Promise<SharedGridState | null> {
    const { data, error } = await this.client
      .from('shared_grids')
      .select('*')
      .eq('state_hash', stateHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to find share by state hash: ${error.message}`)
    }

    return data
  }

  /**
   * Find a share by share ID
   */
  async findByShareId(shareId: string): Promise<SharedGridState | null> {
    const { data, error } = await this.client
      .from('shared_grids')
      .select('*')
      .eq('share_id', shareId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      throw new Error(`Failed to find share by ID: ${error.message}`)
    }

    return data
  }

  /**
   * Check if a share ID already exists
   */
  async shareIdExists(shareId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('shared_grids')
      .select('share_id')
      .eq('share_id', shareId)
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to check share ID existence: ${error.message}`)
    }

    return !!data
  }

  /**
   * Create a new share
   */
  async create(shareData: Omit<SharedGridState, 'id' | 'created_at'>): Promise<SharedGridState> {
    const { data, error } = await this.client
      .from('shared_grids')
      .insert([shareData])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create share: ${error.message}`)
    }

    return data
  }

  /**
   * Get total count of shares (for analytics)
   */
  async getTotalCount(): Promise<number> {
    const { count, error } = await this.client
      .from('shared_grids')
      .select('*', { count: 'exact', head: true })

    if (error) {
      throw new Error(`Failed to get share count: ${error.message}`)
    }

    return count || 0
  }
}

// Factory functions for different environments
export const createSharedGridRepository = () => new SharedGridRepository(supabase)
export const createServerSharedGridRepository = () => new SharedGridRepository(supabaseServer)
