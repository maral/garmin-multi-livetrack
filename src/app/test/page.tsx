"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseGarminUrl } from "@/lib/garmin-api";

export default function TestPage() {
  const [url, setUrl] = useState(
    "https://livetrack.garmin.com/session/32e1e8e5-068e-84f5-b9d9-731378d76d00/token/3EECBC5F8BCCF2E19630D3B4F5CA9E"
  );
  const [result, setResult] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    if (!url) return;

    setLoading(true);
    const parsed = parseGarminUrl(url);

    if (!parsed) {
      setResult({ error: "Invalid Garmin URL format" });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/garmin-fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: parsed.sessionId,
          token: parsed.token,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-4">Garmin API Test</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Garmin LiveTrack URL:
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://livetrack.garmin.com/session/..."
              className="w-full"
            />
          </div>

          <Button
            onClick={testApi}
            disabled={loading || !url}
            className="w-full"
          >
            {loading ? "Testing..." : "Test API"}
          </Button>
        </div>
      </div>

      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Result</h2>
          <Textarea
            value={JSON.stringify(result, null, 2)}
            readOnly
            rows={20}
            className="w-full font-mono text-sm"
          />
        </div>
      )}
    </div>
  );
}
