import { Suspense } from "react";
import { notFound } from "next/navigation";
import MultiTrackApp from "@/components/MultiTrackApp";

interface PageProps {
  params: Promise<{
    shareId: string;
  }>;
}

async function getSharedMultiTrack(shareId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/multi-track/share/${shareId}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch shared multi-track: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.data : null;
  } catch (error) {
    console.error("Error fetching shared multi-track:", error);
    return null;
  }
}

export default async function SharedMultiTrackPage({ params }: PageProps) {
  const { shareId } = await params;

  const sharedData = await getSharedMultiTrack(shareId);

  if (!sharedData) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading shared multi-track...</p>
          </div>
        </div>
      }
    >
      <MultiTrackApp initialUrls={sharedData.urls} />
    </Suspense>
  );
}
