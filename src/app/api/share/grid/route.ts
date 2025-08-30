import { NextRequest, NextResponse } from "next/server";
import { createServerShareService } from "@/lib/services/shareService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gridState } = body;

    if (!gridState) {
      return NextResponse.json(
        { error: "Grid state is required" },
        { status: 400 }
      );
    }

    const shareService = createServerShareService(
      request.nextUrl.origin
    );
    const result = await shareService.findOrCreateShare(gridState);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating grid share:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
