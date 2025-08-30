import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weatherConditionsTable } from '../db/schema';
import { getWeatherConditions } from '../handlers/get_weather_conditions';

// Test data for weather conditions
const testConditions = [
  {
    name: 'Clear',
    description: 'Clear sky',
    icon_code: '01d'
  },
  {
    name: 'Partly Cloudy',
    description: 'Few clouds',
    icon_code: '02d'
  },
  {
    name: 'Rain',
    description: 'Light rain',
    icon_code: '09d'
  },
  {
    name: 'Snow',
    description: 'Snow',
    icon_code: '13d'
  }
];

describe('getWeatherConditions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no weather conditions exist', async () => {
    const result = await getWeatherConditions();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all weather conditions from database', async () => {
    // Insert test weather conditions
    await db.insert(weatherConditionsTable)
      .values(testConditions)
      .execute();

    const result = await getWeatherConditions();

    expect(result).toHaveLength(4);
    expect(result[0].name).toEqual('Clear');
    expect(result[0].description).toEqual('Clear sky');
    expect(result[0].icon_code).toEqual('01d');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify all conditions are returned
    const names = result.map(condition => condition.name);
    expect(names).toContain('Clear');
    expect(names).toContain('Partly Cloudy');
    expect(names).toContain('Rain');
    expect(names).toContain('Snow');
  });

  it('should return weather conditions with all required fields', async () => {
    // Insert single test condition
    await db.insert(weatherConditionsTable)
      .values([{
        name: 'Thunderstorm',
        description: 'Thunderstorm with heavy rain',
        icon_code: '11d'
      }])
      .execute();

    const result = await getWeatherConditions();

    expect(result).toHaveLength(1);
    const condition = result[0];

    // Verify all required fields are present
    expect(condition.id).toBeDefined();
    expect(typeof condition.id).toBe('number');
    expect(condition.name).toEqual('Thunderstorm');
    expect(condition.description).toEqual('Thunderstorm with heavy rain');
    expect(condition.icon_code).toEqual('11d');
    expect(condition.created_at).toBeInstanceOf(Date);
  });

  it('should preserve insertion order of weather conditions', async () => {
    // Insert conditions in specific order
    const orderedConditions = [
      { name: 'First', description: 'First condition', icon_code: '01' },
      { name: 'Second', description: 'Second condition', icon_code: '02' },
      { name: 'Third', description: 'Third condition', icon_code: '03' }
    ];

    for (const condition of orderedConditions) {
      await db.insert(weatherConditionsTable)
        .values([condition])
        .execute();
    }

    const result = await getWeatherConditions();

    expect(result).toHaveLength(3);
    
    // Verify they're returned in insertion order (by ID)
    expect(result[0].name).toEqual('First');
    expect(result[1].name).toEqual('Second');
    expect(result[2].name).toEqual('Third');
    
    // IDs should be sequential
    expect(result[1].id).toBe(result[0].id + 1);
    expect(result[2].id).toBe(result[1].id + 1);
  });

  it('should handle weather conditions with special characters', async () => {
    // Insert condition with special characters
    await db.insert(weatherConditionsTable)
      .values([{
        name: 'Drizzle & Fog',
        description: 'Light drizzle with fog - visibility <1km',
        icon_code: '50d/09d'
      }])
      .execute();

    const result = await getWeatherConditions();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Drizzle & Fog');
    expect(result[0].description).toEqual('Light drizzle with fog - visibility <1km');
    expect(result[0].icon_code).toEqual('50d/09d');
  });

  it('should maintain data consistency across multiple calls', async () => {
    // Insert test data
    await db.insert(weatherConditionsTable)
      .values(testConditions.slice(0, 2))
      .execute();

    // First call
    const firstResult = await getWeatherConditions();
    expect(firstResult).toHaveLength(2);

    // Second call should return identical data
    const secondResult = await getWeatherConditions();
    expect(secondResult).toHaveLength(2);
    expect(secondResult[0].id).toEqual(firstResult[0].id);
    expect(secondResult[0].name).toEqual(firstResult[0].name);
    expect(secondResult[0].created_at).toEqual(firstResult[0].created_at);
  });
});