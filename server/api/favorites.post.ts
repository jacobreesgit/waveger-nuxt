import { z } from 'zod'
import { getOrCreateAnonymousUser, validateSession } from '../database/queries/users'
import { addFavorite, removeFavorite, isFavorited } from '../database/queries/favorites'
import { getSessionFromCookie } from '../utils/auth'

// Request body schema
const favoriteSchema = z.object({
  action: z.enum(['add', 'remove']),
  chartId: z.string(),
  songPosition: z.number().int().min(1),
  songName: z.string().min(1),
  artistName: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  try {
    // Parse request body
    const body = await readBody(event)
    const data = favoriteSchema.parse(body)
    
    // Get user from session or create anonymous user
    const sessionToken = getSessionFromCookie(event)
    let user = null
    
    if (sessionToken) {
      user = await validateSession(sessionToken)
    }
    
    if (!user) {
      user = await getOrCreateAnonymousUser()
    }
    
    // Check current favorite status
    const currentlyFavorited = await isFavorited(user.id, data.chartId, data.songPosition)
    
    if (data.action === 'add' && !currentlyFavorited) {
      // Add to favorites
      const favorite = await addFavorite({
        userId: user.id,
        chartId: data.chartId,
        songPosition: data.songPosition,
        songName: data.songName,
        artistName: data.artistName,
      })
      
      return {
        success: true,
        action: 'added',
        favorite
      }
    } else if (data.action === 'remove' && currentlyFavorited) {
      // Remove from favorites
      await removeFavorite(user.id, data.chartId, data.songPosition)
      
      return {
        success: true,
        action: 'removed'
      }
    }
    
    // No action needed
    return {
      success: true,
      action: 'no_change',
      message: `Song is ${currentlyFavorited ? 'already' : 'not'} favorited`
    }
    
  } catch (error) {
    console.error('Error managing favorite:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to manage favorite'
    })
  }
})