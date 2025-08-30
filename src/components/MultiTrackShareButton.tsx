"use client";

import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { createShareService } from "@/lib/services/shareService";
import type { MultiTrackState } from "@/lib/services/shareService";

interface MultiTrackShareButtonProps {
  urls: string[];
}

export default function MultiTrackShareButton({
  urls,
}: MultiTrackShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string>("");

  const openDialog = async () => {
    if (urls.length === 0) return;

    setIsOpen(true);
    setError("");
    setShareUrl("");
    setIsCheckingExisting(true);

    try {
      const shareService = createShareService();
      const multiTrackState: MultiTrackState = { urls };

      // Check if an existing share exists
      const result =
        await shareService.findOrCreateMultiTrackShare(multiTrackState);

      if (result.success && result.shareUrl) {
        setShareUrl(result.shareUrl);
      } else {
        setError(result.error || "Failed to create share");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check for existing share"
      );
    } finally {
      setIsCheckingExisting(false);
    }
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsCopied(false);
  };

  const createNewShare = async () => {
    if (urls.length === 0) return;

    setIsLoading(true);
    setError("");

    try {
      const shareService = createShareService();
      const multiTrackState: MultiTrackState = { urls };

      const result =
        await shareService.findOrCreateMultiTrackShare(multiTrackState);

      if (result.success && result.shareUrl) {
        setShareUrl(result.shareUrl);
      } else {
        setError(result.error || "Failed to create share");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create share");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const isDisabled = urls.length === 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => (open ? openDialog() : closeDialog())}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          title="Share Multi-Track URLs"
          disabled={isDisabled}
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-2">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Multi-Track URLs</DialogTitle>
          <DialogDescription>
            Create a shareable link for your multi-athlete tracking session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isCheckingExisting && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              Checking for existing share...
            </div>
          )}

          {!isCheckingExisting && !shareUrl && !error && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Share your multi-track configuration with others. This will
                create a link that contains all {urls.length} URL
                {urls.length !== 1 ? "s" : ""}.
              </p>
              <Button
                onClick={createNewShare}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Share...
                  </>
                ) : (
                  "Create Share Link"
                )}
              </Button>
            </div>
          )}

          {shareUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Share URL:</label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="sm"
                    className="px-3"
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Anyone with this link can view your multi-track configuration
                with all {urls.length} URL{urls.length !== 1 ? "s" : ""}.
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              Error: {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
