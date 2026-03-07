#!/usr/bin/env node
/**
 * Script: sendNotifications.js
 * Purpose: Send queued perfect match notifications to users (email + in-app)
 * Schedule: Runs daily after findPerfectMatches.js via GitHub Actions
 * Usage: node scripts/sendNotifications.js
 */

'use strict';

require('dotenv').config();
const pool = require('../backend/config/database');
const PerfectMatchQueue = require('../backend/models/PerfectMatchQueue');
const notificationService = require('../backend/services/notificationService');

async function main() {
    console.log('📧 Starting Notification Sender...');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Get all unsent perfect match notifications
    const unsent = await PerfectMatchQueue.findAllUnsent(500);
    console.log(`📬 Found ${unsent.length} notifications to send`);

    if (unsent.length === 0) {
        console.log('✅ No notifications to send. Exiting.');
        await pool.end();
        return;
    }

    let inAppSent = 0;
    let inAppFailed = 0;
    const processedIds = [];

    // Create in-app notifications
    for (const item of unsent) {
        try {
            await notificationService.notifyPerfectMatch(
                item.user_id,
                item.matched_user_name,
                item.score,
                item.matched_user_id
            );
            processedIds.push(item.id);
            inAppSent++;
        } catch (err) {
            console.error(`  ❌ Failed to create notification for user ${item.user_id}:`, err.message);
            inAppFailed++;
        }
    }

    // Mark as processed in queue
    if (processedIds.length > 0) {
        await PerfectMatchQueue.markNotificationSent(processedIds);
    }

    // Send email notifications
    console.log('\n📮 Sending email notifications...');
    const emailResult = await notificationService.sendPendingEmails();

    console.log(`\n📊 Results:`);
    console.log(`   In-app notifications sent: ${inAppSent}`);
    console.log(`   In-app notifications failed: ${inAppFailed}`);
    console.log(`   Emails sent: ${emailResult.sent}`);
    console.log(`   Emails failed: ${emailResult.failed}`);
    console.log(`\n✅ Notifications processing complete!`);

    await pool.end();
}

main().catch(err => {
    console.error('❌ Fatal error:', err);
    pool.end().finally(() => process.exit(1));
});
