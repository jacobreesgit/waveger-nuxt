import { pgTable, uuid, varchar, text, timestamp, integer, jsonb, index, unique } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Users table - stores user account information
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  emailUnique: unique('users_email_unique').on(table.email),
}))

/**
 * Favorite songs table - stores user's favorite tracks from charts
 */
export const favoriteSongs = pgTable('favorite_songs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  songPosition: integer('song_position').notNull(),
  chartId: varchar('chart_id', { length: 100 }).notNull(),
  songName: varchar('song_name', { length: 255 }).notNull(),
  artistName: varchar('artist_name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('favorite_songs_user_id_idx').on(table.userId),
  chartIdIdx: index('favorite_songs_chart_id_idx').on(table.chartId),
  userChartSongUnique: unique('favorite_songs_user_chart_song_unique').on(
    table.userId, 
    table.chartId, 
    table.songPosition
  ),
}))

/**
 * User sessions table - stores authentication sessions
 */
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
  sessionTokenIdx: index('user_sessions_session_token_idx').on(table.sessionToken),
  sessionTokenUnique: unique('user_sessions_session_token_unique').on(table.sessionToken),
  expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt),
}))

/**
 * Chart snapshots table - stores historical chart data for caching and analytics
 */
export const chartSnapshots = pgTable('chart_snapshots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  chartId: varchar('chart_id', { length: 100 }).notNull(),
  chartData: jsonb('chart_data').notNull(),
  week: varchar('week', { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  chartIdIdx: index('chart_snapshots_chart_id_idx').on(table.chartId),
  weekIdx: index('chart_snapshots_week_idx').on(table.week),
  chartIdWeekUnique: unique('chart_snapshots_chart_id_week_unique').on(
    table.chartId, 
    table.week
  ),
}))

// Type exports for use in application code
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export type FavoriteSong = typeof favoriteSongs.$inferSelect
export type NewFavoriteSong = typeof favoriteSongs.$inferInsert

export type UserSession = typeof userSessions.$inferSelect
export type NewUserSession = typeof userSessions.$inferInsert

export type ChartSnapshot = typeof chartSnapshots.$inferSelect
export type NewChartSnapshot = typeof chartSnapshots.$inferInsert