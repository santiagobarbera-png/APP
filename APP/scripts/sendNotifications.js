/**
 * Script to send notifications to users with new Perfect Matches
 * Runs after findPerfectMatches.js
 */

'use strict';

require('dotenv').config();

const pool = require('../../backend/config/database');
const NotificationService = require('../../backend/services/notificationService');

async function main() {
    console.log('📧 Starting notification sending...');
    console.log('⏰ Timestamp:', new Date().toISOString());

    try {
        const result = await pool.query(`
            SELECT pmq.*, u.name as match_user_name
            FROM perfect_matches_queue pmq
            JOIN users u ON u.id = pmq.match_user_id
            WHERE pmq.notification_sent = FALSE
            ORDER BY pmq.created_at DESC
            LIMIT 100
        `);

        const pendingMatches = result.rows;
        console.log(`📊 Found ${pendingMatches.length} pending notifications`);

        let sent = 0;
        for (const match of pendingMatches) {
            try {
                await NotificationService.sendPerfectMatchNotification(
                    match.user_id,
                    match.match_user_id,
                    match.compatibility_score
                );
                await pool.query(
                    'UPDATE perfect_matches_queue SET notification_sent = TRUE WHERE id = $1',
                    [match.id]
                );
                sent++;
            } catch (err) {
                console.error(`Error sending notification for match ${match.id}:`, err.message);
            }
        }

        console.log(`✅ Sent ${sent} notifications successfully`);
    } catch (error) {
        console.error('❌ Error sending notifications:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
