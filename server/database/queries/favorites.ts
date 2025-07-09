import { eq, and } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { favoriteSongs, type FavoriteSong, type NewFavoriteSong } from '../schema'

/**
 * Add a song to user's favorites
 */
export async function addFavorite(favorite: NewFavoriteSong): Promise<FavoriteSong> {
  const db = getDatabase()
  
  const result = await db
    .insert(favoriteSongs)
    .values(favorite)
    .returning()
  
  return result[0]
}

/**
 * Remove a song from user's favorites
 */
export async function removeFavorite(userId: string, chartId: string, songPosition: number): Promise<void> {
  const db = getDatabase()
  
  await db
    .delete(favoriteSongs)
    .where(
      and(
        eq(favoriteSongs.userId, userId),
        eq(favoriteSongs.chartId, chartId),
        eq(favoriteSongs.songPosition, songPosition)
      )
    )
}

/**
 * Get all favorite songs for a user
 */
export async function getUserFavorites(userId: string): Promise<FavoriteSong[]> {
  const db = getDatabase()
  
  const result = await db
    .select()
    .from(favoriteSongs)
    .where(eq(favoriteSongs.userId, userId))
    .orderBy(favoriteSongs.createdAt)
  
  return result
}

/**
 * Get favorite songs for a specific chart
 */
export async function getChartFavorites(userId: string, chartId: string): Promise<FavoriteSong[]> {
  const db = getDatabase()
  
  const result = await db
    .select()
    .from(favoriteSongs)
    .where(
      and(
        eq(favoriteSongs.userId, userId),
        eq(favoriteSongs.chartId, chartId)
      )
    )
    .orderBy(favoriteSongs.songPosition)
  
  return result
}

/**
 * Check if a song is favorited by a user
 */
export async function isFavorited(userId: string, chartId: string, songPosition: number): Promise<boolean> {
  const db = getDatabase()
  
  const result = await db
    .select()
    .from(favoriteSongs)
    .where(
      and(
        eq(favoriteSongs.userId, userId),
        eq(favoriteSongs.chartId, chartId),
        eq(favoriteSongs.songPosition, songPosition)
      )
    )
    .limit(1)
  
  return result.length > 0
}

/**
 * Get favorite song positions for a chart (for backwards compatibility)
 */
export async function getFavoritePositions(userId: string, chartId: string): Promise<number[]> {
  const favorites = await getChartFavorites(userId, chartId)
  return favorites.map(fav => fav.songPosition)
}