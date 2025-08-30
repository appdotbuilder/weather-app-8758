import { db } from '../db';
import { weatherConditionsTable } from '../db/schema';
import { type WeatherCondition } from '../schema';

export const getWeatherConditions = async (): Promise<WeatherCondition[]> => {
  try {
    // Query all weather conditions from the database
    const result = await db.select()
      .from(weatherConditionsTable)
      .execute();

    return result;
  } catch (error) {
    console.error('Failed to fetch weather conditions:', error);
    throw error;
  }
};