import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Play, Pause, Settings, Radio, Home } from "lucide-react";
import MultiTrackShareButton from "@/components/MultiTrackShareButton";
import type { AthleteData } from "@/lib/types";

interface MultiTrackHeaderProps {
  athletes: AthleteData[];
  isLive: boolean;
  toggleLiveTracking: () => void;
  onSettingsClick: () => void;
}

export default function MultiTrackHeader({
  athletes,
  isLive,
  toggleLiveTracking,
  onSettingsClick,
}: MultiTrackHeaderProps) {
  return (
    <div className="h-14 px-4 sm:px-6 py-2 flex items-center justify-between border-b">
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1">
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </Link>
        <h1 className="text-lg sm:text-xl font-bold truncate">
          <span className="hidden sm:inline">Multi-Track Map</span>
          <span className="sm:hidden flex flex-col leading-tight text-sm">
            <span>Multi</span>
            <span>Track</span>
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Live tracking status indicator - text hidden on mobile */}
        {athletes.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-gray-50">
            {isLive ? (
              <>
                <Radio className="h-4 w-4 text-red-500 animate-pulse" />
                <span className="hidden sm:inline text-sm font-medium text-red-600">
                  LIVE
                </span>
              </>
            ) : (
              <>
                <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                <span className="hidden sm:inline text-sm font-medium text-gray-600">
                  PAUSED
                </span>
              </>
            )}
          </div>
        )}

        {/* Live tracking control */}
        {athletes.length > 0 && (
          <Button
            onClick={toggleLiveTracking}
            disabled={athletes.length === 0}
            variant={isLive ? "destructive" : "default"}
            size="sm"
            className="gap-1"
          >
            {isLive ? (
              <>
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Play</span>
              </>
            )}
          </Button>
        )}

        {/* Share button */}
        {athletes.length > 0 && (
          <MultiTrackShareButton
            urls={athletes.map((a) => a.originalUrl)}
          />
        )}

        {/* URL Settings button */}
        <Button
          onClick={onSettingsClick}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">URL Settings</span>
        </Button>
      </div>
    </div>
  );
}
