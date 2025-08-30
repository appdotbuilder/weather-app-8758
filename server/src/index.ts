import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  getCurrentWeatherInputSchema,
  getWeatherByCityInputSchema,
  getDailyForecastInputSchema,
  createLocationInputSchema
} from './schema';

// Import handlers
import { getCurrentWeather } from './handlers/get_current_weather';
import { getWeatherByCity } from './handlers/get_weather_by_city';
import { getDailyForecast } from './handlers/get_daily_forecast';
import { createLocation } from './handlers/create_location';
import { searchLocations } from './handlers/search_locations';
import { getWeatherConditions } from './handlers/get_weather_conditions';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Get current weather by coordinates (for auto-location detection)
  getCurrentWeather: publicProcedure
    .input(getCurrentWeatherInputSchema)
    .query(({ input }) => getCurrentWeather(input)),

  // Get weather by city name (for manual location selection)
  getWeatherByCity: publicProcedure
    .input(getWeatherByCityInputSchema)
    .query(({ input }) => getWeatherByCity(input)),

  // Get extended daily forecast
  getDailyForecast: publicProcedure
    .input(getDailyForecastInputSchema)
    .query(({ input }) => getDailyForecast(input)),

  // Create a new location
  createLocation: publicProcedure
    .input(createLocationInputSchema)
    .mutation(({ input }) => createLocation(input)),

  // Search locations by city name
  searchLocations: publicProcedure
    .input(z.string().min(1))
    .query(({ input }) => searchLocations(input)),

  // Get all weather conditions (for UI reference)
  getWeatherConditions: publicProcedure
    .query(() => getWeatherConditions()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC Weather API server listening at port: ${port}`);
}

start();