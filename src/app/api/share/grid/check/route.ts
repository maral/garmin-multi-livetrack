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

    const shareService = createServerShareService();
    const hasExisting = await shareService.hasExistingShare(gridState);

    return NextResponse.json({ hasExisting });
  } catch (error) {
    console.error("Error checking existing grid share:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
