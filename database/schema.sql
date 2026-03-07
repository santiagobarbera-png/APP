-- Dating App PostgreSQL Schema
-- Run this to initialize the database

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    birth_date  DATE,
    gender      VARCHAR(20),
    location_lat  DOUBLE PRECISION,
    location_lon  DOUBLE PRECISION,
    location_name VARCHAR(100),
    bio         TEXT,
    profile_photo_url TEXT,
    mbti_type   VARCHAR(4),
    openness        NUMERIC(5,2),
    conscientiousness NUMERIC(5,2),
    extraversion    NUMERIC(5,2),
    agreeableness   NUMERIC(5,2),
    neuroticism     NUMERIC(5,2),
    interests   TEXT[],
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email     ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_mbti_type ON users(mbti_type);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    min_age     INTEGER DEFAULT 18,
    max_age     INTEGER DEFAULT 99,
    preferred_genders TEXT[],
    max_distance_km INTEGER DEFAULT 100,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id                  SERIAL PRIMARY KEY,
    user_id_1           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    compatibility_score NUMERIC(5,2),
    mbti_score          NUMERIC(5,2),
    age_score           NUMERIC(5,2),
    distance_score      NUMERIC(5,2),
    interests_score     NUMERIC(5,2),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_perfect_match    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT matches_user_order CHECK (user_id_1 < user_id_2),
    CONSTRAINT matches_unique_pair UNIQUE (user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_id_1 ON matches(user_id_1);
CREATE INDEX IF NOT EXISTS idx_matches_user_id_2 ON matches(user_id_2);
CREATE INDEX IF NOT EXISTS idx_matches_status    ON matches(status);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id          SERIAL PRIMARY KEY,
    sender_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    data        JSONB,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    email_sent  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read  ON notifications(user_id, is_read);

-- Perfect matches queue table
CREATE TABLE IF NOT EXISTS perfect_matches_queue (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    match_user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    compatibility_score NUMERIC(5,2) NOT NULL,
    notification_sent   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT perfect_matches_unique UNIQUE (user_id, match_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pmq_user_id            ON perfect_matches_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_pmq_notification_sent  ON perfect_matches_queue(notification_sent);
