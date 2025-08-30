import { db } from '../db';
import { locationsTable, weatherConditionsTable, currentWeatherTable, dailyForecastTable } from '../db/schema';
import { type GetWeatherByCityInput, type WeatherResponse } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export const getWeatherByCity = async (input: GetWeatherByCityInput): Promise<WeatherResponse> => {
  try {
    // Build location query conditions
    const conditions = [eq(locationsTable.city, input.city)];
    
    if (input.country) {
      conditions.push(eq(locationsTable.country, input.country));
    }

    const locations = await db.select()
      .from(locationsTable)
      .where(and(...conditions))
      .execute();

    if (locations.length === 0) {
      throw new Error(`Weather data not found for city: ${input.city}${input.country ? `, ${input.country}` : ''}`);
    }

    const location = locations[0];

    // Get the most recent current weather for this location
    const currentWeatherResults = await db.select()
      .from(currentWeatherTable)
      .innerJoin(weatherConditionsTable, eq(currentWeatherTable.condition_id, weatherConditionsTable.id))
      .where(eq(currentWeatherTable.location_id, location.id))
      .orderBy(desc(currentWeatherTable.timestamp))
      .limit(1)
      .execute();

    if (currentWeatherResults.length === 0) {
      throw new Error(`No current weather data found for city: ${input.city}`);
    }

    const currentWeatherData = currentWeatherResults[0];

    // Get daily forecast for this location (next 5 days)
    const forecastResults = await db.select()
      .from(dailyForecastTable)
      .innerJoin(weatherConditionsTable, eq(dailyForecastTable.condition_id, weatherConditionsTable.id))
      .where(eq(dailyForecastTable.location_id, location.id))
      .orderBy(desc(dailyForecastTable.date))
      .limit(5)
      .execute();

    // Transform current weather data with proper numeric conversions
    const currentWeather = {
      id: currentWeatherData.current_weather.id,
      location_id: currentWeatherData.current_weather.location_id,
      condition_id: currentWeatherData.current_weather.condition_id,
      temperature: parseFloat(currentWeatherData.current_weather.temperature.toString()),
      humidity: currentWeatherData.current_weather.humidity,
      wind_speed: parseFloat(currentWeatherData.current_weather.wind_speed.toString()),
      pressure: parseFloat(currentWeatherData.current_weather.pressure.toString()),
      feels_like: parseFloat(currentWeatherData.current_weather.feels_like.toString()),
      visibility: parseFloat(currentWeatherData.current_weather.visibility.toString()),
      uv_index: parseFloat(currentWeatherData.current_weather.uv_index.toString()),
      timestamp: currentWeatherData.current_weather.timestamp,
      created_at: currentWeatherData.current_weather.created_at,
      condition: currentWeatherData.weather_conditions
    };

    // Transform forecast data with proper numeric conversions and date conversion
    const forecast = forecastResults.map(result => ({
      id: result.daily_forecast.id,
      location_id: result.daily_forecast.location_id,
      condition_id: result.daily_forecast.condition_id,
      date: new Date(result.daily_forecast.date), // Convert string date to Date object
      temperature_min: parseFloat(result.daily_forecast.temperature_min.toString()),
      temperature_max: parseFloat(result.daily_forecast.temperature_max.toString()),
      humidity: result.daily_forecast.humidity,
      wind_speed: parseFloat(result.daily_forecast.wind_speed.toString()),
      precipitation_chance: result.daily_forecast.precipitation_chance,
      created_at: result.daily_forecast.created_at,
      condition: result.weather_conditions
    }));

    return {
      location,
      current: currentWeather,
      forecast
    };
  } catch (error) {
    console.error('Get weather by city failed:', error);
    throw error;
  }
};