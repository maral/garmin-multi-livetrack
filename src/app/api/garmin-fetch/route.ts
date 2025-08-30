import { NextRequest, NextResponse } from "next/server";
import {
  GarminTrackingData,
  GarminCoordinate,
  GarminProfile,
} from "@/lib/garmin-api";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, token, begin } = await request.json();

    if (!sessionId || !token) {
      return NextResponse.json(
        { error: "sessionId and token are required" },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: "Failed to fetch session data from Garmin" },
        { status: 502 }
      );
    }

    const sessionData = await sessionResponse.json();

    if (sessionData.errors) {
      return NextResponse.json(
        {
          error: "GraphQL errors in session query",
          details: sessionData.errors,
        },
        { status: 422 }
      );
    }

    // Fetch track points
    const trackPointsResponse = await fetch(
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
          variables: {
            sessionId,
            token,
            begin:
              begin || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Use provided begin or 24 hours ago
            disablePolling: true,
          },
          operationName: "getTrackPoints",
        }),
      }
    );

    if (!trackPointsResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch track points from Garmin" },
        { status: 502 }
      );
    }

    const trackPointsData = await trackPointsResponse.json();

    if (trackPointsData.errors) {
      return NextResponse.json(
        {
          error: "GraphQL errors in track points query",
          details: trackPointsData.errors,
        },
        { status: 422 }
      );
    }

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
          variables: {
            sessionId,
            token,
            disablePolling: true,
          },
          operationName: "getCourseData",
        }),
      }
    );

    let courseData = null;
    if (courseResponse.ok) {
      courseData = await courseResponse.json();
    }

    // Extract session info
    const session = sessionData.data?.sessionById;
    if (!session) {
      return NextResponse.json(
        { error: "No session data found" },
        { status: 404 }
      );
    }

    // Extract track points
    const trackPoints =
      trackPointsData.data?.trackPointsBySessionId?.trackPoints || [];

    // Build profile
    const profile: GarminProfile = {
      name:
        session.userDisplayName ||
        session.publisher?.nickname ||
        "Unknown Athlete",
      location: session.sessionName || "",
      sessionName: session.sessionName,
      activityType: trackPoints[0]?.fitnessPointData?.activityType,
    };

    // Convert track points to our coordinate format
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

    // Extract course points (planned route)
    const coursePoints =
      courseData?.data?.courseBySessionId?.courses?.[0]?.coursePoints || [];

    const trackingData: GarminTrackingData = {
      sessionId,
      token,
      coordinates,
      coursePoints,
      profile,
      lastUpdate: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: trackingData,
      metadata: {
        coordinateCount: coordinates.length,
        coursePointCount: coursePoints.length,
        latestPosition:
          coordinates.length > 0 ? coordinates[coordinates.length - 1] : null,
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Garmin fetch error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with sessionId and token." },
    { status: 405 }
  );
}
