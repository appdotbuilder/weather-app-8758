import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { locationsTable, weatherConditionsTable, currentWeatherTable, dailyForecastTable } from '../db/schema';
import { type GetWeatherByCityInput } from '../schema';
import { getWeatherByCity } from '../handlers/get_weather_by_city';

describe('getWeatherByCity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get weather data for a city without country', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create test weather condition
    const conditionResult = await db.insert(weatherConditionsTable)
      .values({
        name: 'Cloudy',
        description: 'Overcast clouds',
        icon_code: '04d'
      })
      .returning()
      .execute();

    const condition = conditionResult[0];

    // Create current weather data
    await db.insert(currentWeatherTable)
      .values({
        location_id: location.id,
        condition_id: condition.id,
        temperature: 18.5,
        humidity: 78,
        wind_speed: 3.2,
        pressure: 1012.4,
        feels_like: 19.8,
        visibility: 10.0,
        uv_index: 2.5,
        timestamp: new Date()
      })
      .execute();

    // Create forecast data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    await db.insert(dailyForecastTable)
      .values([
        {
          location_id: location.id,
          condition_id: condition.id,
          date: tomorrow.toISOString().split('T')[0],
          temperature_min: 12.3,
          temperature_max: 22.1,
          humidity: 65,
          wind_speed: 4.5,
          precipitation_chance: 30
        },
        {
          location_id: location.id,
          condition_id: condition.id,
          date: dayAfter.toISOString().split('T')[0],
          temperature_min: 15.7,
          temperature_max: 25.9,
          humidity: 55,
          wind_speed: 2.8,
          precipitation_chance: 10
        }
      ])
      .execute();

    const input: GetWeatherByCityInput = {
      city: 'London'
    };

    const result = await getWeatherByCity(input);

    // Verify location data
    expect(result.location.city).toEqual('London');
    expect(result.location.country).toEqual('United Kingdom');
    expect(result.location.latitude).toEqual(51.5074);
    expect(result.location.longitude).toEqual(-0.1278);
    expect(result.location.id).toBeDefined();
    expect(result.location.created_at).toBeInstanceOf(Date);

    // Verify current weather data
    expect(result.current.temperature).toEqual(18.5);
    expect(typeof result.current.temperature).toBe('number');
    expect(result.current.humidity).toEqual(78);
    expect(result.current.wind_speed).toEqual(3.2);
    expect(typeof result.current.wind_speed).toBe('number');
    expect(result.current.pressure).toEqual(1012.4);
    expect(typeof result.current.pressure).toBe('number');
    expect(result.current.feels_like).toEqual(19.8);
    expect(typeof result.current.feels_like).toBe('number');
    expect(result.current.visibility).toEqual(10.0);
    expect(typeof result.current.visibility).toBe('number');
    expect(result.current.uv_index).toEqual(2.5);
    expect(typeof result.current.uv_index).toBe('number');
    expect(result.current.timestamp).toBeInstanceOf(Date);
    expect(result.current.created_at).toBeInstanceOf(Date);

    // Verify current weather condition
    expect(result.current.condition.name).toEqual('Cloudy');
    expect(result.current.condition.description).toEqual('Overcast clouds');
    expect(result.current.condition.icon_code).toEqual('04d');
    expect(result.current.condition.created_at).toBeInstanceOf(Date);

    // Verify forecast data
    expect(result.forecast).toHaveLength(2);
    expect(result.forecast[0].temperature_min).toEqual(15.7); // Most recent first due to DESC order
    expect(typeof result.forecast[0].temperature_min).toBe('number');
    expect(result.forecast[0].temperature_max).toEqual(25.9);
    expect(typeof result.forecast[0].temperature_max).toBe('number');
    expect(result.forecast[0].wind_speed).toEqual(2.8);
    expect(typeof result.forecast[0].wind_speed).toBe('number');
    expect(result.forecast[0].precipitation_chance).toEqual(10);
    expect(result.forecast[0].condition.name).toEqual('Cloudy');
    expect(result.forecast[0].date).toBeInstanceOf(Date);
    expect(result.forecast[0].created_at).toBeInstanceOf(Date);
  });

  it('should get weather data for a city with specific country', async () => {
    // Create multiple cities with same name
    const locationResults = await db.insert(locationsTable)
      .values([
        {
          city: 'Paris',
          country: 'France',
          latitude: 48.8566,
          longitude: 2.3522
        },
        {
          city: 'Paris',
          country: 'United States',
          latitude: 33.6617,
          longitude: -95.5555
        }
      ])
      .returning()
      .execute();

    const parisUS = locationResults.find(l => l.country === 'United States')!;

    // Create weather condition
    const conditionResult = await db.insert(weatherConditionsTable)
      .values({
        name: 'Sunny',
        description: 'Clear sky',
        icon_code: '01d'
      })
      .returning()
      .execute();

    const condition = conditionResult[0];

    // Create current weather for Paris, US
    await db.insert(currentWeatherTable)
      .values({
        location_id: parisUS.id,
        condition_id: condition.id,
        temperature: 28.3,
        humidity: 45,
        wind_speed: 5.1,
        pressure: 1018.2,
        feels_like: 30.1,
        visibility: 15.0,
        uv_index: 8.2,
        timestamp: new Date()
      })
      .execute();

    const input: GetWeatherByCityInput = {
      city: 'Paris',
      country: 'United States'
    };

    const result = await getWeatherByCity(input);

    // Should return data for Paris, US not Paris, France
    expect(result.location.city).toEqual('Paris');
    expect(result.location.country).toEqual('United States');
    expect(result.location.latitude).toEqual(33.6617);
    expect(result.location.longitude).toEqual(-95.5555);
    expect(result.current.temperature).toEqual(28.3);
    expect(result.current.condition.name).toEqual('Sunny');
  });

  it('should return most recent current weather data', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        city: 'Tokyo',
        country: 'Japan',
        latitude: 35.6762,
        longitude: 139.6503
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create weather conditions
    const conditionResults = await db.insert(weatherConditionsTable)
      .values([
        {
          name: 'Rainy',
          description: 'Heavy rain',
          icon_code: '10d'
        },
        {
          name: 'Sunny',
          description: 'Clear sky',
          icon_code: '01d'
        }
      ])
      .returning()
      .execute();

    const rainyCondition = conditionResults[0];
    const sunnyCondition = conditionResults[1];

    // Create older weather data
    const oldTimestamp = new Date();
    oldTimestamp.setHours(oldTimestamp.getHours() - 2);

    await db.insert(currentWeatherTable)
      .values({
        location_id: location.id,
        condition_id: rainyCondition.id,
        temperature: 20.1,
        humidity: 85,
        wind_speed: 6.7,
        pressure: 995.3,
        feels_like: 22.4,
        visibility: 5.0,
        uv_index: 1.0,
        timestamp: oldTimestamp
      })
      .execute();

    // Create newer weather data
    const newTimestamp = new Date();

    await db.insert(currentWeatherTable)
      .values({
        location_id: location.id,
        condition_id: sunnyCondition.id,
        temperature: 25.8,
        humidity: 60,
        wind_speed: 3.2,
        pressure: 1015.7,
        feels_like: 27.1,
        visibility: 12.0,
        uv_index: 6.5,
        timestamp: newTimestamp
      })
      .execute();

    const input: GetWeatherByCityInput = {
      city: 'Tokyo'
    };

    const result = await getWeatherByCity(input);

    // Should return the most recent weather data (sunny, not rainy)
    expect(result.current.temperature).toEqual(25.8);
    expect(result.current.condition.name).toEqual('Sunny');
    expect(result.current.timestamp.getTime()).toBeGreaterThan(oldTimestamp.getTime());
  });

  it('should throw error when city is not found', async () => {
    const input: GetWeatherByCityInput = {
      city: 'NonexistentCity'
    };

    await expect(getWeatherByCity(input)).rejects.toThrow(/Weather data not found for city: NonexistentCity/i);
  });

  it('should throw error when city with specific country is not found', async () => {
    // Create Paris, France
    await db.insert(locationsTable)
      .values({
        city: 'Paris',
        country: 'France',
        latitude: 48.8566,
        longitude: 2.3522
      })
      .execute();

    const input: GetWeatherByCityInput = {
      city: 'Paris',
      country: 'Germany' // Wrong country
    };

    await expect(getWeatherByCity(input)).rejects.toThrow(/Weather data not found for city: Paris, Germany/i);
  });

  it('should throw error when no current weather data exists', async () => {
    // Create location but no weather data
    await db.insert(locationsTable)
      .values({
        city: 'EmptyCity',
        country: 'TestCountry',
        latitude: 0.0,
        longitude: 0.0
      })
      .execute();

    const input: GetWeatherByCityInput = {
      city: 'EmptyCity'
    };

    await expect(getWeatherByCity(input)).rejects.toThrow(/No current weather data found for city: EmptyCity/i);
  });

  it('should handle cities with no forecast data', async () => {
    // Create test location
    const locationResult = await db.insert(locationsTable)
      .values({
        city: 'NewCity',
        country: 'TestLand',
        latitude: 10.0,
        longitude: 20.0
      })
      .returning()
      .execute();

    const location = locationResult[0];

    // Create weather condition
    const conditionResult = await db.insert(weatherConditionsTable)
      .values({
        name: 'Mild',
        description: 'Mild weather',
        icon_code: '02d'
      })
      .returning()
      .execute();

    const condition = conditionResult[0];

    // Create only current weather, no forecast
    await db.insert(currentWeatherTable)
      .values({
        location_id: location.id,
        condition_id: condition.id,
        temperature: 22.0,
        humidity: 50,
        wind_speed: 2.0,
        pressure: 1013.0,
        feels_like: 23.5,
        visibility: 8.0,
        uv_index: 4.0,
        timestamp: new Date()
      })
      .execute();

    const input: GetWeatherByCityInput = {
      city: 'NewCity'
    };

    const result = await getWeatherByCity(input);

    expect(result.location.city).toEqual('NewCity');
    expect(result.current.temperature).toEqual(22.0);
    expect(result.forecast).toHaveLength(0); // No forecast data
  });
});