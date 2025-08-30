import { serial, text, pgTable, timestamp, real, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Locations table
export const locationsTable = pgTable('locations', {
  id: serial('id').primaryKey(),
  city: text('city').notNull(),
  country: text('country').notNull(),
  latitude: real('latitude').notNull(), // Using real for precise coordinates
  longitude: real('longitude').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Weather conditions table (for reusable conditions)
export const weatherConditionsTable = pgTable('weather_conditions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // e.g., "Clear", "Cloudy", "Rainy"
  description: text('description').notNull(), // e.g., "Clear sky", "Light rain"
  icon_code: text('icon_code').notNull(), // Weather icon identifier
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Current weather table
export const currentWeatherTable = pgTable('current_weather', {
  id: serial('id').primaryKey(),
  location_id: integer('location_id').references(() => locationsTable.id).notNull(),
  condition_id: integer('condition_id').references(() => weatherConditionsTable.id).notNull(),
  temperature: real('temperature').notNull(), // Temperature in Celsius
  humidity: integer('humidity').notNull(), // Humidity percentage (0-100)
  wind_speed: real('wind_speed').notNull(), // Wind speed in m/s
  pressure: real('pressure').notNull(), // Atmospheric pressure in hPa
  feels_like: real('feels_like').notNull(), // Feels like temperature in Celsius
  visibility: real('visibility').notNull(), // Visibility in km
  uv_index: real('uv_index').notNull(), // UV index
  timestamp: timestamp('timestamp').notNull(), // When this weather data was recorded
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Daily forecast table
export const dailyForecastTable = pgTable('daily_forecast', {
  id: serial('id').primaryKey(),
  location_id: integer('location_id').references(() => locationsTable.id).notNull(),
  condition_id: integer('condition_id').references(() => weatherConditionsTable.id).notNull(),
  date: date('date').notNull(), // Forecast date
  temperature_min: real('temperature_min').notNull(),
  temperature_max: real('temperature_max').notNull(),
  humidity: integer('humidity').notNull(),
  wind_speed: real('wind_speed').notNull(),
  precipitation_chance: integer('precipitation_chance').notNull(), // 0-100 percentage
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const locationsRelations = relations(locationsTable, ({ many }) => ({
  currentWeather: many(currentWeatherTable),
  dailyForecast: many(dailyForecastTable),
}));

export const weatherConditionsRelations = relations(weatherConditionsTable, ({ many }) => ({
  currentWeather: many(currentWeatherTable),
  dailyForecast: many(dailyForecastTable),
}));

export const currentWeatherRelations = relations(currentWeatherTable, ({ one }) => ({
  location: one(locationsTable, {
    fields: [currentWeatherTable.location_id],
    references: [locationsTable.id],
  }),
  condition: one(weatherConditionsTable, {
    fields: [currentWeatherTable.condition_id],
    references: [weatherConditionsTable.id],
  }),
}));

export const dailyForecastRelations = relations(dailyForecastTable, ({ one }) => ({
  location: one(locationsTable, {
    fields: [dailyForecastTable.location_id],
    references: [locationsTable.id],
  }),
  condition: one(weatherConditionsTable, {
    fields: [dailyForecastTable.condition_id],
    references: [weatherConditionsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Location = typeof locationsTable.$inferSelect;
export type NewLocation = typeof locationsTable.$inferInsert;

export type WeatherCondition = typeof weatherConditionsTable.$inferSelect;
export type NewWeatherCondition = typeof weatherConditionsTable.$inferInsert;

export type CurrentWeather = typeof currentWeatherTable.$inferSelect;
export type NewCurrentWeather = typeof currentWeatherTable.$inferInsert;

export type DailyForecast = typeof dailyForecastTable.$inferSelect;
export type NewDailyForecast = typeof dailyForecastTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  locations: locationsTable,
  weatherConditions: weatherConditionsTable,
  currentWeather: currentWeatherTable,
  dailyForecast: dailyForecastTable,
};