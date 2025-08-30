import { db } from '../db';
import { 
  locationsTable, 
  weatherConditionsTable, 
  currentWeatherTable, 
  dailyForecastTable 
} from '../db/schema';
import { type GetCurrentWeatherInput, type WeatherResponse } from '../schema';
import { eq, and, desc, gte } from 'drizzle-orm';

export const getCurrentWeather = async (input: GetCurrentWeatherInput): Promise<WeatherResponse> => {
  try {
    // 1. Find or create location record for the coordinates
    const location = await findOrCreateLocation(input.latitude, input.longitude);
    
    // 2. Find or create default weather condition
    const condition = await findOrCreateWeatherCondition();
    
    // 3. Create current weather record
    const currentWeather = await createCurrentWeatherRecord(location.id, condition.id, input);
    
    // 4. Create forecast records
    const forecast = await createForecastRecords(location.id, condition.id);
    
    // 5. Return formatted weather response
    return {
      location,
      current: {
        ...currentWeather,
        condition
      },
      forecast: forecast.map(f => ({
        ...f,
        date: new Date(f.date),
        condition
      }))
    };
  } catch (error) {
    console.error('Get current weather failed:', error);
    throw error;
  }
};

async function findOrCreateLocation(latitude: number, longitude: number) {
  // Try to find existing location within a small tolerance (0.01 degrees ~ 1km)
  const tolerance = 0.01;
  const existingLocations = await db.select()
    .from(locationsTable)
    .execute();

  // Check if any location is within tolerance
  const existingLocation = existingLocations.find(loc => 
    Math.abs(loc.latitude - latitude) <= tolerance &&
    Math.abs(loc.longitude - longitude) <= tolerance
  );

  if (existingLocation) {
    return existingLocation;
  }

  // Create new location record
  const result = await db.insert(locationsTable)
    .values({
      city: `Location ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      country: 'Unknown',
      latitude: latitude,
      longitude: longitude
    })
    .returning()
    .execute();

  return result[0];
}

async function findOrCreateWeatherCondition() {
  // Try to find existing default condition
  const existingConditions = await db.select()
    .from(weatherConditionsTable)
    .where(eq(weatherConditionsTable.name, 'Clear'))
    .execute();

  if (existingConditions.length > 0) {
    return existingConditions[0];
  }

  // Create default weather condition
  const result = await db.insert(weatherConditionsTable)
    .values({
      name: 'Clear',
      description: 'Clear sky',
      icon_code: '01d'
    })
    .returning()
    .execute();

  return result[0];
}

async function createCurrentWeatherRecord(locationId: number, conditionId: number, input: GetCurrentWeatherInput) {
  // Generate realistic weather data based on coordinates
  const baseTemp = 20 + (Math.abs(input.latitude) > 60 ? -15 : 0) + Math.random() * 10;
  
  const result = await db.insert(currentWeatherTable)
    .values({
      location_id: locationId,
      condition_id: conditionId,
      temperature: baseTemp,
      humidity: Math.floor(40 + Math.random() * 40), // 40-80%
      wind_speed: 2 + Math.random() * 8, // 2-10 m/s
      pressure: 1000 + Math.random() * 50, // 1000-1050 hPa
      feels_like: baseTemp + (-2 + Math.random() * 4),
      visibility: 5 + Math.random() * 15, // 5-20 km
      uv_index: Math.max(0, (Math.random() * 10)),
      timestamp: new Date()
    })
    .returning()
    .execute();

  return result[0];
}

async function createForecastRecords(locationId: number, conditionId: number) {
  const forecastData = [];
  const today = new Date();

  // Create 5 days of forecast
  for (let i = 1; i <= 5; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    const minTemp = 15 + Math.random() * 10;
    const maxTemp = minTemp + 5 + Math.random() * 10;

    forecastData.push({
      location_id: locationId,
      condition_id: conditionId,
      date: forecastDate.toISOString().split('T')[0], // YYYY-MM-DD format
      temperature_min: minTemp,
      temperature_max: maxTemp,
      humidity: Math.floor(30 + Math.random() * 50), // 30-80%
      wind_speed: 1 + Math.random() * 6, // 1-7 m/s
      precipitation_chance: Math.floor(Math.random() * 60) // 0-60%
    });
  }

  const results = await db.insert(dailyForecastTable)
    .values(forecastData)
    .returning()
    .execute();

  return results;
}