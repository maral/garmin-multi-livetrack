"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import {
  Clock,
  Zap,
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
} from "lucide-react";
import type { AthleteStatsModalProps } from "@/lib/types";

// Helper functions for formatting
const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const formatSpeed = (mps: number): string => {
  const kmh = mps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
};

const formatElevation = (meters: number): string => {
  return `${Math.round(meters)} m`;
};

export default function AthleteStatsModal({
  athlete,
  stats,
  isOpen,
  onClose,
}: AthleteStatsModalProps) {
  if (!athlete) return null;

  return (
    <div className="relative z-[10000]">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: athlete.color }}
              />
              {athlete.profile.name} - Detailed Statistics
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {stats ? (
              <>
                {/* Basic Info */}
                {athlete.profile.location && (
                  <div className="text-sm text-gray-600">
                    {athlete.profile.location}
                  </div>
                )}

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        Total Distance
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                      {formatDistance(stats.totalDistance)}
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Total Time</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {formatTime(stats.totalTime)}
                    </div>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <Activity className="h-4 w-4" />
                      <span className="text-xs font-medium">Average Speed</span>
                    </div>
                    <div className="text-lg font-bold text-orange-700">
                      {formatSpeed(stats.avgSpeed)}
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-medium">Max Speed</span>
                    </div>
                    <div className="text-lg font-bold text-red-700">
                      {formatSpeed(stats.maxSpeed)}
                    </div>
                  </div>
                </div>

                {/* Elevation */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Elevation</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Gain:</span>
                      <span className="font-medium">
                        {formatElevation(stats.elevationGain)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-gray-600">Loss:</span>
                      <span className="font-medium">
                        {formatElevation(stats.elevationLoss)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Min:</span>
                      <span className="font-medium">
                        {formatElevation(stats.minAltitude)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Max:</span>
                      <span className="font-medium">
                        {formatElevation(stats.maxAltitude)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Heart Rate */}
                {stats.avgHeartRate > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">Heart Rate</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-gray-600">Average:</span>
                        <span className="font-medium">
                          {Math.round(stats.avgHeartRate)} bpm
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-600" />
                        <span className="text-gray-600">Maximum:</span>
                        <span className="font-medium">
                          {Math.round(stats.maxHeartRate)} bpm
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Activity Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{stats.activityType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-gray-600">Last Update:</span>
                      <span className="font-medium">
                        {new Date(athlete.lastUpdate).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No statistics available for this athlete
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
