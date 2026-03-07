/**
 * Script to run the Perfect Matches AI Algorithm
 * Runs automatically every 24 hours via GitHub Actions
 */

'use strict';

require('dotenv').config();

const pool = require('../../backend/config/database');
const { findPerfectMatchesForAllUsers } = require('../../backend/services/aiMatchingService');
const config = require('../../backend/config');

async function main() {
    console.log('🔍 Starting Perfect Matches search...');
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
        const result = await pool.query(`
            SELECT u.*, up.min_age, up.max_age, up.preferred_genders, up.max_distance_km
            FROM users u
            LEFT JOIN user_preferences up ON u.id = up.user_id
            WHERE u.is_active = TRUE
            AND u.mbti_type IS NOT NULL
        `);

        const users = result.rows;
        console.log(`📊 Found ${users.length} active users with profiles`);

        if (users.length < 2) {
            console.log('ℹ️  Not enough users for matching');
            process.exit(0);
        }

        const matches = findPerfectMatchesForAllUsers(users, config.app.perfectMatchThreshold);

        let saved = 0;
        for (const match of matches) {
            try {
                await pool.query(`
                    INSERT INTO perfect_matches_queue (user_id, match_user_id, compatibility_score)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user_id, match_user_id) DO UPDATE
                    SET compatibility_score = EXCLUDED.compatibility_score
                `, [match.userId, match.matchUserId, match.score]);
                saved++;
            } catch (err) {
                console.error(`Error saving match for user ${match.userId}:`, err.message);
            }
        }

        console.log(`✅ Saved ${saved} perfect matches`);
        console.log('📅 Next run: tomorrow at 2 AM UTC');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
