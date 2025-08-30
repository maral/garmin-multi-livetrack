import { NextRequest, NextResponse } from "next/server";
import { createServerShareService } from "@/lib/services/shareService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    const shareService = createServerShareService();
    const result = await shareService.getSharedMultiTrack(shareId);

    if (!result) {
      return NextResponse.json(
        { error: "Multi-track share not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching shared multi-track:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
