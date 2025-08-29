"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Minus, Plus } from "lucide-react";

interface RowControlProps {
  rows: number;
  onRowsChange: (rows: number) => void;
}

export default function RowControl({ rows, onRowsChange }: RowControlProps) {
  const [rowInput, setRowInput] = useState(rows.toString());

  // Update input values when props change
  useEffect(() => {
    setRowInput(rows.toString());
  }, [rows]);

  const handleRowInputChange = (value: string) => {
    setRowInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1) {
      onRowsChange(num);
    }
  };

  const handleRowInputBlur = () => {
    setRowInput(rows.toString());
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium min-w-[40px]">Rows:</span>
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
  );
}
