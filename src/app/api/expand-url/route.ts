import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Follow redirects to get the expanded URL
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    return NextResponse.json({
      success: true,
      expandedUrl: response.url,
    });
  } catch (error) {
    console.error("Expand URL error:", error);
    return NextResponse.json(
      {
        error: "Failed to expand URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST with url parameter." },
    { status: 405 }
  );
}
