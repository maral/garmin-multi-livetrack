import { NextResponse } from "next/server";
import { GarminCoordinate } from "@/lib/garmin-api";

interface BatchUpdateRequest {
  sessionId: string;
  token: string;
  begin: string; // Required for updates - we always need a timestamp
}

interface BatchUpdateResponse {
  sessionId: string;
  success: boolean;
  coordinates?: GarminCoordinate[];
  error?: string;
}

export async function POST(request: Request) {
  try {
    const { athletes } = await request.json();

    if (!Array.isArray(athletes) || athletes.length === 0) {
      return NextResponse.json(
        { error: "No athletes provided" },
        { status: 400 }
      );
    }

    // Process all athletes in parallel
    const results = await Promise.allSettled(
      athletes.map(async (athlete: BatchUpdateRequest): Promise<BatchUpdateResponse> => {
        try {
          const coordinates = await fetchAthleteUpdates(athlete.sessionId, athlete.token, athlete.begin);
          return {
            sessionId: athlete.sessionId,
            success: true,
            coordinates,
          };
        } catch (error) {
          return {
            sessionId: athlete.sessionId,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Convert results to response format
    const responses: BatchUpdateResponse[] = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          sessionId: "unknown",
          success: false,
          error: result.reason?.message || "Request failed",
        };
      }
    });

    return NextResponse.json({
      success: true,
      results: responses,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process batch request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function fetchAthleteUpdates(
  sessionId: string,
  token: string,
  begin: string
): Promise<GarminCoordinate[]> {
  // Fetch tracking data (only new points since 'begin' timestamp)
  const trackingResponse = await fetch(
    "https://livetrack.garmin.com/apollo/graphql",
    {
      method: "POST",
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        origin: "https://livetrack.garmin.com",
        referer: `https://livetrack.garmin.com/session/${sessionId}/token/${token}`,
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      body: JSON.stringify({
        query: `
        query getTrackPoints(
          $sessionId: String!
          $token: String!
          $begin: String
          $disablePolling: Boolean
        ) {
          trackPointsBySessionId(
            sessionId: $sessionId
            token: $token
            begin: $begin
            limit: 3000
            disablePolling: $disablePolling
          ) {
            trackPoints {
              fitnessPointData {
                totalDistanceMeters
                activityType
                heartRateBeatsPerMin
                powerWatts
                cadenceCyclesPerMin
              }
              position {
                lat
                lon
              }
              dateTime
              speed
              altitude
            }
            sessionId
          }
        }
      `,
        variables: { sessionId, token, begin, disablePolling: true },
        operationName: "getTrackPoints",
      }),
    }
  );

  if (!trackingResponse.ok) {
    throw new Error(`Tracking fetch failed: ${trackingResponse.statusText}`);
  }

  const trackingData = await trackingResponse.json();
  if (trackingData.errors) {
    throw new Error("Tracking data not available");
  }

  // Extract track points
  const trackPoints = trackingData.data?.trackPointsBySessionId?.trackPoints || [];

  // Convert to our coordinate format (only coordinates, no profile/course data)
  const coordinates: GarminCoordinate[] = trackPoints.map(
    (point: {
      position: { lat: number; lon: number };
      dateTime: string;
      altitude?: number;
      speed?: number;
      fitnessPointData?: {
        heartRateBeatsPerMin?: number;
        powerWatts?: number;
        cadenceCyclesPerMin?: number;
        totalDistanceMeters?: number;
        activityType?: string;
      };
    }) => ({
      position: {
        lat: point.position.lat,
        lon: point.position.lon,
      },
      timestamp: point.dateTime,
      altitude: point.altitude,
      speed: point.speed,
      fitnessData: point.fitnessPointData
        ? {
            heartRateBeatsPerMin: point.fitnessPointData.heartRateBeatsPerMin,
            powerWatts: point.fitnessPointData.powerWatts,
            cadenceCyclesPerMin: point.fitnessPointData.cadenceCyclesPerMin,
            totalDistanceMeters: point.fitnessPointData.totalDistanceMeters,
            activityType: point.fitnessPointData.activityType,
          }
        : undefined,
    })
  );

  return coordinates;
}
