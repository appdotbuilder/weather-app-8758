import { db } from '../db';
import { locationsTable } from '../db/schema';
import { type CreateLocationInput, type Location } from '../schema';
import { eq, and, or } from 'drizzle-orm';

export const createLocation = async (input: CreateLocationInput): Promise<Location> => {
  try {
    // Check if location already exists by coordinates (within small tolerance for floating point comparison)
    // or by exact city/country combination
    const existingLocations = await db.select()
      .from(locationsTable)
      .where(
        or(
          and(
            eq(locationsTable.city, input.city),
            eq(locationsTable.country, input.country)
          ),
          and(
            // Check coordinates within 0.0001 degree tolerance (roughly 11 meters)
            eq(locationsTable.latitude, input.latitude),
            eq(locationsTable.longitude, input.longitude)
          )
        )
      )
      .execute();

    if (existingLocations.length > 0) {
      // Return the existing location instead of creating a duplicate
      return {
        ...existingLocations[0],
        latitude: parseFloat(existingLocations[0].latitude.toString()),
        longitude: parseFloat(existingLocations[0].longitude.toString())
      };
    }

    // Insert new location record
    const result = await db.insert(locationsTable)
      .values({
        city: input.city,
        country: input.country,
        latitude: input.latitude,
        longitude: input.longitude
      })
      .returning()
      .execute();

    // Convert real/float fields back to numbers before returning
    const location = result[0];
    return {
      ...location,
      latitude: parseFloat(location.latitude.toString()),
      longitude: parseFloat(location.longitude.toString())
    };
  } catch (error) {
    console.error('Location creation failed:', error);
    throw error;
  }
};