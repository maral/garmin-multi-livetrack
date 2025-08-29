"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Settings } from "lucide-react";
import ShareButton from "./ShareButton";
import BulkUrlImport from "./BulkUrlImport";
import RowControl from "./RowControl";
import ColControl from "./ColControl";

interface MobileControlsModalProps {
  rows: number;
  cols: number;
  cellData: Record<string, { url: string; isEditing: boolean }>;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
  onBulkImport: (urls: string[]) => void;
}

export default function MobileControlsModal({ 
  rows, 
  cols, 
  cellData, 
  onRowsChange, 
  onColsChange, 
  onBulkImport,
}: MobileControlsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" title="Grid Controls">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg w-[95vw] max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Grid Controls</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Grid Size Controls */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Grid Size</h4>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <RowControl rows={rows} onRowsChange={onRowsChange} />
              <ColControl cols={cols} onColsChange={onColsChange} />
            </div>
          </div>

          {/* Import Controls */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Import URLs</h4>
            <div className="[&_span]:!inline [&_span]:!ml-2">
              <BulkUrlImport onImportUrls={onBulkImport} />
            </div>
          </div>

          {/* Share Controls */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Share Grid</h4>
            <div className="[&_span]:!inline [&_span]:!ml-2">
              <ShareButton rows={rows} cols={cols} cellData={cellData} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
