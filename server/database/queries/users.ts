import { eq } from 'drizzle-orm'
import { getDatabase } from '../connection'
import { users, userSessions, type User, type NewUser, type UserSession, type NewUserSession } from '../schema'
import { generateSessionToken, isSessionValid } from '../../utils/auth'

/**
 * Create a new user
 */
export async function createUser(userData: NewUser): Promise<User> {
  const db = getDatabase()
  
  const result = await db
    .insert(users)
    .values(userData)
    .returning()
  
  return result[0]
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const db = getDatabase()
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  
  return result[0] || null
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const db = getDatabase()
  
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  
  return result[0] || null
}

/**
 * Create a new user session
 */
export async function createSession(userId: string, expiresAt: Date): Promise<UserSession> {
  const db = getDatabase()
  
  const sessionToken = generateSessionToken()
  
  const sessionData: NewUserSession = {
    userId,
    sessionToken,
    expiresAt,
  }
  
  const result = await db
    .insert(userSessions)
    .values(sessionData)
    .returning()
  
  return result[0]
}

/**
 * Get session by token
 */
export async function getSessionByToken(token: string): Promise<UserSession | null> {
  const db = getDatabase()
  
  const result = await db
    .select()
    .from(userSessions)
    .where(eq(userSessions.sessionToken, token))
    .limit(1)
  
  return result[0] || null
}

/**
 * Delete a session
 */
export async function deleteSession(token: string): Promise<void> {
  const db = getDatabase()
  
  await db
    .delete(userSessions)
    .where(eq(userSessions.sessionToken, token))
}

/**
 * Get or create anonymous user (for local storage migration)
 */
export async function getOrCreateAnonymousUser(): Promise<User> {
  const db = getDatabase()
  
  // Try to find existing anonymous user
  const anonymousEmail = 'anonymous@waveger.local'
  let user = await getUserByEmail(anonymousEmail)
  
  if (!user) {
    // Create anonymous user
    user = await createUser({
      email: anonymousEmail,
      name: 'Anonymous User',
    })
  }
  
  return user
}

/**
 * Validate session and return user
 */
export async function validateSession(token: string): Promise<User | null> {
  const session = await getSessionByToken(token)
  
  if (!session || !isSessionValid(session)) {
    return null
  }
  
  const user = await getUserById(session.userId)
  return user
}