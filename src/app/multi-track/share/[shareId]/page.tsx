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
    // Import and use the database repository directly instead of making HTTP calls
    const { createServerSharedGridRepository } = await import("@/lib/database/repositories/sharedGridRepository");
    
    const repository = createServerSharedGridRepository();
    const sharedGrid = await repository.findByShareId(shareId);
    if (!sharedGrid) {
      return null;
    }

    // Return the data in the same format as the API
    return {
      id: sharedGrid.id,
      shareId: sharedGrid.share_id,
      urls: Object.values(sharedGrid.cell_data).map(cell => cell.url).filter(Boolean),
      createdAt: sharedGrid.created_at,
    };
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
