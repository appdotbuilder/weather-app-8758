import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, weatherConditionsTable, dailyForecastTable } from '../db/schema';
import { type GetDailyForecastInput } from '../schema';
import { getDailyForecast } from '../handlers/get_daily_forecast';
import { eq, and, gte } from 'drizzle-orm';

// Test input with all required fields
const testInput: GetDailyForecastInput = {
  latitude: 40.7128,
  longitude: -74.0060,
  days: 5
};

const testInputMinimal: GetDailyForecastInput = {
  latitude: 51.5074,
  longitude: -0.1278,
  days: 3
};

describe('getDailyForecast', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create forecast for new location', async () => {
    const result = await getDailyForecast(testInput);

    // Verify we get the expected number of forecast days
    expect(result).toHaveLength(5);

    // Verify each forecast has required fields
    result.forEach(forecast => {
      expect(forecast.id).toBeDefined();
      expect(forecast.location_id).toBeDefined();
      expect(forecast.condition_id).toBeDefined();
      expect(forecast.date).toBeInstanceOf(Date);
      expect(typeof forecast.temperature_min).toBe('number');
      expect(typeof forecast.temperature_max).toBe('number');
      expect(typeof forecast.humidity).toBe('number');
      expect(typeof forecast.wind_speed).toBe('number');
      expect(typeof forecast.precipitation_chance).toBe('number');
      expect(forecast.created_at).toBeInstanceOf(Date);
    });

    // Verify temperature relationships
    result.forEach(forecast => {
      expect(forecast.temperature_max).toBeGreaterThanOrEqual(forecast.temperature_min);
      expect(forecast.humidity).toBeGreaterThanOrEqual(0);
      expect(forecast.humidity).toBeLessThanOrEqual(100);
      expect(forecast.wind_speed).toBeGreaterThanOrEqual(0);
      expect(forecast.precipitation_chance).toBeGreaterThanOrEqual(0);
      expect(forecast.precipitation_chance).toBeLessThanOrEqual(100);
    });
  });

  it('should create location and weather condition records', async () => {
    const result = await getDailyForecast(testInput);

    // Verify location was created
    const locations = await db.select()
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.latitude, testInput.latitude),
          eq(locationsTable.longitude, testInput.longitude)
        )
      )
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].latitude).toEqual(testInput.latitude);
    expect(locations[0].longitude).toEqual(testInput.longitude);

    // Verify weather condition was created
    const conditions = await db.select()
      .from(weatherConditionsTable)
      .execute();

    expect(conditions.length).toBeGreaterThan(0);
    expect(conditions[0].name).toBeDefined();
    expect(conditions[0].description).toBeDefined();
    expect(conditions[0].icon_code).toBeDefined();
  });

  it('should reuse existing location for same coordinates', async () => {
    // Create first forecast
    await getDailyForecast(testInput);

    // Create second forecast with same coordinates
    await getDailyForecast({
      ...testInput,
      days: 3
    });

    // Verify only one location was created
    const locations = await db.select()
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.latitude, testInput.latitude),
          eq(locationsTable.longitude, testInput.longitude)
        )
      )
      .execute();

    expect(locations).toHaveLength(1);
  });

  it('should handle different number of forecast days', async () => {
    const result1 = await getDailyForecast({ ...testInput, days: 1 });
    const result7 = await getDailyForecast({ ...testInputMinimal, days: 7 });

    expect(result1).toHaveLength(1);
    expect(result7).toHaveLength(7);

    // Verify different locations were created
    const allLocations = await db.select()
      .from(locationsTable)
      .execute();

    expect(allLocations).toHaveLength(2);
  });

  it('should save forecast data to database correctly', async () => {
    const result = await getDailyForecast(testInput);
    const firstForecast = result[0];

    // Query database directly
    const savedForecast = await db.select()
      .from(dailyForecastTable)
      .where(eq(dailyForecastTable.id, firstForecast.id))
      .execute();

    expect(savedForecast).toHaveLength(1);
    expect(savedForecast[0].location_id).toEqual(firstForecast.location_id);
    expect(savedForecast[0].condition_id).toEqual(firstForecast.condition_id);
    expect(savedForecast[0].humidity).toEqual(firstForecast.humidity);
    expect(savedForecast[0].precipitation_chance).toEqual(firstForecast.precipitation_chance);
    
    // Verify numeric conversions
    expect(parseFloat(savedForecast[0].temperature_min.toString())).toEqual(firstForecast.temperature_min);
    expect(parseFloat(savedForecast[0].temperature_max.toString())).toEqual(firstForecast.temperature_max);
    expect(parseFloat(savedForecast[0].wind_speed.toString())).toEqual(firstForecast.wind_speed);
  });

  it('should return existing forecast data when available', async () => {
    // Create initial forecast
    const firstResult = await getDailyForecast(testInput);

    // Create second forecast request for same location and days
    const secondResult = await getDailyForecast(testInput);

    // Should return the same number of forecasts
    expect(secondResult).toHaveLength(testInput.days);

    // Verify we're getting existing data (should have same structure)
    expect(secondResult[0].location_id).toEqual(firstResult[0].location_id);
    expect(secondResult[0].condition_id).toEqual(firstResult[0].condition_id);
  });

  it('should handle date range filtering correctly', async () => {
    await getDailyForecast(testInput);

    // Query forecasts by date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const forecasts = await db.select()
      .from(dailyForecastTable)
      .where(gte(dailyForecastTable.date, today.toISOString().split('T')[0]))
      .execute();

    expect(forecasts.length).toBeGreaterThan(0);
    
    forecasts.forEach(forecast => {
      const forecastDate = new Date(forecast.date);
      expect(forecastDate >= today).toBe(true);
    });
  });

  it('should handle edge case coordinates', async () => {
    const extremeInput: GetDailyForecastInput = {
      latitude: -90, // South pole
      longitude: 180, // Date line
      days: 2
    };

    const result = await getDailyForecast(extremeInput);

    expect(result).toHaveLength(2);
    result.forEach(forecast => {
      expect(forecast.id).toBeDefined();
      expect(typeof forecast.temperature_min).toBe('number');
      expect(typeof forecast.temperature_max).toBe('number');
    });

    // Verify location was created with extreme coordinates
    const locations = await db.select()
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.latitude, -90),
          eq(locationsTable.longitude, 180)
        )
      )
      .execute();

    expect(locations).toHaveLength(1);
    expect(locations[0].latitude).toEqual(-90);
    expect(locations[0].longitude).toEqual(180);
  });
});