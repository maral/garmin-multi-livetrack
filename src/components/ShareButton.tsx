"use client";

import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Share2, Copy, Check } from "lucide-react";
import { useShareDialog } from "@/lib/hooks";

interface ShareButtonProps {
  rows: number;
  cols: number;
  cellData: Record<string, { url: string; isEditing: boolean }>;
}

export default function ShareButton({ rows, cols, cellData }: ShareButtonProps) {
  const {
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
  } = useShareDialog({ rows, cols, cellData });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => open ? openDialog() : closeDialog()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Share Grid">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-2">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Grid Layout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isCheckingExisting && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              Checking for existing share...
            </div>
          )}
          
          {!isCheckingExisting && !shareUrl && !error && (
            <div className="text-sm text-gray-600">
              Create a shareable link for your current grid layout and URLs. Recipients can view and edit the grid.
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600">
              {error}
            </div>
          )}
          
          {shareUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {hasExistingShare ? "Existing Share URL:" : "Share URL:"}
              </label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="px-3"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="text-xs text-gray-500">
                {hasExistingShare 
                  ? "This grid layout has been shared before. Use this existing link."
                  : "Anyone with this link can view and edit your grid layout."
                }
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            {!isCheckingExisting && !shareUrl && (
              <Button onClick={createNewShare} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Share Link"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
