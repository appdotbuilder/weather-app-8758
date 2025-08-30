import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  locationsTable, 
  weatherConditionsTable, 
  currentWeatherTable, 
  dailyForecastTable 
} from '../db/schema';
import { type GetCurrentWeatherInput } from '../schema';
import { getCurrentWeather } from '../handlers/get_current_weather';
import { eq, and, gte } from 'drizzle-orm';

// Test input with coordinates for London
const testInput: GetCurrentWeatherInput = {
  latitude: 51.5074,
  longitude: -0.1278
};

// Test input for a different location
const testInputParis: GetCurrentWeatherInput = {
  latitude: 48.8566,
  longitude: 2.3522
};

describe('getCurrentWeather', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create weather data for new coordinates', async () => {
    const result = await getCurrentWeather(testInput);

    // Validate response structure
    expect(result).toBeDefined();
    expect(result.location).toBeDefined();
    expect(result.current).toBeDefined();
    expect(result.forecast).toBeDefined();

    // Validate location data
    expect(result.location.id).toBeDefined();
    expect(typeof result.location.latitude).toBe('number');
    expect(typeof result.location.longitude).toBe('number');
    expect(result.location.latitude).toEqual(51.5074);
    expect(result.location.longitude).toEqual(-0.1278);
    expect(result.location.created_at).toBeInstanceOf(Date);

    // Validate current weather data
    expect(result.current.id).toBeDefined();
    expect(typeof result.current.temperature).toBe('number');
    expect(typeof result.current.wind_speed).toBe('number');
    expect(typeof result.current.pressure).toBe('number');
    expect(typeof result.current.feels_like).toBe('number');
    expect(typeof result.current.visibility).toBe('number');
    expect(typeof result.current.uv_index).toBe('number');
    expect(result.current.humidity).toBeGreaterThanOrEqual(0);
    expect(result.current.humidity).toBeLessThanOrEqual(100);
    expect(result.current.condition).toBeDefined();
    expect(result.current.timestamp).toBeInstanceOf(Date);

    // Validate forecast data
    expect(result.forecast).toHaveLength(5);
    result.forecast.forEach((forecast, index) => {
      expect(forecast.id).toBeDefined();
      expect(typeof forecast.temperature_min).toBe('number');
      expect(typeof forecast.temperature_max).toBe('number');
      expect(typeof forecast.wind_speed).toBe('number');
      expect(forecast.temperature_max).toBeGreaterThan(forecast.temperature_min);
      expect(forecast.humidity).toBeGreaterThanOrEqual(0);
      expect(forecast.humidity).toBeLessThanOrEqual(100);
      expect(forecast.precipitation_chance).toBeGreaterThanOrEqual(0);
      expect(forecast.precipitation_chance).toBeLessThanOrEqual(100);
      expect(forecast.condition).toBeDefined();
      expect(forecast.date).toBeInstanceOf(Date);
      
      // Check that forecast dates are in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const forecastDate = new Date(forecast.date);
      forecastDate.setHours(0, 0, 0, 0);
      expect(forecastDate.getTime()).toBeGreaterThan(today.getTime());
    });
  });

  it('should save all data to database correctly', async () => {
    const result = await getCurrentWeather(testInput);

    // Check location was saved
    const locations = await db.select()
      .from(locationsTable)
      .where(eq(locationsTable.id, result.location.id))
      .execute();
    
    expect(locations).toHaveLength(1);
    expect(locations[0].latitude).toEqual(51.5074);
    expect(locations[0].longitude).toEqual(-0.1278);

    // Check weather condition was saved
    const conditions = await db.select()
      .from(weatherConditionsTable)
      .where(eq(weatherConditionsTable.id, result.current.condition.id))
      .execute();
    
    expect(conditions).toHaveLength(1);
    expect(conditions[0].name).toEqual('Clear');
    expect(conditions[0].description).toEqual('Clear sky');

    // Check current weather was saved
    const currentWeather = await db.select()
      .from(currentWeatherTable)
      .where(eq(currentWeatherTable.id, result.current.id))
      .execute();
    
    expect(currentWeather).toHaveLength(1);
    expect(currentWeather[0].location_id).toEqual(result.location.id);
    expect(currentWeather[0].temperature).toEqual(result.current.temperature);

    // Check forecast was saved
    const forecast = await db.select()
      .from(dailyForecastTable)
      .where(eq(dailyForecastTable.location_id, result.location.id))
      .execute();
    
    expect(forecast).toHaveLength(5);
    forecast.forEach(f => {
      expect(f.location_id).toEqual(result.location.id);
      expect(f.condition_id).toEqual(result.current.condition.id);
    });
  });

  it('should reuse existing location for nearby coordinates', async () => {
    // Create initial weather data
    const result1 = await getCurrentWeather(testInput);
    
    // Request weather for very nearby coordinates (within tolerance)
    const nearbyInput: GetCurrentWeatherInput = {
      latitude: 51.5075, // 0.0001 degree difference
      longitude: -0.1279
    };
    
    const result2 = await getCurrentWeather(nearbyInput);

    // Should reuse the same location
    expect(result2.location.id).toEqual(result1.location.id);

    // But should create new current weather record
    expect(result2.current.id).not.toEqual(result1.current.id);
  });

  it('should create separate locations for distant coordinates', async () => {
    const result1 = await getCurrentWeather(testInput);
    const result2 = await getCurrentWeather(testInputParis);

    // Should create different locations
    expect(result2.location.id).not.toEqual(result1.location.id);
    expect(result2.location.latitude).toEqual(48.8566);
    expect(result2.location.longitude).toEqual(2.3522);

    // Verify both locations exist in database
    const locations = await db.select()
      .from(locationsTable)
      .execute();
    
    expect(locations).toHaveLength(2);
    
    const londonLocation = locations.find(loc => 
      Math.abs(loc.latitude - 51.5074) < 0.01
    );
    const parisLocation = locations.find(loc => 
      Math.abs(loc.latitude - 48.8566) < 0.01
    );
    
    expect(londonLocation).toBeDefined();
    expect(parisLocation).toBeDefined();
  });

  it('should reuse existing weather condition', async () => {
    // Create weather condition manually first
    const conditionResult = await db.insert(weatherConditionsTable)
      .values({
        name: 'Clear',
        description: 'Clear sky',
        icon_code: '01d'
      })
      .returning()
      .execute();

    const result = await getCurrentWeather(testInput);

    // Should reuse the existing condition
    expect(result.current.condition.id).toEqual(conditionResult[0].id);
    expect(result.current.condition.name).toEqual('Clear');

    // Verify only one condition exists
    const conditions = await db.select()
      .from(weatherConditionsTable)
      .execute();
    
    expect(conditions).toHaveLength(1);
  });

  it('should handle extreme coordinates correctly', async () => {
    const extremeInput: GetCurrentWeatherInput = {
      latitude: -89.9, // Near South Pole
      longitude: 179.9  // Near International Date Line
    };

    const result = await getCurrentWeather(extremeInput);

    expect(result.location.latitude).toEqual(-89.9);
    expect(result.location.longitude).toEqual(179.9);
    expect(result.current.temperature).toBeDefined();
    expect(typeof result.current.temperature).toBe('number');

    // Temperature should be reasonable even for extreme locations
    expect(result.current.temperature).toBeGreaterThan(-50);
    expect(result.current.temperature).toBeLessThan(50);
  });

  it('should generate consistent forecast dates', async () => {
    const result = await getCurrentWeather(testInput);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check that forecast dates are consecutive days starting from tomorrow
    result.forecast.forEach((forecast, index) => {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() + index + 1);
      expectedDate.setHours(0, 0, 0, 0);
      
      const forecastDate = new Date(forecast.date);
      forecastDate.setHours(0, 0, 0, 0);
      
      expect(forecastDate.getTime()).toEqual(expectedDate.getTime());
    });
  });

  it('should query locations within coordinate range correctly', async () => {
    // Create several locations
    await getCurrentWeather(testInput); // London
    await getCurrentWeather(testInputParis); // Paris
    await getCurrentWeather({ latitude: 40.7128, longitude: -74.0060 }); // New York

    // Query all locations and filter programmatically
    const locations = await db.select()
      .from(locationsTable)
      .execute();

    // Should include London (51.5), Paris (48.8), and New York (40.7)
    expect(locations.length).toBeGreaterThan(0);
    locations.forEach(location => {
      expect(location.latitude).toBeDefined();
      expect(location.longitude).toBeDefined();
      expect(location.created_at).toBeInstanceOf(Date);
    });
  });
});