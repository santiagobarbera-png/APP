-- =============================================================
-- Dating App - Complete PostgreSQL Migration
-- Run this ONCE to set up your database
-- Usage: psql -U your_user -d your_database -f database/migration.sql
-- =============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for text search

-- =============================================================
-- USERS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login  TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================================
-- PROFILES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio             TEXT,
    age             INTEGER CHECK (age >= 18 AND age <= 120),
    gender          VARCHAR(20),
    looking_for     VARCHAR(20),
    mbti            VARCHAR(4),
    occupation      VARCHAR(100),
    education       VARCHAR(100),
    height          INTEGER,              -- in cm
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    city            VARCHAR(100),
    country         VARCHAR(100),
    photos          TEXT[],               -- array of photo URLs
    interests       TEXT[],               -- array of interest tags
    is_complete     BOOLEAN DEFAULT false,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_mbti ON profiles(mbti);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);

-- =============================================================
-- PREFERENCES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS preferences (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    min_age             INTEGER DEFAULT 18,
    max_age             INTEGER DEFAULT 99,
    preferred_gender    VARCHAR(20) DEFAULT 'any',
    max_distance_km     INTEGER DEFAULT 100,
    mbti_preferences    TEXT[],           -- preferred MBTI types
    interest_weights    JSONB DEFAULT '{}',
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);

-- =============================================================
-- MATCHES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS matches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user2_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user1_action    VARCHAR(10) DEFAULT 'pending',  -- 'like', 'pass', 'pending'
    user2_action    VARCHAR(10) DEFAULT 'pending',
    status          VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'matched', 'rejected'
    score           DECIMAL(5,2),                    -- compatibility score 0-100
    score_details   JSONB DEFAULT '{}',              -- breakdown of score
    matched_at      TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CONSTRAINT no_self_match CHECK (user1_id != user2_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);

-- =============================================================
-- MESSAGES TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    message_type    VARCHAR(20) DEFAULT 'text',  -- 'text', 'image', 'gif'
    is_read         BOOLEAN DEFAULT false,
    read_at         TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match_id ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- =============================================================
-- NOTIFICATIONS TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(50) NOT NULL,  -- 'new_match', 'new_message', 'perfect_match', 'like'
    title           VARCHAR(255) NOT NULL,
    body            TEXT NOT NULL,
    data            JSONB DEFAULT '{}',
    is_read         BOOLEAN DEFAULT false,
    email_sent      BOOLEAN DEFAULT false,
    email_sent_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications(email_sent) WHERE email_sent = false;

-- =============================================================
-- PERFECT MATCHES QUEUE TABLE
-- =============================================================
CREATE TABLE IF NOT EXISTS perfect_matches_queue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score           DECIMAL(5,2) NOT NULL,
    score_details   JSONB DEFAULT '{}',
    notification_sent BOOLEAN DEFAULT false,
    processed       BOOLEAN DEFAULT false,
    processed_at    TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, matched_user_id)
);

CREATE INDEX IF NOT EXISTS idx_pmq_user ON perfect_matches_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_pmq_unsent ON perfect_matches_queue(notification_sent) WHERE notification_sent = false;

-- =============================================================
-- TRIGGER: auto-update updated_at columns
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
    BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- TRIGGER: create profile + preferences after user insert
-- =============================================================
CREATE OR REPLACE FUNCTION create_user_profile_and_prefs()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    INSERT INTO preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_user_insert
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile_and_prefs();

-- Migration complete
SELECT 'Migration completed successfully!' AS status;
