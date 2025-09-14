/**
 * Simple test script to verify Strava API functionality
 * Run with: npx tsx scripts/test-strava-api.ts
 */

import { 
  isValidStravaUrl, 
  parseStravaUrl
} from '../src/lib/strava-api';

async function testStravaApi() {
  console.log('🔍 Testing Strava API...\n');

  // Test URL validation
  console.log('1. Testing URL validation:');
  const testUrls = [
    'https://www.strava.com/beacon/vdQITEBRoc0',
    'https://strava.com/beacon/abc123',
    'https://www.garmin.com/invalid',
    'https://www.strava.com/activities/123',
  ];

  testUrls.forEach(url => {
    const isValid = isValidStravaUrl(url);
    console.log(`   ${url} -> ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  });

  // Test URL parsing
  console.log('\n2. Testing URL parsing:');
  const validUrl = 'https://www.strava.com/beacon/vdQITEBRoc0';
  const parsed = parseStravaUrl(validUrl);
  console.log(`   ${validUrl} -> ${parsed ? `✅ BeaconId: ${parsed.beaconId}` : '❌ Parse failed'}`);

  console.log('\n3. Testing API calls (Note: These require running Next.js server):');
  console.log('   To test API calls:');
  console.log('   1. Start the dev server: npm run dev');
  console.log('   2. Make a request to: http://localhost:3000/api/strava-fetch-batch');
  console.log('   3. With body: { "athletes": [{ "beaconId": "vdQITEBRoc0" }] }');

  console.log('\n✅ Strava API structure created successfully!');
}

testStravaApi().catch(console.error);
