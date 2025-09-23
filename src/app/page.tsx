import Link from "next/link";
import { Grid3X3, Map, Users, Settings, Share2, Eye, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Garmin & Strava Multi LiveTrack
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose your preferred way to view and manage multiple Garmin
            LiveTrack URLs and Strava Beacon URLs.
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
            Both options support Strava Beacon URLs and Garmin LiveTrack URLs in
            short (gar.mn/xxx) and long format.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-12">
            <a
              href="https://github.com/maral/garmin-multi-livetrack"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.30.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
            <a
              href="https://forms.gle/4azxFR97P3zUDy936"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Leave Feedback
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
