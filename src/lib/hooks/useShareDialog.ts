import { useState, useEffect, useRef } from 'react'
import { createShareService, type GridState } from '../services'

export interface UseShareDialogOptions {
  rows: number
  cols: number
  cellData: Record<string, { url: string; isEditing: boolean }>
}

export interface UseShareDialogReturn {
  isOpen: boolean
  shareUrl: string
  isLoading: boolean
  isCheckingExisting: boolean
  isCopied: boolean
  error: string
  hasExistingShare: boolean
  openDialog: () => void
  closeDialog: () => void
  createNewShare: () => Promise<void>
  copyToClipboard: () => Promise<void>
}

export function useShareDialog({ rows, cols, cellData }: UseShareDialogOptions): UseShareDialogReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingExisting, setIsCheckingExisting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState("")
  const [hasExistingShare, setHasExistingShare] = useState(false)
  
  const lastCheckedStateRef = useRef<string>("")
  const shareService = useRef(createShareService())

  // Check for existing share when dialog opens
  useEffect(() => {
    if (isOpen && !hasExistingShare && !shareUrl) {
      const gridState: GridState = { rows, cols, cellData }
      const currentStateHash = JSON.stringify({ rows, cols, cellData }) // Simple hash for comparison
      
      // Only check if we haven't checked this exact state before
      if (lastCheckedStateRef.current !== currentStateHash) {
        lastCheckedStateRef.current = currentStateHash
        
        const checkExisting = async () => {
          setIsCheckingExisting(true)
          setError("")

          try {
            const result = await shareService.current.hasExistingShare(gridState)
            
            if (result && result.success) {
              setShareUrl(result.shareUrl!)
              setHasExistingShare(true)
            }
          } catch (err) {
            console.error('Error checking for existing share:', err)
          } finally {
            setIsCheckingExisting(false)
          }
        }

        checkExisting()
      }
    }
  }, [isOpen, hasExistingShare, shareUrl, rows, cols, cellData])

  const openDialog = () => setIsOpen(true)

  const closeDialog = () => {
    setIsOpen(false)
    // Reset state when dialog closes
    setShareUrl("")
    setError("")
    setIsCopied(false)
    setHasExistingShare(false)
    lastCheckedStateRef.current = "" // Reset the ref so we can check again next time
  }

  const createNewShare = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const gridState: GridState = { rows, cols, cellData }
      const result = await shareService.current.findOrCreateShare(gridState)
      
      if (result.success) {
        setShareUrl(result.shareUrl!)
        setHasExistingShare(result.isExisting || false)
      } else {
        setError(result.error || 'Failed to create share link. Please try again.')
      }
    } catch (err) {
      console.error('Error creating share link:', err)
      setError('Failed to create share link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  return {
    isOpen,
    shareUrl,
    isLoading,
    isCheckingExisting,
    isCopied,
    error,
    hasExistingShare,
    openDialog,
    closeDialog,
    createNewShare,
    copyToClipboard
  }
}
