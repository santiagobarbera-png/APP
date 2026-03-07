#!/usr/bin/env node
/**
 * Script: findPerfectMatches.js
 * Purpose: Find perfect matches for ALL active users using the AI matching algorithm
 * Schedule: Runs daily at 2 AM UTC via GitHub Actions
 * Usage: node scripts/findPerfectMatches.js
 */

'use strict';

require('dotenv').config();
const pool = require('../backend/config/database');
const { rankCandidates } = require('../backend/services/aiMatchingService');
const PerfectMatchQueue = require('../backend/models/PerfectMatchQueue');
const Notification = require('../backend/models/Notification');

async function main() {
    console.log('🔍 Starting Perfect Matches AI Algorithm...');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Get all active users with complete profiles
    const { rows: users } = await pool.query(`
        SELECT u.id, u.name, u.email,
               p.age, p.gender, p.mbti, p.latitude, p.longitude, p.interests, p.looking_for
        FROM users u
        JOIN profiles p ON p.user_id = u.id
        WHERE u.is_active = true AND p.is_complete = true
    `);

    console.log(`👥 Found ${users.length} active users with complete profiles`);

    if (users.length < 2) {
        console.log('ℹ️  Not enough users to match. Exiting.');
        await pool.end();
        return;
    }

    let totalMatches = 0;
    let processedUsers = 0;

    for (const user of users) {
        try {
            // Get user preferences
            const { rows: prefRows } = await pool.query(
                'SELECT * FROM preferences WHERE user_id = $1',
                [user.id]
            );
            const preferences = prefRows[0] || {};

            // Filter candidates by gender preference
            const candidates = users.filter(u => {
                if (u.id === user.id) return false; // Skip self
                if (preferences.preferred_gender && preferences.preferred_gender !== 'any') {
                    return u.gender === preferences.preferred_gender;
                }
                return true;
            });

            // Rank candidates using AI algorithm (only returns scores >= 60)
            const rankedMatches = rankCandidates(user, candidates, preferences);

            // Take top 5 perfect matches
            const topMatches = rankedMatches.slice(0, 5);

            for (const match of topMatches) {
                await PerfectMatchQueue.upsert({
                    userId: user.id,
                    matchedUserId: match.userId,
                    score: match.score,
                    scoreDetails: match.scoreDetails,
                });
                totalMatches++;
            }

            processedUsers++;
            if (processedUsers % 10 === 0) {
                console.log(`  Processed ${processedUsers}/${users.length} users...`);
            }
        } catch (err) {
            console.error(`  ❌ Error processing user ${user.id}:`, err.message);
        }
    }

    console.log(`\n📊 Results:`);
    console.log(`   Users processed: ${processedUsers}`);
    console.log(`   Perfect matches queued: ${totalMatches}`);
    console.log(`\n✅ Perfect Matches processing complete!`);
    console.log(`📅 Next run: tomorrow at 2 AM UTC`);

    await pool.end();
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    pool.end().finally(() => process.exit(1));
});
