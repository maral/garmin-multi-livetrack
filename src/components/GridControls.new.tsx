"use client";

import RowControl from "./RowControl";
import ColControl from "./ColControl";

interface GridControlsProps {
  rows: number;
  cols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
}

export default function GridControls({ rows, cols, onRowsChange, onColsChange }: GridControlsProps) {
  return (
    <div className="flex items-center gap-6">
      <RowControl rows={rows} onRowsChange={onRowsChange} />
      <ColControl cols={cols} onColsChange={onColsChange} />
    </div>
  );
}
