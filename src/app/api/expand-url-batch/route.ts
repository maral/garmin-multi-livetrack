import { NextRequest, NextResponse } from "next/server";

interface ExpandUrlResult {
  originalUrl: string;
  success: boolean;
  expandedUrl?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls array is required" },
        { status: 400 }
      );
    }

    // Process all URLs in parallel
    const results = await Promise.allSettled(
      urls.map(async (url: string): Promise<ExpandUrlResult> => {
        try {
          // Follow redirects to get the expanded URL
          const response = await fetch(url, {
            method: "HEAD",
            redirect: "follow",
          });

          return {
            originalUrl: url,
            success: true,
            expandedUrl: response.url,
          };
        } catch (error) {
          return {
            originalUrl: url,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    // Convert results to response format
    const responses: ExpandUrlResult[] = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          originalUrl: urls[index] || "unknown",
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
