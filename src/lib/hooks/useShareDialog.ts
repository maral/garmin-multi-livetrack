import { useState } from "react";
import type { GridState } from "../services";

export interface UseShareDialogOptions {
  rows: number;
  cols: number;
  cellData: Record<string, { url: string; isEditing: boolean }>;
}

export interface UseShareDialogReturn {
  isOpen: boolean;
  isLoading: boolean;
  isCheckingExisting: boolean;
  isCopied: boolean;
  hasExistingShare: boolean;
  shareUrl: string;
  error: string;
  openDialog: () => void;
  closeDialog: () => void;
  createNewShare: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
}

export function useShareDialog(options: UseShareDialogOptions): UseShareDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasExistingShare, setHasExistingShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [error, setError] = useState("");

  const resetState = () => {
    setHasExistingShare(false);
    setShareUrl("");
    setError("");
    setIsCopied(false);
  };

  const openDialog = async () => {
    resetState();
    setIsOpen(true);
    setIsCheckingExisting(true);

    try {
      const gridState: GridState = {
        rows: options.rows,
        cols: options.cols,
        cellData: options.cellData,
      };

      const response = await fetch("/api/share/grid/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gridState }),
      });

      if (!response.ok) {
        throw new Error("Failed to check existing share");
      }

      const { hasExisting } = await response.json();
      setHasExistingShare(hasExisting);
    } catch (err) {
      console.error("Error checking existing share:", err);
      setError(
        err instanceof Error ? err.message : "Failed to check existing share"
      );
    } finally {
      setIsCheckingExisting(false);
    }
  };

  const closeDialog = () => {
    setIsOpen(false);
    resetState();
  };

  const createNewShare = async () => {
    setIsLoading(true);
    setError("");

    try {
      const gridState: GridState = {
        rows: options.rows,
        cols: options.cols,
        cellData: options.cellData,
      };

      const response = await fetch("/api/share/grid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gridState }),
      });

      if (!response.ok) {
        throw new Error("Failed to create share");
      }

      const result = await response.json();

      if (result.success && result.shareUrl) {
        setShareUrl(result.shareUrl);
      } else {
        throw new Error(result.error || "Failed to create share");
      }
    } catch (err) {
      console.error("Error creating share:", err);
      setError(err instanceof Error ? err.message : "Failed to create share");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      setError("Failed to copy to clipboard");
    }
  };

  return {
    isOpen,
    isLoading,
    isCheckingExisting,
    isCopied,
    hasExistingShare,
    shareUrl,
    error,
    openDialog,
    closeDialog,
    createNewShare,
    copyToClipboard,
  };
}
