import cron from 'node-cron';
import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let bot: TelegramBot | null = null;

/**
 * Find events that are happening in exactly N days from now
 */
async function findUpcomingEvents(daysAhead: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(targetDate.getDate() + daysAhead);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    console.log(`[NOTIFICATIONS] Checking for events on ${targetDate.toISOString().split('T')[0]} (${daysAhead} days ahead)`);

    const events = await prisma.event.findMany({
        where: {
            date: {
                gte: targetDate.toISOString(),
                lt: nextDay.toISOString()
            }
        },
        include: {
            group: true
        }
    });

    return events;
}

/**
 * Send reminder notification to group members
 */
async function sendEventReminder(event: any, daysLeft: number) {
    if (!bot) {
        console.log('[NOTIFICATIONS] Bot not initialized');
        return;
    }

    const { group, beneficiaryId, title } = event;

    if (!group || !group.members) {
        console.log(`[NOTIFICATIONS] Event ${event.id} has no group or members`);
        return;
    }

    // Get beneficiary name
    let beneficiaryName = 'участника';
    if (beneficiaryId) {
        const beneficiary = await prisma.user.findUnique({
            where: { id: beneficiaryId }
        });
        if (beneficiary) {
            beneficiaryName = beneficiary.name;
        }
    }

    // Prepare message
    let message = '';
    if (daysLeft === 14) {
        message = `🎂 Напоминание: через 2 недели ${title}!\n\n`;
    } else if (daysLeft === 7) {
        message = `🎉 Напоминание: через неделю ${title}!\n\n`;
    } else if (daysLeft === 1) {
        message = `🎁 Завтра ${title}! Не забудьте поздравить ${beneficiaryName}!\n\n`;
    }

    if (beneficiaryId) {
        message += `Именинник: ${beneficiaryName}\n`;
    }
    message += `Дата: ${new Date(event.date).toLocaleDateString('ru-RU')}\n`;
    message += `Комната: ${group.title}`;

    // Send to all group members except beneficiary
    let sentCount = 0;
    for (const memberId of group.members) {
        if (memberId === beneficiaryId) continue; // Don't spoil the surprise!

        const user = await prisma.user.findUnique({
            where: { id: memberId }
        });

        if (user && user.telegramId) {
            try {
                await bot.sendMessage(user.telegramId, message);
                sentCount++;
                console.log(`[NOTIFICATIONS] Sent reminder to ${user.name} (${user.telegramId})`);
            } catch (error) {
                console.error(`[NOTIFICATIONS] Failed to send to ${user.name}:`, error);
            }
        }
    }

    console.log(`[NOTIFICATIONS] Sent ${sentCount} reminders for event "${title}"`);
}

/**
 * Check and send notifications for all upcoming events
 */
async function checkAndSendNotifications() {
    console.log('[NOTIFICATIONS] Starting daily check...');

    try {
        // Check for events in 14, 7, and 1 day
        const intervals = [14, 7, 1];

        for (const days of intervals) {
            const events = await findUpcomingEvents(days);
            console.log(`[NOTIFICATIONS] Found ${events.length} events in ${days} days`);

            for (const event of events) {
                await sendEventReminder(event, days);
            }
        }

        console.log('[NOTIFICATIONS] Daily check completed');
    } catch (error) {
        console.error('[NOTIFICATIONS] Error during check:', error);
    }
}

/**
 * Initialize notification service
 */
export function initNotificationService() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
        console.warn('[NOTIFICATIONS] TELEGRAM_BOT_TOKEN not set, notifications disabled');
        return;
    }

    try {
        bot = new TelegramBot(botToken, { polling: false });
        console.log('[NOTIFICATIONS] Service initialized');

        // Schedule daily check at 10:00 AM
        cron.schedule('0 10 * * *', () => {
            console.log('[NOTIFICATIONS] Running scheduled check at 10:00 AM');
            checkAndSendNotifications();
        });

        // Run immediately on startup for testing
        console.log('[NOTIFICATIONS] Running initial check...');
        checkAndSendNotifications();
    } catch (error) {
        console.error('[NOTIFICATIONS] Failed to initialize bot:', error);
    }
}

// Export for manual testing
export { checkAndSendNotifications, findUpcomingEvents, sendEventReminder };
