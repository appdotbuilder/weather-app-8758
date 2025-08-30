import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type Location } from '../schema';
import { ilike, or } from 'drizzle-orm';

export const searchLocations = async (query: string): Promise<Location[]> => {
  try {
    // Sanitize and prepare search query
    const searchTerm = query.trim();
    
    if (!searchTerm) {
      return [];
    }

    // Search locations by city name (case-insensitive)
    // Also search by country for broader results
    const results = await db.select()
      .from(locationsTable)
      .where(
        or(
          ilike(locationsTable.city, `%${searchTerm}%`),
          ilike(locationsTable.country, `%${searchTerm}%`)
        )
      )
      .limit(20) // Limit results to prevent overwhelming the client
      .execute();

    // Convert results to match the schema (handle real type conversion)
    return results.map(location => ({
      ...location,
      latitude: Number(location.latitude), // Convert real to number
      longitude: Number(location.longitude) // Convert real to number
    }));
  } catch (error) {
    console.error('Location search failed:', error);
    throw error;
  }
};