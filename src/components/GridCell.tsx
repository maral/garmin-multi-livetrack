"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Pencil, Check, X, ExternalLink, Maximize, Minimize } from "lucide-react";

interface GridCellProps {
  rowIndex: number;
  colIndex: number;
  url: string;
  isEditing: boolean;
  onUpdateData: (data: { url?: string; isEditing?: boolean }) => void;
}

export default function GridCell({
  rowIndex,
  colIndex,
  url,
  isEditing,
  onUpdateData,
}: GridCellProps) {
  const [inputValue, setInputValue] = useState(url);
  const [hasFrameError, setHasFrameError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      let url = inputValue.trim();
      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      setHasFrameError(false); // Reset error state when setting new URL
      onUpdateData({ url, isEditing: false });
    }
  };

  const handleCancel = () => {
    setInputValue(url);
    if (url) {
      onUpdateData({ isEditing: false });
    }
  };

  const handleEdit = () => {
    setInputValue(url);
    setHasFrameError(false); // Reset error state when editing
    onUpdateData({ isEditing: true });
  };

  const handleFullscreen = async () => {
    if (!fullscreenContainerRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        await fullscreenContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  // Listen for fullscreen changes (e.g., user pressing ESC)
  const handleFullscreenChange = () => {
    setIsFullscreen(!!document.fullscreenElement);
  };

  // Add fullscreen change listener
  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleIframeError = () => {
    setHasFrameError(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="border border-gray-300 bg-gray-50 flex flex-col items-center justify-center h-full w-full p-4 gap-3">
        <div className="w-full max-w-sm space-y-2">
          <div className="flex gap-2 justify-center">
            <Input
              placeholder="Enter URL (e.g., https://gar.mn/ABCDefgh...)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={!inputValue.trim()}
            >
              <Check className="h-3 w-3" />
            </Button>
            {url && (
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (url) {
    if (hasFrameError) {
      return (
        <div className="border border-gray-300 bg-gray-50 h-full w-full relative flex flex-col items-center justify-center p-4 text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-sm text-gray-600 mb-3">
            This website cannot be displayed in a frame due to security
            restrictions.
          </div>
          <div className="flex gap-2 items-center mb-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(url, "_blank")}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Open in new tab
            </Button>
          </div>
          <div className="text-xs text-gray-400 break-all">{url}</div>
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handleEdit}
              title="Edit URL"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              <Maximize className="h-3 w-3" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-gray-300 h-full w-full relative">
        <div
          ref={fullscreenContainerRef}
          className="w-full h-full relative bg-black"
        >
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0 bg-black"
            title={`Content for cell (${rowIndex + 1}, ${colIndex + 1})`}
            onError={handleIframeError}
            onLoad={(e) => {
              // Check if iframe loaded successfully
              try {
                const iframe = e.target as HTMLIFrameElement;
                // If we can't access contentDocument, it might be blocked
                if (iframe.contentDocument === null) {
                  // This is a cross-origin frame, which is normal
                  // The real errors will be caught by the browser's security policies
                }
              } catch {
                handleIframeError();
              }
            }}
          />
          {/* Large exit fullscreen button - only visible when in fullscreen */}
          {isFullscreen && (
            <Button
              size="lg"
              variant="outline"
              className="absolute top-4 right-4 h-12 w-12 p-0 bg-black/80 hover:bg-black/90 border-white/30 text-white hover:text-white z-50 backdrop-blur-sm"
              onClick={handleFullscreen}
              title="Exit Fullscreen (ESC)"
            >
              <Minimize className="h-6 w-6" />
            </Button>
          )}
          
          {/* Regular control buttons - hidden when fullscreen */}
          <div className={`absolute top-2 right-2 flex gap-1 ${isFullscreen ? 'hidden' : ''}`}>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handleEdit}
              title="Edit URL"
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={handleFullscreen}
              title="Fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="h-3 w-3" />
              ) : (
                <Maximize className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback state (shouldn't happen with proper state management)
  return (
    <div className="border border-gray-300 bg-gray-50 flex items-center justify-center h-full w-full">
      <span className="text-gray-500 text-sm">
        Cell ({rowIndex + 1}, {colIndex + 1})
      </span>
    </div>
  );
}
