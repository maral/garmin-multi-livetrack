/**
 * Test script for the unified tracking API
 * Run with: node -r tsx/esm test-unified-api.mjs
 */

// Test the provider detection
import { detectProvider, parseProviderUrl } from './src/lib/tracking/providers.ts';

console.log('🧪 Testing Unified Tracking API\n');

// Test URLs
const testUrls = [
  'https://livetrack.garmin.com/session/abc123/token/xyz789',
  'https://www.strava.com/activities/12345/beacon/beacon-id',
  'https://invalid-url.com/not-a-tracker',
  'https://gar.mn/ABC123' // Short URL
];

console.log('1️⃣ Testing Provider Detection:');
for (const url of testUrls) {
  const provider = detectProvider(url);
  console.log(`   ${url} → ${provider || 'null'}`);
}

console.log('\n2️⃣ Testing URL Parsing:');
for (const url of testUrls) {
  const parsed = parseProviderUrl(url);
  console.log(`   ${url}:`);
  console.log(`     Success: ${parsed.success}`);
  console.log(`     Provider: ${parsed.provider}`);
  if (parsed.success && parsed.data) {
    console.log(`     Data:`, parsed.data);
  } else if (parsed.error) {
    console.log(`     Error: ${parsed.error.message}`);
  }
  console.log('');
}

console.log('✅ Basic functionality tests completed!');
console.log('\n📝 Next steps:');
console.log('   • Test the API endpoints with real URLs');
console.log('   • Integrate with the frontend application');
console.log('   • Add comprehensive error handling');
console.log('   • Set up monitoring and logging');
