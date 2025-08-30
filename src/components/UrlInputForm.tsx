"use client";

import NextLink from "next/link";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Link, Loader2, X, Trash2, MapPin, Settings, Home } from "lucide-react";

interface UrlInputFormProps {
  urls: string;
  setUrls: (urls: string) => void;
  onProcessUrls: () => void;
  onCancel?: () => void;
  onClearAll?: () => void;
  isLoading: boolean;
  isEditing: boolean;
}

export default function UrlInputForm({
  urls,
  setUrls,
  onProcessUrls,
  onCancel,
  onClearAll,
  isLoading,
  isEditing,
}: UrlInputFormProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with navigation */}
      <div className="h-14 px-4 sm:px-6 py-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <NextLink href="/">
            <Button variant="ghost" size="sm" className="gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
          </NextLink>
          <h1 className="text-lg sm:text-xl font-bold truncate">
            <span className="hidden sm:inline">Multi-Track Map</span>
            <span className="sm:hidden flex flex-col leading-tight text-sm">
              <span>Multi</span>
              <span>Track</span>
            </span>
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto p-6 space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Settings className="h-6 w-6 text-blue-600" />
                ) : (
                  <Link className="h-6 w-6 text-blue-600" />
                )}
                <h1 className="text-3xl font-bold">
                  {isEditing
                    ? "URL Settings"
                    : "Multi-Athlete Garmin LiveTrack"}
                </h1>
              </div>
              <p className="text-gray-600">
                {isEditing
                  ? "Modify the URLs below. You can add, remove, or change URLs. Only changed data will be reloaded."
                  : "Enter Garmin LiveTrack URLs (one per line) to view multiple athletes on a single map. Both short URLs (gar.mn/xxx) and long URLs are supported."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Garmin LiveTrack URLs (one per line):
                </label>
                <Textarea
                  value={urls}
                  onChange={(e) => setUrls(e.target.value)}
                  placeholder={`https://livetrack.garmin.com/session/32e1e8e5-068e-84f5-b9d9-731378d76d00/token/3EECBC5F8BCCF2E19630D3B4F5CA9E
https://gar.mn/Q7XWnDPBGV
https://livetrack.garmin.com/session/...`}
                  rows={6}
                  className="w-full resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={onProcessUrls}
                  disabled={isLoading || !urls.trim()}
                  className="flex-1 h-11"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing URLs...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      {isEditing ? "Update Athletes" : "Show Athletes on Map"}
                    </>
                  )}
                </Button>

                {isEditing && onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    size="lg"
                    className="flex-1 h-11"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                )}

                {isEditing && onClearAll && (
                  <Button
                    onClick={onClearAll}
                    variant="destructive"
                    size="lg"
                    className="h-11"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
