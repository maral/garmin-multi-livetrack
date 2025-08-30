"use client";

import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";

interface GridCellInputProps {
  initialValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function GridCellInput({ initialValue, onConfirm, onCancel }: GridCellInputProps) {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleConfirm = () => {
    if (inputValue.trim()) {
      let url = inputValue.trim();
      // Add protocol if missing
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      onConfirm(url);
    }
  };

  const handleCancel = () => {
    setInputValue(initialValue);
    onCancel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="border border-gray-300 bg-white flex flex-col items-center justify-center h-full w-full p-4">
      <div className="w-full max-w-md space-y-3">
        <div className="text-sm text-gray-600 text-center">
          Enter a URL to display in this cell:
        </div>
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          className="w-full"
          autoFocus
        />
        <div className="flex gap-2 justify-center">
          <Button size="sm" onClick={handleConfirm} disabled={!inputValue.trim()}>
            <Check className="h-3 w-3 mr-1" />
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
