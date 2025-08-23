"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Minus, Plus } from "lucide-react";

interface GridControlsProps {
  rows: number;
  cols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
}

export default function GridControls({ rows, cols, onRowsChange, onColsChange }: GridControlsProps) {
  const [rowInput, setRowInput] = useState(rows.toString());
  const [colInput, setColInput] = useState(cols.toString());

  // Update input values when props change
  useEffect(() => {
    setRowInput(rows.toString());
  }, [rows]);

  useEffect(() => {
    setColInput(cols.toString());
  }, [cols]);

  const handleRowInputChange = (value: string) => {
    setRowInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1) {
      onRowsChange(num);
    }
  };

  const handleColInputChange = (value: string) => {
    setColInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1) {
      onColsChange(num);
    }
  };

  const handleRowInputBlur = () => {
    setRowInput(rows.toString());
  };

  const handleColInputBlur = () => {
    setColInput(cols.toString());
  };

  return (
    <div className="flex items-center gap-6">
      {/* Rows control */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Rows:</span>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-11 p-0"
          onClick={() => {
            const newCount = Math.max(1, rows - 1);
            onRowsChange(newCount);
          }}
          disabled={rows <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          value={rowInput}
          onChange={(e) => handleRowInputChange(e.target.value)}
          onBlur={handleRowInputBlur}
          className="w-11 h-8 text-center text-sm"
          min="1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-11 p-0"
          onClick={() => onRowsChange(rows + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Columns control */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Cols:</span>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-11 p-0"
          onClick={() => {
            const newCount = Math.max(1, cols - 1);
            onColsChange(newCount);
          }}
          disabled={cols <= 1}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          value={colInput}
          onChange={(e) => handleColInputChange(e.target.value)}
          onBlur={handleColInputBlur}
          className="w-11 h-8 text-center text-sm"
          min="1"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-11 p-0"
          onClick={() => onColsChange(cols + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
