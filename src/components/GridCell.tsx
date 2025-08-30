"use client";

import { useState } from "react";
import GridCellInput from "./GridCellInput";
import GridCellError from "./GridCellError";
import GridCellIframe from "./GridCellIframe";

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
  const [hasFrameError, setHasFrameError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleConfirm = (newUrl: string) => {
    setHasFrameError(false);
    onUpdateData({ url: newUrl, isEditing: false });
  };

  const handleCancel = () => {
    if (url) {
      onUpdateData({ isEditing: false });
    }
  };

  const handleEdit = () => {
    setHasFrameError(false);
    onUpdateData({ isEditing: true });
  };

  const handleError = () => {
    setHasFrameError(true);
  };

  // Editing state
  if (isEditing) {
    return (
      <GridCellInput
        initialValue={url}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  // URL set but has frame error
  if (url && hasFrameError) {
    return (
      <GridCellError
        url={url}
        onEdit={handleEdit}
        onFullscreen={() => {}}
      />
    );
  }

  // URL set and no error
  if (url) {
    return (
      <GridCellIframe
        url={url}
        rowIndex={rowIndex}
        colIndex={colIndex}
        isFullscreen={isFullscreen}
        onEdit={handleEdit}
        onError={handleError}
        setIsFullscreen={setIsFullscreen}
      />
    );
  }

  // No URL set - show empty state
  return (
    <div className="border border-gray-300 bg-gray-50 flex items-center justify-center h-full w-full">
      <span className="text-gray-500 text-sm">
        Cell ({rowIndex + 1}, {colIndex + 1})
      </span>
    </div>
  );
}
