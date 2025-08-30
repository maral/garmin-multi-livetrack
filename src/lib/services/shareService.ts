import {
  createServerSharedGridRepository,
} from "../database";
import { generateShareId, generateStateHash } from "../shareUtils";
import type { SharedGridState } from "../supabaseServer";

export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  shareId?: string;
  isExisting?: boolean;
  error?: string;
}

export interface GridState {
  rows: number;
  cols: number;
  cellData: Record<string, { url: string; isEditing: boolean }>;
}

export interface MultiTrackState {
  urls: string[];
}

export type ShareableState = GridState | MultiTrackState;

export class ShareService {
  constructor(
    private repository = createServerSharedGridRepository(),
    private baseUrl = ""
  ) {}

  /**
   * Find or create a share for the given grid state
   */
  async findOrCreateShare(gridState: GridState): Promise<ShareResult> {
    try {
      const stateHash = generateStateHash(
        gridState.rows,
        gridState.cols,
        gridState.cellData
      );

      // First, check if a share already exists for this state
      const existingShare = await this.repository.findByStateHash(stateHash);

      if (existingShare) {
        return {
          success: true,
          shareUrl: `${this.baseUrl}/share/${existingShare.share_id}`,
          shareId: existingShare.share_id,
          isExisting: true,
        };
      }

      // No existing share found, create a new one
      const shareId = await this.generateUniqueShareId();

      const newShare: Omit<SharedGridState, "id" | "created_at"> = {
        share_id: shareId,
        rows: gridState.rows,
        cols: gridState.cols,
        cell_data: gridState.cellData,
        state_hash: stateHash,
        type: "grid",
      };

      await this.repository.create(newShare);

      return {
        success: true,
        shareUrl: `${this.baseUrl}/share/${shareId}`,
        shareId,
        isExisting: false,
      };
    } catch (error) {
      console.error("Error in findOrCreateShare:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create share",
      };
    }
  }

  /**
   * Get a shared grid by share ID
   */
  async getSharedGrid(shareId: string): Promise<SharedGridState | null> {
    try {
      return await this.repository.findByShareId(shareId);
    } catch (error) {
      console.error("Error getting shared grid:", error);
      return null;
    }
  }

  /**
   * Check if the current grid state has an existing share
   */
  async hasExistingShare(gridState: GridState): Promise<ShareResult | null> {
    try {
      const stateHash = generateStateHash(
        gridState.rows,
        gridState.cols,
        gridState.cellData
      );
      const existingShare = await this.repository.findByStateHash(stateHash);

      if (existingShare) {
        return {
          success: true,
          shareUrl: `${this.baseUrl}/share/${existingShare.share_id}`,
          shareId: existingShare.share_id,
          isExisting: true,
        };
      }

      return null;
    } catch (error) {
      console.error("Error checking for existing share:", error);
      return null;
    }
  }

  /**
   * Find or create a share for the given multi-track URLs
   */
  async findOrCreateMultiTrackShare(
    multiTrackState: MultiTrackState
  ): Promise<ShareResult> {
    try {
      // Generate a state hash for the URLs (treating it as cell data for compatibility)
      const cellData: Record<string, { url: string; isEditing: boolean }> = {};
      multiTrackState.urls.forEach((url, index) => {
        cellData[`${index}-0`] = { url, isEditing: false };
      });

      const stateHash = generateStateHash(
        multiTrackState.urls.length,
        1,
        cellData
      );

      // First, check if a share already exists for this state with type 'multi-track'
      const existingShare = await this.repository.findByStateHashAndType(
        stateHash,
        "multi-track"
      );

      if (existingShare) {
        return {
          success: true,
          shareUrl: `${this.baseUrl}/multi-track/share/${existingShare.share_id}`,
          shareId: existingShare.share_id,
          isExisting: true,
        };
      }

      // No existing share found, create a new one
      const shareId = await this.generateUniqueShareId();

      const newShare: Omit<SharedGridState, "id" | "created_at"> = {
        share_id: shareId,
        rows: multiTrackState.urls.length,
        cols: 1,
        cell_data: cellData,
        state_hash: stateHash,
        type: "multi-track",
      };

      await this.repository.create(newShare);

      return {
        success: true,
        shareUrl: `${this.baseUrl}/multi-track/share/${shareId}`,
        shareId,
        isExisting: false,
      };
    } catch (error) {
      console.error("Error in findOrCreateMultiTrackShare:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create share",
      };
    }
  }

  /**
   * Get a shared multi-track by share ID
   */
  async getSharedMultiTrack(
    shareId: string
  ): Promise<{ urls: string[] } | null> {
    try {
      const share = await this.repository.findByShareIdAndType(
        shareId,
        "multi-track"
      );
      if (!share) return null;

      // Extract URLs from cell_data
      const urls: string[] = [];
      Object.keys(share.cell_data)
        .sort((a, b) => {
          const aIndex = parseInt(a.split("-")[0]);
          const bIndex = parseInt(b.split("-")[0]);
          return aIndex - bIndex;
        })
        .forEach((key) => {
          const data = share.cell_data[key];
          if (data.url) {
            urls.push(data.url);
          }
        });

      return { urls };
    } catch (error) {
      console.error("Error getting shared multi-track:", error);
      return null;
    }
  }

  /**
   * Generate a unique share ID that doesn't exist in the database
   */
  private async generateUniqueShareId(): Promise<string> {
    let shareId = generateShareId();
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const exists = await this.repository.shareIdExists(shareId);
      if (!exists) {
        return shareId;
      }
      shareId = generateShareId();
      attempts++;
    }

    throw new Error(
      "Failed to generate unique share ID after maximum attempts"
    );
  }
}

// Factory functions
export const createServerShareService = (baseUrl?: string) =>
  new ShareService(createServerSharedGridRepository(), baseUrl);
