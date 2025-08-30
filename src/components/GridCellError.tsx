"use client";

import { Button } from "./ui/button";
import { ExternalLink } from "lucide-react";
import GridCellControls from "./GridCellControls";

interface GridCellErrorProps {
  url: string;
  onEdit: () => void;
  onFullscreen: () => void;
}

export default function GridCellError({ url, onEdit, onFullscreen }: GridCellErrorProps) {
  return (
    <div className="border border-gray-300 bg-red-50 flex flex-col items-center justify-center h-full w-full p-4 relative">
      <div className="text-center space-y-4">
        <div className="text-red-600 text-sm font-medium">
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
      </div>
      <GridCellControls 
        onEdit={onEdit}
        onFullscreen={onFullscreen}
        showMinimize={false}
      />
    </div>
  );
}
