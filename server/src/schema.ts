import { z } from 'zod';

// Location schema
export const locationSchema = z.object({
  id: z.number(),
  city: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  created_at: z.coerce.date()
});

export type Location = z.infer<typeof locationSchema>;

// Weather condition schema
export const weatherConditionSchema = z.object({
  id: z.number(),
  name: z.string(), // e.g., "Clear", "Cloudy", "Rainy"
  description: z.string(), // e.g., "Clear sky", "Light rain"
  icon_code: z.string(), // Weather icon identifier
  created_at: z.coerce.date()
});

export type WeatherCondition = z.infer<typeof weatherConditionSchema>;

// Current weather schema
export const currentWeatherSchema = z.object({
  id: z.number(),
  location_id: z.number(),
  condition_id: z.number(),
  temperature: z.number(), // Temperature in Celsius
  humidity: z.number().int().min(0).max(100), // Humidity percentage
  wind_speed: z.number().min(0), // Wind speed in m/s
  pressure: z.number().min(0), // Atmospheric pressure in hPa
  feels_like: z.number(), // Feels like temperature in Celsius
  visibility: z.number().min(0), // Visibility in km
  uv_index: z.number().min(0), // UV index
  timestamp: z.coerce.date(),
  created_at: z.coerce.date()
});

export type CurrentWeather = z.infer<typeof currentWeatherSchema>;

// Daily forecast schema
export const dailyForecastSchema = z.object({
  id: z.number(),
  location_id: z.number(),
  condition_id: z.number(),
  date: z.coerce.date(),
  temperature_min: z.number(),
  temperature_max: z.number(),
  humidity: z.number().int().min(0).max(100),
  wind_speed: z.number().min(0),
  precipitation_chance: z.number().min(0).max(100), // Chance of precipitation as percentage
  created_at: z.coerce.date()
});

export type DailyForecast = z.infer<typeof dailyForecastSchema>;

// Input schemas for creating/updating data
export const createLocationInputSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export type CreateLocationInput = z.infer<typeof createLocationInputSchema>;

export const getCurrentWeatherInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export type GetCurrentWeatherInput = z.infer<typeof getCurrentWeatherInputSchema>;

export const getWeatherByCityInputSchema = z.object({
  city: z.string().min(1),
  country: z.string().optional() // Optional country for more specific search
});

export type GetWeatherByCityInput = z.infer<typeof getWeatherByCityInputSchema>;

export const getDailyForecastInputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  days: z.number().int().min(1).max(7).default(5) // Number of forecast days, default to 5
});

export type GetDailyForecastInput = z.infer<typeof getDailyForecastInputSchema>;

// Combined weather response schema
export const weatherResponseSchema = z.object({
  location: locationSchema,
  current: currentWeatherSchema.extend({
    condition: weatherConditionSchema
  }),
  forecast: z.array(dailyForecastSchema.extend({
    condition: weatherConditionSchema
  }))
});

export type WeatherResponse = z.infer<typeof weatherResponseSchema>;