import Link from "next/link";
import { Grid3X3, Map, Users, Settings, Share2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Garmin Multi LiveTrack
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your preferred way to view and manage multiple Garmin
            LiveTrack URLs
          </p>
        </div>

        {/* Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Grid View Option */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Grid3X3 className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Grid View
              </h2>
              <p className="text-gray-600">
                Flexible grid layout for viewing multiple tracking pages
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Customizable Layout
                  </h3>
                  <p className="text-sm text-gray-600">
                    Adjust grid size and arrange tracking pages as needed
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Individual Pages
                  </h3>
                  <p className="text-sm text-gray-600">
                    Each athlete gets their own embedded tracking page
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Share2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Easy Sharing</h3>
                  <p className="text-sm text-gray-600">
                    Share your complete grid setup with others
                  </p>
                </div>
              </div>
            </div>

            <Link href="/grid" className="block">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Use Grid View
              </Button>
            </Link>
          </div>

          {/* Multi-Track View Option */}
          <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Map className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Multi-Track Map
              </h2>
              <p className="text-gray-600">
                Unified map view with all athletes on a single map
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Map className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Single Map View
                  </h3>
                  <p className="text-sm text-gray-600">
                    All athletes displayed on one interactive map
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Race Comparison
                  </h3>
                  <p className="text-sm text-gray-600">
                    Compare athletes&apos; progress, stats, and positions
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900">Live Tracking</h3>
                  <p className="text-sm text-gray-600">
                    Real-time updates with play/pause controls
                  </p>
                </div>
              </div>
            </div>

            <Link href="/multi-track" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Use Multi-Track Map
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-gray-500">
            Both options support Garmin LiveTrack URLs in short (gar.mn/xxx) and
            long format
          </p>
        </div>
      </div>
    </main>
  );
}
