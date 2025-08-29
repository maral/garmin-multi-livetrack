"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Minus, Plus } from "lucide-react";

interface ColControlProps {
  cols: number;
  onColsChange: (cols: number) => void;
}

export default function ColControl({ cols, onColsChange }: ColControlProps) {
  const [colInput, setColInput] = useState(cols.toString());

  // Update input values when props change
  useEffect(() => {
    setColInput(cols.toString());
  }, [cols]);

  const handleColInputChange = (value: string) => {
    setColInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1) {
      onColsChange(num);
    }
  };

  const handleColInputBlur = () => {
    setColInput(cols.toString());
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium min-w-[40px]">Cols:</span>
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
  );
}
