import { NextRequest, NextResponse } from "next/server";
import { createServerShareService } from "@/lib/services/shareService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json(
        { error: "URLs array is required" },
        { status: 400 }
      );
    }

    const shareService = createServerShareService(
      request.nextUrl.origin
    );
    const result = await shareService.findOrCreateMultiTrackShare({ urls });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating multi-track share:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
