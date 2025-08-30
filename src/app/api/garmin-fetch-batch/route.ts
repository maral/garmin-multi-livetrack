import { NextResponse } from "next/server";
import {
  GarminTrackingData,
  GarminCoordinate,
  GarminCoursePoint,
  GarminProfile,
} from "@/lib/garmin-api";

interface BatchAthleteRequest {
  sessionId: string;
  token: string;
  begin?: string;
}

interface BatchAthleteResponse {
  sessionId: string;
  success: boolean;
  data?: GarminTrackingData;
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
      athletes.map(async (athlete: BatchAthleteRequest): Promise<BatchAthleteResponse> => {
        try {
          const data = await fetchSingleAthlete(athlete.sessionId, athlete.token, athlete.begin);
          return {
            sessionId: athlete.sessionId,
            success: true,
            data,
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
    const responses: BatchAthleteResponse[] = results.map((result) => {
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

async function fetchSingleAthlete(
  sessionId: string,
  token: string,
  begin?: string
): Promise<GarminTrackingData> {
  // Fetch session info
  const sessionResponse = await fetch(
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
        query getSession($sessionId: String!, $token: String!) {
          sessionById(sessionId: $sessionId, token: $token) {
            sessionId
            sessionToken
            userDisplayName
            sessionName
            activity {
              name
            }
            publisher {
              nickname
            }
          }
        }
      `,
        variables: { sessionId, token },
        operationName: "getSession",
      }),
    }
  );

  if (!sessionResponse.ok) {
    throw new Error(`Session fetch failed: ${sessionResponse.statusText}`);
  }

  const sessionData = await sessionResponse.json();
  if (sessionData.errors || !sessionData.data?.sessionById) {
    throw new Error("Session not found or invalid");
  }

  const session = sessionData.data.sessionById;

  // Fetch tracking data
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

  // Extract track points using the same structure as the working single API
  const trackPoints = trackingData.data?.trackPointsBySessionId?.trackPoints || [];

  // Fetch course data (planned route)
  const courseResponse = await fetch(
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
        query getCourseData($sessionId: String!, $token: String!, $disablePolling: Boolean) {
          courseBySessionId(sessionId: $sessionId, token: $token, disablePolling: $disablePolling) {
            courses {
              coursePoints {
                position {
                  lat
                  lon
                }
              }
            }
          }
        }
      `,
        variables: { sessionId, token, disablePolling: true },
        operationName: "getCourseData",
      }),
    }
  );

  let coursePoints: GarminCoursePoint[] = [];
  if (courseResponse.ok) {
    const courseData = await courseResponse.json();
    coursePoints =
      courseData?.data?.courseBySessionId?.courses?.[0]?.coursePoints || [];
  }

  // Convert to our coordinate format (matching the working single API)
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

  const profile: GarminProfile = {
    name: session.userDisplayName || session.publisher?.nickname || "Unknown",
    location: session.sessionName || "",
    sessionName: session.sessionName || "",
    activityType: trackPoints[0]?.fitnessPointData?.activityType,
  };

  return {
    sessionId,
    token,
    coordinates,
    coursePoints,
    profile,
    lastUpdate: new Date().toISOString(),
  };
}
