import { randomBytes } from 'crypto'
import type { UserSession } from '../database/schema'

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Check if a session is valid (not expired)
 */
export function isSessionValid(session: UserSession): boolean {
  return new Date() < new Date(session.expiresAt)
}

/**
 * Create session expiration date (30 days from now)
 */
export function createSessionExpiration(): Date {
  const expiration = new Date()
  expiration.setDate(expiration.getDate() + 30)
  return expiration
}

/**
 * Get session cookie name
 */
export function getSessionCookieName(): string {
  return 'waveger-session'
}

/**
 * Set session cookie
 */
export function setSessionCookie(event: any, token: string, expiresAt: Date): void {
  setCookie(event, getSessionCookieName(), token, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  })
}

/**
 * Get session token from cookie
 */
export function getSessionFromCookie(event: any): string | null {
  return getCookie(event, getSessionCookieName()) || null
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(event: any): void {
  deleteCookie(event, getSessionCookieName())
}