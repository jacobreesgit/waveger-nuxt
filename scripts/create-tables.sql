-- Create tables for Waveger application
-- This script will create all necessary tables if they don't exist

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email varchar(255) NOT NULL UNIQUE,
    name varchar(255) NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS users_email_idx ON users USING btree (email);

-- Favorite songs table
CREATE TABLE IF NOT EXISTS favorite_songs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    song_position integer NOT NULL,
    chart_id varchar(100) NOT NULL,
    song_name varchar(255) NOT NULL,
    artist_name varchar(255) NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT favorite_songs_user_chart_song_unique UNIQUE(user_id, chart_id, song_position)
);

-- Create indexes for favorite_songs table
CREATE INDEX IF NOT EXISTS favorite_songs_user_id_idx ON favorite_songs USING btree (user_id);
CREATE INDEX IF NOT EXISTS favorite_songs_chart_id_idx ON favorite_songs USING btree (chart_id);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    session_token varchar(255) NOT NULL UNIQUE,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
);

-- Create indexes for user_sessions table
CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_session_token_idx ON user_sessions USING btree (session_token);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions USING btree (expires_at);

-- Chart snapshots table
CREATE TABLE IF NOT EXISTS chart_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chart_id varchar(100) NOT NULL,
    chart_data jsonb NOT NULL,
    week varchar(10) NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    CONSTRAINT chart_snapshots_chart_id_week_unique UNIQUE(chart_id, week)
);

-- Create indexes for chart_snapshots table
CREATE INDEX IF NOT EXISTS chart_snapshots_chart_id_idx ON chart_snapshots USING btree (chart_id);
CREATE INDEX IF NOT EXISTS chart_snapshots_week_idx ON chart_snapshots USING btree (week);

-- Add foreign key constraints
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'favorite_songs_user_id_users_id_fk') THEN
        ALTER TABLE favorite_songs 
        ADD CONSTRAINT favorite_songs_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_sessions_user_id_users_id_fk') THEN
        ALTER TABLE user_sessions 
        ADD CONSTRAINT user_sessions_user_id_users_id_fk 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade;
    END IF;
END $$;