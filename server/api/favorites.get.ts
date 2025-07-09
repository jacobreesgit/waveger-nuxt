import { getOrCreateAnonymousUser, validateSession } from '../database/queries/users'
import { getChartFavorites, getFavoritePositions } from '../database/queries/favorites'
import { getSessionFromCookie } from '../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // Get user from session or create anonymous user
    const sessionToken = getSessionFromCookie(event)
    let user = null
    
    if (sessionToken) {
      user = await validateSession(sessionToken)
    }
    
    if (!user) {
      user = await getOrCreateAnonymousUser()
    }
    
    // Get query parameters
    const query = getQuery(event)
    const chartId = query.chartId as string
    
    if (!chartId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Chart ID is required'
      })
    }
    
    // Get favorites for this chart
    const favorites = await getChartFavorites(user.id, chartId)
    const positions = await getFavoritePositions(user.id, chartId)
    
    return {
      favorites,
      positions, // For backwards compatibility
      user: {
        id: user.id,
        name: user.name,
        email: user.email !== 'anonymous@waveger.local' ? user.email : undefined
      }
    }
  } catch (error) {
    console.error('Error fetching favorites:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch favorites'
    })
  }
})