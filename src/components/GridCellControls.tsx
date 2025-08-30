"use client";

import { Button } from "./ui/button";
import { Pencil, Maximize, Minimize } from "lucide-react";

interface GridCellControlsProps {
  onEdit: () => void;
  onFullscreen: () => void;
  showMinimize?: boolean;
  isFullscreen?: boolean;
}

export default function GridCellControls({
  onEdit,
  onFullscreen,
  showMinimize = false,
  isFullscreen = false,
}: GridCellControlsProps) {
  return (
    <div
      className={`absolute top-2 right-2 flex gap-1 ${
        isFullscreen ? "hidden" : ""
      }`}
    >
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={onEdit}
        title="Edit URL"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-8 w-8 p-0"
        onClick={onFullscreen}
        title="Fullscreen"
      >
        {showMinimize ? (
          <Minimize className="h-3 w-3" />
        ) : (
          <Maximize className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
