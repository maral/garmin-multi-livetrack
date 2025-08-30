"use client";

import { useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Minimize } from "lucide-react";
import GridCellControls from "./GridCellControls";

interface GridCellIframeProps {
  url: string;
  rowIndex: number;
  colIndex: number;
  isFullscreen: boolean;
  onEdit: () => void;
  onError: () => void;
  setIsFullscreen: (value: boolean) => void;
}

export default function GridCellIframe({
  url,
  rowIndex,
  colIndex,
  isFullscreen,
  onEdit,
  onError,
  setIsFullscreen,
}: GridCellIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);

  // Add fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [setIsFullscreen]);

  const handleFullscreenClick = async () => {
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

  const handleIframeError = () => {
    onError();
  };

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
            onClick={handleFullscreenClick}
            title="Exit Fullscreen (ESC)"
          >
            <Minimize className="h-6 w-6" />
          </Button>
        )}

        <GridCellControls
          onEdit={onEdit}
          onFullscreen={handleFullscreenClick}
          isFullscreen={isFullscreen}
        />
      </div>
    </div>
  );
}
