import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { searchLocations } from '../handlers/search_locations';

describe('searchLocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test data helper
  const createTestLocations = async () => {
    await db.insert(locationsTable)
      .values([
        {
          city: 'New York',
          country: 'United States',
          latitude: 40.7128,
          longitude: -74.0060
        },
        {
          city: 'London',
          country: 'United Kingdom',
          latitude: 51.5074,
          longitude: -0.1278
        },
        {
          city: 'Paris',
          country: 'France',
          latitude: 48.8566,
          longitude: 2.3522
        },
        {
          city: 'New Delhi',
          country: 'India',
          latitude: 28.6139,
          longitude: 77.2090
        },
        {
          city: 'Sydney',
          country: 'Australia',
          latitude: -33.8688,
          longitude: 151.2093
        }
      ])
      .execute();
  };

  it('should search locations by city name (exact match)', async () => {
    await createTestLocations();

    const results = await searchLocations('London');

    expect(results).toHaveLength(1);
    expect(results[0].city).toEqual('London');
    expect(results[0].country).toEqual('United Kingdom');
    expect(typeof results[0].latitude).toBe('number');
    expect(typeof results[0].longitude).toBe('number');
    expect(results[0].latitude).toEqual(51.5074);
    expect(results[0].longitude).toEqual(-0.1278);
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should search locations by city name (case insensitive)', async () => {
    await createTestLocations();

    const results = await searchLocations('PARIS');

    expect(results).toHaveLength(1);
    expect(results[0].city).toEqual('Paris');
    expect(results[0].country).toEqual('France');
    expect(results[0].latitude).toEqual(48.8566);
    expect(results[0].longitude).toEqual(2.3522);
  });

  it('should search locations by partial city name', async () => {
    await createTestLocations();

    const results = await searchLocations('New');

    expect(results).toHaveLength(2);
    const cities = results.map(r => r.city).sort();
    expect(cities).toEqual(['New Delhi', 'New York']);
  });

  it('should search locations by country name', async () => {
    await createTestLocations();

    const results = await searchLocations('United');

    expect(results).toHaveLength(2);
    const countries = results.map(r => r.country).sort();
    expect(countries).toEqual(['United Kingdom', 'United States']);
  });

  it('should search locations by partial country name', async () => {
    await createTestLocations();

    const results = await searchLocations('aust');

    expect(results).toHaveLength(1);
    expect(results[0].city).toEqual('Sydney');
    expect(results[0].country).toEqual('Australia');
  });

  it('should return empty array for empty query', async () => {
    await createTestLocations();

    const results = await searchLocations('');

    expect(results).toHaveLength(0);
  });

  it('should return empty array for whitespace only query', async () => {
    await createTestLocations();

    const results = await searchLocations('   ');

    expect(results).toHaveLength(0);
  });

  it('should return empty array when no matches found', async () => {
    await createTestLocations();

    const results = await searchLocations('Atlantis');

    expect(results).toHaveLength(0);
  });

  it('should limit results to prevent overwhelming response', async () => {
    // Create many test locations
    const manyLocations = Array.from({ length: 30 }, (_, i) => ({
      city: `Test City ${i + 1}`,
      country: 'Test Country',
      latitude: 40.0 + i * 0.1,
      longitude: -74.0 + i * 0.1
    }));

    await db.insert(locationsTable)
      .values(manyLocations)
      .execute();

    const results = await searchLocations('Test');

    // Should be limited to 20 results
    expect(results.length).toBeLessThanOrEqual(20);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should handle numeric type conversions correctly', async () => {
    await createTestLocations();

    const results = await searchLocations('Sydney');

    expect(results).toHaveLength(1);
    const location = results[0];
    
    // Verify numeric types
    expect(typeof location.latitude).toBe('number');
    expect(typeof location.longitude).toBe('number');
    expect(typeof location.id).toBe('number');
    
    // Verify precision is maintained
    expect(location.latitude).toEqual(-33.8688);
    expect(location.longitude).toEqual(151.2093);
  });

  it('should trim search query properly', async () => {
    await createTestLocations();

    const results = await searchLocations('  London  ');

    expect(results).toHaveLength(1);
    expect(results[0].city).toEqual('London');
  });
});