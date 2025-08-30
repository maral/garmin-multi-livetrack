"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Upload } from "lucide-react";

interface BulkUrlImportProps {
  onImportUrls: (urls: string[]) => void;
}

export default function BulkUrlImport({ onImportUrls }: BulkUrlImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [urlText, setUrlText] = useState("");

  const validateAndNormalizeUrl = (url: string): string | null => {
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Add protocol if missing
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      return `https://${trimmed}`;
    }

    return trimmed;
  };

  const handleImport = () => {
    const lines = urlText.split("\n");
    const validUrls: string[] = [];

    for (const line of lines) {
      const validatedUrl = validateAndNormalizeUrl(line);
      if (validatedUrl) {
        validUrls.push(validatedUrl);
      }
    }

    if (validUrls.length > 0) {
      onImportUrls(validUrls);
      setUrlText("");
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setUrlText("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center"
          title="Bulk Import URLs"
        >
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline sm:ml-2">Bulk Import</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import URLs</DialogTitle>
          <DialogDescription>
            Paste URLs below, one per line. The grid will be resized
            automatically to fit all URLs.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder={`Enter URLs, one per line:
google.com
youtube.com
github.com
...`}
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!urlText.trim()}>
            Import URLs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
