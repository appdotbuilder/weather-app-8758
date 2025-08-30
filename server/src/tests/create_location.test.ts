import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput } from '../schema';
import { createLocation } from '../handlers/create_location';
import { eq, and } from 'drizzle-orm';

// Test input data
const testInput: CreateLocationInput = {
  city: 'New York',
  country: 'United States',
  latitude: 40.7128,
  longitude: -74.0060
};

const testInputParis: CreateLocationInput = {
  city: 'Paris',
  country: 'France',
  latitude: 48.8566,
  longitude: 2.3522
};

describe('createLocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new location', async () => {
    const result = await createLocation(testInput);

    // Basic field validation
    expect(result.city).toEqual('New York');
    expect(result.country).toEqual('United States');
    expect(result.latitude).toEqual(40.7128);
    expect(result.longitude).toEqual(-74.0060);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });

  it('should save location to database', async () => {
    const result = await createLocation(testInput);

    // Query database to verify location was saved
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.id))
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].city).toEqual('New York');
    expect(locations[0].country).toEqual('United States');
    expect(parseFloat(locations[0].latitude.toString())).toEqual(40.7128);
    expect(parseFloat(locations[0].longitude.toString())).toEqual(-74.0060);
    expect(locations[0].created_at).toBeInstanceOf(Date);
  });

  it('should return existing location when city and country already exist', async () => {
    // Create first location
    const firstResult = await createLocation(testInput);

    // Try to create the same location again (same city/country)
    const secondResult = await createLocation(testInput);

    // Should return the same location
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.city).toEqual(firstResult.city);
    expect(secondResult.country).toEqual(firstResult.country);
    expect(secondResult.latitude).toEqual(firstResult.latitude);
    expect(secondResult.longitude).toEqual(firstResult.longitude);
    expect(secondResult.created_at).toEqual(firstResult.created_at);

    // Verify only one record exists in database
    const allLocations = await db.select().from(locationsTable).execute();
    expect(allLocations).toHaveLength(1);
  });

  it('should return existing location when coordinates already exist', async () => {
    // Create first location
    const firstResult = await createLocation(testInput);

    // Try to create location with same coordinates but different city name
    const duplicateCoordinatesInput: CreateLocationInput = {
      city: 'NYC', // Different city name
      country: 'USA', // Different country name
      latitude: 40.7128, // Same coordinates
      longitude: -74.0060
    };

    const secondResult = await createLocation(duplicateCoordinatesInput);

    // Should return the existing location (not create new one)
    expect(secondResult.id).toEqual(firstResult.id);
    expect(secondResult.city).toEqual('New York'); // Original city name
    expect(secondResult.country).toEqual('United States'); // Original country name

    // Verify only one record exists in database
    const allLocations = await db.select().from(locationsTable).execute();
    expect(allLocations).toHaveLength(1);
  });

  it('should create separate locations for different cities', async () => {
    // Create New York location
    const nyResult = await createLocation(testInput);

    // Create Paris location
    const parisResult = await createLocation(testInputParis);

    // Should be different locations
    expect(nyResult.id).not.toEqual(parisResult.id);
    expect(nyResult.city).toEqual('New York');
    expect(parisResult.city).toEqual('Paris');
    expect(nyResult.latitude).toEqual(40.7128);
    expect(parisResult.latitude).toEqual(48.8566);

    // Verify both records exist in database
    const allLocations = await db.select().from(locationsTable).execute();
    expect(allLocations).toHaveLength(2);
  });

  it('should handle locations with valid coordinate boundaries', async () => {
    // Test extreme valid coordinates
    const extremeInput: CreateLocationInput = {
      city: 'North Pole Research Station',
      country: 'Arctic',
      latitude: 90.0, // Maximum latitude
      longitude: 180.0 // Maximum longitude
    };

    const result = await createLocation(extremeInput);

    expect(result.latitude).toEqual(90.0);
    expect(result.longitude).toEqual(180.0);
    expect(result.city).toEqual('North Pole Research Station');
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });

  it('should query locations by city and country correctly', async () => {
    // Create test location
    await createLocation(testInput);

    // Query by exact city and country match
    const locations = await db.select()
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.city, 'New York'),
          eq(locationsTable.country, 'United States')
        )
      )
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].city).toEqual('New York');
    expect(locations[0].country).toEqual('United States');
    expect(parseFloat(locations[0].latitude.toString())).toEqual(40.7128);
    expect(parseFloat(locations[0].longitude.toString())).toEqual(-74.0060);
  });
});