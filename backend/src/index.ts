import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { initNotificationService } from './services/notificationService';

dotenv.config();

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const ADMIN_IDS = [414153884, 123456];

const generateShortId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// --- Auth ---
app.post('/api/auth', async (req, res) => {
    const { id, first_name, last_name, username, photo_url } = req.body;
    console.log(`[AUTH] Attempting login for user: ${id} (${username})`);

    try {
        const telegramId = BigInt(id);
        const isAdmin = ADMIN_IDS.includes(Number(id));
        console.log(`[AUTH] User ${id} is admin: ${isAdmin}`);

        const user = await prisma.user.upsert({
            where: { telegramId },
            update: {
                name: [first_name, last_name].filter(Boolean).join(' '),
                username,
                avatarUrl: photo_url,
                isAdmin: isAdmin ? true : undefined
            },
            create: {
                telegramId,
                name: [first_name, last_name].filter(Boolean).join(' '),
                username,
                avatarUrl: photo_url,
                isAdmin
            }
        });

        console.log(`[AUTH] Login successful for user: ${user.id}`);

        // Сериализация BigInt
        const userJson = JSON.parse(JSON.stringify(user, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(userJson);
    } catch (error) {
        console.error('[AUTH] Login failed:', error);
        res.status(500).json({ error: 'Auth failed' });
    }
});

app.patch('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { birthday } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id },
            data: { birthday }
        });

        // Auto-create birthday events if birthday is set
        if (birthday) {
            try {
                // 1. Find all groups the user is a member of
                const memberships = await prisma.groupMember.findMany({
                    where: { userId: id },
                    select: { groupId: true }
                });

                // 2. Calculate next birthday date
                const bday = new Date(birthday);
                const today = new Date();
                // Create date for this year
                let nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                // If already passed this year, move to next year
                if (nextBday < today) {
                    nextBday.setFullYear(today.getFullYear() + 1);
                }

                // Adjust to UTC to avoid timezone shifts when saving to DB if needed, 
                // but our app seems to use ISO strings. Let's keep it simple.
                const eventDate = nextBday.toISOString();

                // 3. Create event in each group if not exists
                for (const m of memberships) {
                    // Check if birthday event already exists for this user in this group around this date
                    // We check for events where beneficiaryId is this user
                    const existingEvent = await prisma.event.findFirst({
                        where: {
                            groupId: m.groupId,
                            beneficiaryId: id,
                            // Check if event is within same year of nextBday
                            date: {
                                contains: nextBday.getFullYear().toString()
                            }
                        }
                    });

                    if (!existingEvent) {
                        console.log(`[AUTO-EVENT] Creating birthday event for ${user.name} in group ${m.groupId}`);
                        await prisma.event.create({
                            data: {
                                id: crypto.randomUUID(),
                                groupId: m.groupId,
                                title: `День рождения ${user.name.split(' ')[0]}`,
                                date: eventDate,
                                beneficiaryId: id,
                                targetAmount: 0,
                                currency: 'RUB',
                                creatorId: id
                                // NOTE: Beneficiary is NOT added as participant
                                // so they don't see their own birthday event
                            }
                        });
                    }
                }
            } catch (err) {
                console.error('[AUTO-EVENT] Failed to create birthday events:', err);
                // Don't fail the request if auto-event creation fails
            }
        }

        const userJson = JSON.parse(JSON.stringify(user, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(userJson);
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: 'Update failed' });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user) return res.status(404).json({ error: 'Not found' });
        const userJson = JSON.parse(JSON.stringify(user, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(userJson);
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// --- Groups ---
app.post('/api/groups', async (req, res) => {
    const { userId, title, password, description } = req.body;
    try {
        let shortId = generateShortId();
        let exists = await prisma.group.findUnique({ where: { id: shortId } });
        while (exists) {
            shortId = generateShortId();
            exists = await prisma.group.findUnique({ where: { id: shortId } });
        }

        const group = await prisma.group.create({
            data: {
                id: shortId,
                title,
                password,
                description,
                creatorId: userId,
                members: { create: { userId } }
            }
        });

        // Auto-create birthday event for creator if they have birthday
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user?.birthday) {
                console.log(`[AUTO-EVENT] Creator ${user.name} created group ${shortId}, creating birthday event...`);

                const birthdayDate = new Date(user.birthday);
                const today = new Date();
                const currentYear = today.getFullYear();

                let eventDate = new Date(currentYear, birthdayDate.getMonth(), birthdayDate.getDate());
                if (eventDate < today) {
                    eventDate = new Date(currentYear + 1, birthdayDate.getMonth(), birthdayDate.getDate());
                }

                await prisma.event.create({
                    data: {
                        id: crypto.randomUUID(),
                        groupId: shortId,
                        title: `День рождения ${user.name.split(' ')[0]}`,
                        date: eventDate.toISOString(),
                        beneficiaryId: userId,
                        targetAmount: 0,
                        currency: 'RUB',
                        creatorId: userId
                    }
                });
                console.log(`[AUTO-EVENT] Birthday event created for creator ${user.name}`);
            }
        } catch (e) {
            console.error('[AUTO-EVENT] Failed to create birthday event for creator:', e);
            // Don't fail group creation if event creation fails
        }

        res.json({ ...group, members: [userId] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Create group failed' });
    }
});

app.post('/api/groups/join', async (req, res) => {
    const { groupId, userId, password } = req.body;
    const normalizedGroupId = groupId.trim().toUpperCase();

    try {
        const group = await prisma.group.findUnique({
            where: { id: normalizedGroupId },
            include: { members: true }
        });

        if (!group) return res.status(404).json({ success: false, message: 'Комната не найдена' });
        if (group.password !== password) return res.status(403).json({ success: false, message: 'Неверный пароль' });

        const isMember = group.members.some(m => m.userId === userId);
        if (!isMember) {
            await prisma.groupMember.create({
                data: { groupId: normalizedGroupId, userId }
            });

            // Auto-create birthday event if user has birthday
            try {
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user?.birthday) {
                    console.log(`[AUTO-EVENT] User ${user.name} joined group ${normalizedGroupId}, checking birthday event...`);

                    const birthdayDate = new Date(user.birthday);
                    const today = new Date();
                    const currentYear = today.getFullYear();

                    let eventDate = new Date(currentYear, birthdayDate.getMonth(), birthdayDate.getDate());
                    if (eventDate < today) {
                        eventDate = new Date(currentYear + 1, birthdayDate.getMonth(), birthdayDate.getDate());
                    }

                    const existingEvent = await prisma.event.findFirst({
                        where: {
                            groupId: normalizedGroupId,
                            beneficiaryId: userId,
                            date: {
                                gte: new Date(currentYear, 0, 1).toISOString(),
                                lt: new Date(currentYear + 1, 0, 1).toISOString()
                            }
                        }
                    });

                    if (!existingEvent) {
                        console.log(`[AUTO-EVENT] Creating birthday event for ${user.name} in group ${normalizedGroupId}`);
                        await prisma.event.create({
                            data: {
                                id: crypto.randomUUID(),
                                groupId: normalizedGroupId,
                                title: `День рождения ${user.name.split(' ')[0]}`,
                                date: eventDate.toISOString(),
                                beneficiaryId: userId,
                                targetAmount: 0,
                                currency: 'RUB',
                                creatorId: userId
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('[AUTO-EVENT] Failed to create birthday event on join:', e);
                // Don't fail the join request if event creation fails
            }
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ success: false, message: 'Error joining' });
    }
});

app.get('/api/groups/user/:userId', async (req, res) => {
    try {
        const members = await prisma.groupMember.findMany({
            where: { userId: req.params.userId },
            include: { group: { include: { members: true } } }
        });
        const formatted = members.map(m => ({
            ...m.group,
            members: m.group.members.map(gm => gm.userId)
        }));
        res.json(formatted);
    } catch (e) { res.status(500).json({ error: 'Fetch error' }); }
});

app.get('/api/groups/:id', async (req, res) => {
    try {
        const group = await prisma.group.findUnique({
            where: { id: req.params.id },
            include: { members: true }
        });
        if (!group) return res.status(404).json(null);
        res.json({ ...group, members: group.members.map(m => m.userId) });
    } catch (e) { res.status(500).json(null); }
});

app.patch('/api/groups/:id', async (req, res) => {
    const { userId, title, password } = req.body;
    try {
        const group = await prisma.group.findUnique({ where: { id: req.params.id } });
        if (!group || group.creatorId !== userId) return res.status(403).json({ error: 'Forbidden' });

        const updated = await prisma.group.update({
            where: { id: req.params.id },
            data: { title, password }
        });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Update failed' }); }
});

// Leave group
app.post('/api/groups/:id/leave', async (req, res) => {
    const { userId } = req.body;
    try {
        const group = await prisma.group.findUnique({
            where: { id: req.params.id },
            include: { members: true }
        });
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // If host is leaving
        if (group.creatorId === userId) {
            // Find other members
            const otherMembers = group.members.filter(m => m.userId !== userId);

            if (otherMembers.length > 0) {
                // Transfer ownership to the oldest member (first in list usually, or sort by createdAt if needed)
                // Assuming default sort is insertion order or we pick the first one
                const newHost = otherMembers[0];

                await prisma.group.update({
                    where: { id: group.id },
                    data: { creatorId: newHost.userId }
                });

                console.log(`[LEAVE_GROUP] Host left. Ownership transferred to ${newHost.userId}`);
            } else {
                // No other members, delete the group
                console.log('[LEAVE_GROUP] Host left and no members remain. Deleting group.');

                // Reuse delete logic (duplicate here for safety/simplicity within transaction context if we had one)
                // Delete members
                await prisma.groupMember.deleteMany({ where: { groupId: req.params.id } });

                // Delete events
                const events = await prisma.event.findMany({ where: { groupId: req.params.id } });
                for (const event of events) {
                    await prisma.eventParticipant.deleteMany({ where: { eventId: event.id } });
                    await prisma.contribution.deleteMany({ where: { eventId: event.id } });
                }
                await prisma.event.deleteMany({ where: { groupId: req.params.id } });

                // Delete Santa rooms
                const santaRooms = await prisma.santaRoom.findMany({ where: { groupId: req.params.id } });
                for (const room of santaRooms) {
                    await prisma.santaParticipant.deleteMany({ where: { roomId: room.id } });
                }
                await prisma.santaRoom.deleteMany({ where: { groupId: req.params.id } });

                // Delete group
                await prisma.group.delete({ where: { id: req.params.id } });

                return res.json({ success: true, message: 'Group deleted as last member left' });
            }
        }

        // Remove user from group members (for both host and regular users)
        // If group was deleted above, this line won't be reached or will throw/do nothing? 
        // Wait, if group deleted, we returned. If ownership transferred, we still need to remove the old host from members.

        await prisma.groupMember.deleteMany({
            where: {
                groupId: req.params.id,
                userId
            }
        });

        res.json({ success: true });
    } catch (e) {
        console.error('[LEAVE_GROUP] Error:', e);
        res.status(500).json({ error: 'Leave group failed' });
    }
});

// Delete group (host only)
app.delete('/api/groups/:id', async (req, res) => {
    const { userId } = req.query;
    try {
        const group = await prisma.group.findUnique({ where: { id: req.params.id } });
        if (!group) return res.status(404).json({ error: 'Group not found' });

        // Only host can delete
        if (group.creatorId !== userId) {
            return res.status(403).json({ error: 'Only host can delete the group' });
        }

        // Delete all related data (Prisma will handle cascading deletes based on schema)
        // First delete group members
        await prisma.groupMember.deleteMany({ where: { groupId: req.params.id } });

        // Delete all events and their related data
        const events = await prisma.event.findMany({ where: { groupId: req.params.id } });
        for (const event of events) {
            await prisma.eventParticipant.deleteMany({ where: { eventId: event.id } });
            await prisma.contribution.deleteMany({ where: { eventId: event.id } });
        }
        await prisma.event.deleteMany({ where: { groupId: req.params.id } });

        // Delete all Santa rooms
        const santaRooms = await prisma.santaRoom.findMany({ where: { groupId: req.params.id } });
        for (const room of santaRooms) {
            await prisma.santaParticipant.deleteMany({ where: { roomId: room.id } });
        }
        await prisma.santaRoom.deleteMany({ where: { groupId: req.params.id } });

        // Finally delete the group
        await prisma.group.delete({ where: { id: req.params.id } });

        res.json({ success: true });
    } catch (e) {
        console.error('[DELETE_GROUP] Error:', e);
        res.status(500).json({ error: 'Delete group failed' });
    }
});

// --- Events ---
app.post('/api/events', async (req, res) => {
    try {
        const event = await prisma.event.create({
            data: {
                groupId: req.body.groupId,
                title: req.body.title,
                date: req.body.date,
                targetAmount: req.body.targetAmount,
                currency: 'RUB',
                creatorId: req.body.creatorId,
                beneficiaryId: req.body.beneficiaryId,
                participants: {
                    create: { userId: req.body.creatorId, status: 'JOINED' }
                }
            }
        });
        res.json(event);
    } catch (e) { res.status(500).json({ error: 'Create event failed' }); }
});

// Delete event (host only)
app.delete('/api/events/:id', async (req, res) => {
    const { userId } = req.query;
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: { group: true }
        });

        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Only group host can delete events
        if (event.group.creatorId !== userId) {
            return res.status(403).json({ error: 'Only group host can delete events' });
        }

        // Delete all related data
        await prisma.eventParticipant.deleteMany({ where: { eventId: req.params.id } });
        await prisma.contribution.deleteMany({ where: { eventId: req.params.id } });

        // Unbook any wishlist items that were booked for this event
        await prisma.wishlistItem.updateMany({
            where: { bookedForEventId: req.params.id },
            data: { isBooked: false, bookedBy: null, bookedForEventId: null, bookingMode: null }
        });

        // Delete the event
        await prisma.event.delete({ where: { id: req.params.id } });

        res.json({ success: true });
    } catch (e) {
        console.error('[DELETE_EVENT] Error:', e);
        res.status(500).json({ error: 'Delete event failed' });
    }
});

app.get('/api/groups/:id/events', async (req, res) => {
    try {
        const { userId } = req.query; // Get current user ID from query

        const events = await prisma.event.findMany({
            where: {
                groupId: req.params.id
                // Removed filter: Now beneficiaries CAN see their own events
                // Frontend will show magic modal when they try to access it
            },
            include: { participants: true, contributions: true, wishlistBookings: true }
        });

        // Sort events by proximity to today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sortedEvents = events.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            // Calculate days difference from today
            const diffA = Math.abs(dateA.getTime() - today.getTime());
            const diffB = Math.abs(dateB.getTime() - today.getTime());

            // Prioritize upcoming events (future dates)
            const isUpcomingA = dateA >= today;
            const isUpcomingB = dateB >= today;

            // console.log(`Comparing ${a.title} (${a.date}) vs ${b.title} (${b.date})`);
            // console.log(`Upcoming: ${isUpcomingA} vs ${isUpcomingB}, Diff: ${diffA} vs ${diffB}`);

            if (isUpcomingA && !isUpcomingB) return -1; // A is upcoming, B is past
            if (!isUpcomingA && isUpcomingB) return 1;  // B is upcoming, A is past

            // If both are upcoming, sort by date ascending (closest first)
            if (isUpcomingA && isUpcomingB) return dateA.getTime() - dateB.getTime();

            // If both are past, sort by date descending (most recent past first)
            return dateB.getTime() - dateA.getTime();
        });

        res.json(sortedEvents);
    } catch (e) { res.status(500).json({ error: 'Fetch failed' }); }
});

app.post('/api/events/:id/contribute', async (req, res) => {
    const { userId, amount } = req.body;
    try {
        // Ensure participant exists
        const participant = await prisma.eventParticipant.findUnique({
            where: { eventId_userId: { eventId: req.params.id, userId } }
        });

        if (!participant) {
            await prisma.eventParticipant.create({
                data: { eventId: req.params.id, userId, paidAmount: 0 }
            });
        }

        await prisma.contribution.create({
            data: { eventId: req.params.id, userId, amount, status: 'PENDING' }
        });

        const updatedEvent = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: { participants: true, contributions: true, wishlistBookings: true }
        });
        res.json(updatedEvent);
    } catch (e) { res.status(500).json({ error: 'Contribution failed' }); }
});


app.post('/api/events/:id/contributions/:contributionId/confirm', async (req, res) => {
    try {
        const contribution = await prisma.contribution.findUnique({
            where: { id: req.params.contributionId }
        });

        if (!contribution || contribution.status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid contribution' });
        }

        // Update contribution status
        await prisma.contribution.update({
            where: { id: req.params.contributionId },
            data: { status: 'CONFIRMED' }
        });

        // Update participant paid amount
        const participant = await prisma.eventParticipant.findUnique({
            where: { eventId_userId: { eventId: req.params.id, userId: contribution.userId } }
        });

        if (participant) {
            await prisma.eventParticipant.update({
                where: { id: participant.id },
                data: { paidAmount: participant.paidAmount + contribution.amount }
            });
        }

        const updatedEvent = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: { participants: true, contributions: true, wishlistBookings: true }
        });
        res.json(updatedEvent);
    } catch (e) { res.status(500).json({ error: 'Confirmation failed' }); }
});

app.post('/api/events/:id/contributions/:contributionId/reject', async (req, res) => {
    try {
        await prisma.contribution.update({
            where: { id: req.params.contributionId },
            data: { status: 'REJECTED' }
        });

        const updatedEvent = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: { participants: true, contributions: true, wishlistBookings: true }
        });
        res.json(updatedEvent);
    } catch (e) { res.status(500).json({ error: 'Rejection failed' }); }
});

// Toggle event participation
app.post('/api/events/:id/participate', async (req, res) => {
    const { userId } = req.body;
    try {
        const participant = await prisma.eventParticipant.findUnique({
            where: { eventId_userId: { eventId: req.params.id, userId } }
        });

        if (participant) {
            // Toggle status between JOINED and DECLINED
            const newStatus = participant.status === 'JOINED' ? 'DECLINED' : 'JOINED';
            await prisma.eventParticipant.update({
                where: { id: participant.id },
                data: { status: newStatus }
            });
        } else {
            // Create new participant with JOINED status
            await prisma.eventParticipant.create({
                data: { eventId: req.params.id, userId, status: 'JOINED' }
            });
        }

        const updatedEvent = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: { participants: true }
        });
        res.json(updatedEvent);
    } catch (e) {
        console.error('[PARTICIPATE] Toggle failed:', e);
        res.status(500).json({ error: 'Participation toggle failed' });
    }
});

// Update payment info (first-come-first-served)
app.put('/api/events/:id/payment-info', async (req, res) => {
    const { paymentInfo, userId } = req.body;
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: { group: true }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // If payment info is already set, only the person who set it can edit it
        if (event.paymentInfoSetBy && event.paymentInfoSetBy !== userId) {
            return res.status(403).json({ error: 'Only the person who set payment info can edit it' });
        }

        // Update payment info and set the user who is setting it
        const updatedEvent = await prisma.event.update({
            where: { id: req.params.id },
            data: {
                paymentInfo,
                paymentInfoSetBy: userId // Track who set it
            },
            include: { participants: true, contributions: true, wishlistBookings: true }
        });

        res.json(updatedEvent);
    } catch (e) {
        console.error('[PAYMENT_INFO] Update failed:', e);
        res.status(500).json({ error: 'Payment info update failed' });
    }
});

// --- Wishlists ---
app.get('/api/wishlists/:userId', async (req, res) => {
    try {
        const items = await prisma.wishlistItem.findMany({ where: { userId: req.params.userId } });
        res.json(items);
    } catch (e) { res.status(500).json([]); }
});

// --- Wishlist in Events ---

// Get wishlist for event's beneficiary
app.get('/api/events/:eventId/wishlist', async (req, res) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            select: { beneficiaryId: true }
        });

        if (!event || !event.beneficiaryId) {
            return res.status(404).json({ error: 'Event or beneficiary not found' });
        }

        // Get beneficiary's wishlist items
        const items = await prisma.wishlistItem.findMany({
            where: { userId: event.beneficiaryId },
            orderBy: { createdAt: 'asc' }
        });

        res.json(items);
    } catch (e) {
        console.error('[WISHLIST] Get event wishlist failed:', e);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});

// Book wishlist item individually
app.post('/api/events/:eventId/wishlist/:itemId/book', async (req, res) => {
    const { userId } = req.body;

    try {
        const item = await prisma.wishlistItem.findUnique({
            where: { id: req.params.itemId }
        });

        if (!item) return res.status(404).json({ error: 'Item not found' });
        if (item.isBooked) return res.status(400).json({ error: 'Item already booked' });

        const updated = await prisma.wishlistItem.update({
            where: { id: req.params.itemId },
            data: {
                isBooked: true,
                bookedBy: userId,
                bookedForEventId: req.params.eventId,
                bookingMode: 'INDIVIDUAL'
            }
        });

        res.json(updated);
    } catch (e) {
        console.error('[WISHLIST] Book item failed:', e);
        res.status(500).json({ error: 'Booking failed' });
    }
});

// Create group funding for wishlist item
app.post('/api/events/:eventId/wishlist/:itemId/fund', async (req, res) => {
    const { userId } = req.body;

    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: { group: true }
        });

        if (!event) {
            console.error('[FUND] Event not found:', req.params.eventId);
            return res.status(404).json({ error: 'Event not found' });
        }

        const item = await prisma.wishlistItem.findUnique({
            where: { id: req.params.itemId }
        });

        if (!item) {
            console.error('[FUND] Item not found:', req.params.itemId);
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.isBooked) {
            console.error('[FUND] Item already booked:', req.params.itemId);
            return res.status(400).json({ error: 'Item already booked' });
        }

        // Update wishlist item
        await prisma.wishlistItem.update({
            where: { id: req.params.itemId },
            data: {
                isBooked: true,
                bookedBy: userId,
                bookedForEventId: req.params.eventId,
                bookingMode: 'GROUP_FUNDING'
            }
        });

        // Update event with target amount (use item price if available, otherwise keep current or set to 0)
        // Host can manually update the target amount later if price is not set
        const newTargetAmount = item.price ? item.price : (event.targetAmount || 0);
        const updatedEvent = await prisma.event.update({
            where: { id: req.params.eventId },
            data: { targetAmount: newTargetAmount },
            include: {
                participants: true,
                contributions: true,
                wishlistBookings: true
            }
        });

        console.log('[FUND] Success:', { eventId: req.params.eventId, itemId: req.params.itemId });
        res.json(updatedEvent);
    } catch (e) {
        console.error('[WISHLIST] Create group funding failed:', e);
        res.status(500).json({ error: 'Group funding creation failed' });
    }
});

// Create manual fund item
app.post('/api/events/:eventId/manual-fund-item', async (req, res) => {
    const { userId, title, url, imageUrl, price } = req.body;

    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: { group: true }
        });

        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Create new wishlist item
        const item = await prisma.wishlistItem.create({
            data: {
                userId: event.beneficiaryId || userId, // Assign to beneficiary or creator
                title,
                url,
                imageUrl,
                price: price ? parseFloat(price) : null,
                isBooked: true,
                bookedBy: userId,
                bookedForEventId: req.params.eventId,
                bookingMode: 'GROUP_FUNDING'
            }
        });

        // Update event target amount if price is provided
        // If price is not provided, target amount remains unchanged (host sets it manually)
        let newTargetAmount = event.targetAmount;
        if (price) {
            newTargetAmount += parseFloat(price);
        }

        const updatedEvent = await prisma.event.update({
            where: { id: req.params.eventId },
            data: { targetAmount: newTargetAmount },
            include: {
                participants: true,
                contributions: true,
                wishlistBookings: true
            }
        });

        res.json(updatedEvent);
    } catch (e) {
        console.error('[MANUAL_ITEM] Failed:', e);
        res.status(500).json({ error: 'Failed to create manual item' });
    }
});

// Update event target amount
app.put('/api/events/:id/target-amount', async (req, res) => {
    const { targetAmount, userId } = req.body;
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: { group: true }
        });

        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Check permissions - only the person who set payment info can update target amount
        // If no one set payment info yet, anyone can set it (first-come-first-served)
        const isHost = !event.paymentInfoSetBy || event.paymentInfoSetBy === userId;
        if (!isHost) {
            return res.status(403).json({ error: 'Only the event organizer (who set payment info) can update target amount' });
        }

        const updatedEvent = await prisma.event.update({
            where: { id: req.params.id },
            data: { targetAmount: parseFloat(targetAmount) },
            include: {
                participants: true,
                contributions: true,
                wishlistBookings: true
            }
        });

        res.json(updatedEvent);
    } catch (e) {
        console.error('[TARGET_AMOUNT] Update failed:', e);
        res.status(500).json({ error: 'Failed to update target amount' });
    }
});

// Unbook wishlist item
app.delete('/api/events/:eventId/wishlist/:itemId/unbook', async (req, res) => {
    const { userId } = req.query;

    try {
        const item = await prisma.wishlistItem.findUnique({
            where: { id: req.params.itemId }
        });

        if (!item || !item.isBooked) {
            return res.status(404).json({ error: 'Item not found or not booked' });
        }

        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: { group: true, participants: true }
        });

        if (!event) return res.status(404).json({ error: 'Event not found' });

        const isBooker = item.bookedBy === userId;
        const isParticipant = event.participants?.some(p => p.userId === userId);

        if (!isBooker && !isParticipant) {
            return res.status(403).json({ error: 'Only booker or event participant can unbook' });
        }

        const updated = await prisma.wishlistItem.update({
            where: { id: req.params.itemId },
            data: {
                isBooked: false,
                bookedBy: null,
                bookedForEventId: null,
                bookingMode: null
            }
        });

        let updatedEvent = null;
        if (item.bookingMode === 'GROUP_FUNDING') {
            updatedEvent = await prisma.event.update({
                where: { id: req.params.eventId },
                data: { targetAmount: 0 },
                include: { participants: true }
            });
        }

        res.json({ item: updated, event: updatedEvent });
    } catch (e) {
        console.error('[WISHLIST] Unbook item failed:', e);
        res.status(500).json({ error: 'Unbooking failed' });
    }
});

// Parse URL for Open Graph metadata
app.post('/api/parse-url', async (req, res) => {
    const { url } = req.body;
    console.log(`[PARSE-URL] Parsing URL: ${url}`);
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        // Check if it's a Wildberries URL
        if (url.includes('wildberries.ru')) {
            console.log('[PARSE-URL] Detected Wildberries URL, using API parser');

            // Extract product ID from URL (e.g., /catalog/213105240/detail.aspx)
            const idMatch = url.match(/\/catalog\/(\d+)/);
            if (!idMatch) {
                console.log('[PARSE-URL] Could not extract product ID from WB URL');
                return res.json({ title: null, description: null, imageUrl: null });
            }

            const productId = idMatch[1];
            console.log(`[PARSE-URL] WB Product ID: ${productId}`);

            // Calculate vol and part based on WB's structure
            const vol = parseInt(productId.substring(0, 4)); // First 4 digits
            const part = parseInt(productId.substring(0, 6)); // First 6 digits

            // Try to find the correct basket by trying multiple options
            // WB distributes products across baskets, so we try a range
            const basketCandidates = [];

            // Add calculated values
            basketCandidates.push(Math.floor(vol / 1000));
            basketCandidates.push(Math.floor(vol / 100));
            basketCandidates.push(Math.floor(parseInt(productId.substring(0, 3)) / 100));

            // Add range 0-20 as WB uses load balancing across baskets
            for (let i = 0; i <= 20; i++) {
                if (!basketCandidates.includes(i)) {
                    basketCandidates.push(i);
                }
            }

            console.log(`[PARSE-URL] Trying baskets: ${basketCandidates.slice(0, 5).join(', ')}... (${basketCandidates.length} total)`);

            // Try each basket until we find one that works
            for (const basket of basketCandidates) {
                const apiUrl = `https://basket-${basket.toString().padStart(2, '0')}.wbbasket.ru/vol${vol}/part${part}/${productId}/info/ru/card.json`;

                try {
                    const apiResponse = await fetch(apiUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json',
                        },
                        signal: AbortSignal.timeout(5000)
                    });

                    console.log(`[PARSE-URL] Basket-${basket.toString().padStart(2, '0')}: ${apiResponse.status}`);

                    if (apiResponse.ok) {
                        console.log(`[PARSE-URL] Success with basket-${basket.toString().padStart(2, '0')}`);
                        const productData = await apiResponse.json();

                        const title = productData.imt_name || productData.name || null;
                        const description = productData.description || productData.brand || null;

                        // Extract price (salePriceU is in kopecks, divide by 100 for rubles)
                        let price = null;
                        if (productData.salePriceU) {
                            price = productData.salePriceU / 100;
                        } else if (productData.priceU) {
                            price = productData.priceU / 100;
                        }

                        // Construct image URL
                        let imageUrl = null;
                        if (productData.media?.photo_count && productData.media.photo_count > 0) {
                            imageUrl = `https://basket-${basket.toString().padStart(2, '0')}.wbbasket.ru/vol${vol}/part${part}/${productId}/images/big/1.webp`;
                        }

                        console.log(`[PARSE-URL] WB Product extracted - Title: ${title?.substring(0, 50)}, Price: ${price}, Image: ${imageUrl ? 'Yes' : 'No'}`);
                        return res.json({ title, description, imageUrl, price });
                    }
                } catch (e) {
                    // Try next basket
                    continue;
                }
            }

            console.log('[PARSE-URL] All basket attempts failed');
            return res.json({ title: null, description: null, imageUrl: null });
        }

        // Check if it's an Ozon URL
        if (url.includes('ozon.ru')) {
            console.log('[PARSE-URL] Detected Ozon URL, using API parser');

            try {
                // Construct API URL based on the user provided example
                // We need to pass the path of the product page as the 'url' query param
                const urlObj = new URL(url);
                const pageUrl = urlObj.pathname + urlObj.search;
                const apiUrl = `https://www.ozon.ru/api/entrypoint-api.bx/page/json/v2?url=${encodeURIComponent(pageUrl)}`;

                console.log(`[PARSE-URL] Fetching Ozon API: ${apiUrl}`);

                const apiResponse = await fetch(apiUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'application/json',
                        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'Referer': 'https://www.ozon.ru/'
                    },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(10000)
                });

                if (apiResponse.ok) {
                    const data = await apiResponse.json();

                    if (data.widgetStates) {
                        let title = null;
                        let imageUrl = null;

                        // Helper to find widget key by prefix
                        const findWidgetKey = (prefix: string) => Object.keys(data.widgetStates).find(k => k.startsWith(prefix));

                        // Find heading widget for title
                        const headingKey = findWidgetKey('webProductHeading');
                        if (headingKey) {
                            const heading = data.widgetStates[headingKey];
                            // Try different fields as structure might vary
                            title = heading.title || heading.name || null;
                            // Sometimes values might be JSON strings in some API versions, but usually objects in v2
                            if (!title && typeof heading === 'string') {
                                try {
                                    const parsed = JSON.parse(heading);
                                    title = parsed.title || parsed.name;
                                } catch (e) { }
                            }
                        }

                        // Find gallery widget for image
                        const galleryKey = findWidgetKey('webGallery');
                        if (galleryKey) {
                            const gallery = data.widgetStates[galleryKey];
                            const images = gallery.images || (typeof gallery === 'string' ? JSON.parse(gallery).images : null);

                            if (images && images.length > 0) {
                                imageUrl = images[0].src || images[0].url;
                            } else if (gallery.coverImage) {
                                imageUrl = gallery.coverImage;
                            }
                        }

                        if (title) {
                            console.log(`[PARSE-URL] Ozon Product extracted - Title: ${title?.substring(0, 50)}, Image: ${imageUrl ? 'Yes' : 'No'}`);
                            return res.json({ title, description: null, imageUrl });
                        }
                    }
                } else {
                    console.log(`[PARSE-URL] Ozon API returned ${apiResponse.status}`);
                }
            } catch (e) {
                console.log('[PARSE-URL] Ozon API failed:', e);
            }

            console.log('[PARSE-URL] Ozon parsing failed, returning null for manual input');
            return res.json({ title: null, description: null, imageUrl: null });
        }

        // Check if it's a Yandex Market URL
        if (url.includes('market.yandex.ru')) {
            console.log('[PARSE-URL] Detected Yandex Market URL, using HTML parser');

            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html',
                    },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(10000)
                });

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);

                    // Try to extract from JSON-LD structured data first
                    let imageUrl: string | null = null;
                    let title: string | null = null;
                    let description: string | null = null;
                    let price: number | null = null;

                    $('script[type="application/ld+json"]').each((i, elem) => {
                        try {
                            const jsonData = JSON.parse($(elem).html() || '{}');
                            if (jsonData['@type'] === 'Product') {
                                title = title || jsonData.name;
                                description = description || jsonData.description;
                                imageUrl = imageUrl || jsonData.image || (Array.isArray(jsonData.image) ? jsonData.image[0] : null);

                                // Extract price from offers
                                if (jsonData.offers) {
                                    const offers = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
                                    price = price || offers.price || offers.lowPrice;
                                }
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    });

                    // Fallback to Open Graph and meta tags
                    title = title || $('meta[property="og:title"]').attr('content') || $('h1').first().text() || null;
                    description = description || $('meta[property="og:description"]').attr('content') || null;
                    imageUrl = imageUrl || $('meta[property="og:image"]').attr('content') || null;

                    // Try to extract price from meta tags or page elements
                    if (!price) {
                        const priceStr = $('meta[property="product:price:amount"]').attr('content') ||
                            $('meta[itemprop="price"]').attr('content') ||
                            $('[data-auto="price"]').first().text().replace(/[^\d]/g, '');
                        if (priceStr) {
                            const parsed = parseFloat(priceStr);
                            if (!isNaN(parsed)) price = parsed;
                        }
                    }

                    // Try alternative image selectors if still not found
                    if (!imageUrl) {
                        imageUrl = $('meta[name="twitter:image"]').attr('content') ||
                            $('img[data-auto="productImage"]').attr('src') ||
                            $('img.ProductCardImage').attr('src') ||
                            $('picture img').first().attr('src') ||
                            $('img[itemprop="image"]').attr('src') || null;
                    }

                    // Clean title (remove extra info)
                    if (title) {
                        title = title.split('—')[0].split('|')[0].split(' - купить')[0].trim();
                    }

                    console.log(`[PARSE-URL] Yandex Market Product extracted - Title: ${title?.substring(0, 50)}, Price: ${price}, Image: ${imageUrl ? 'Yes' : 'No'}`);
                    return res.json({ title, description, imageUrl, price });
                }
            } catch (e) {
                console.log('[PARSE-URL] Yandex Market parsing failed:', e);
            }
        }

        // Check if it's an AliExpress URL
        if (url.includes('aliexpress.com') || url.includes('aliexpress.ru')) {
            console.log('[PARSE-URL] Detected AliExpress URL, using HTML parser');

            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html',
                        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
                    },
                    redirect: 'follow',
                    signal: AbortSignal.timeout(10000)
                });

                if (response.ok) {
                    const html = await response.text();
                    const $ = cheerio.load(html);

                    // AliExpress uses various meta tags
                    let title = $('meta[property="og:title"]').attr('content') ||
                        $('meta[name="title"]').attr('content') ||
                        $('h1').first().text() || null;
                    const description = $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="description"]').attr('content') || null;
                    let imageUrl = $('meta[property="og:image"]').attr('content') ||
                        $('meta[name="twitter:image"]').attr('content') || null;

                    // Clean title
                    if (title) {
                        title = title.split('|')[0].split('-')[0].trim();
                    }

                    console.log(`[PARSE-URL] AliExpress Product extracted - Title: ${title?.substring(0, 50)}, Image: ${imageUrl ? 'Yes' : 'No'}`);
                    return res.json({ title, description, imageUrl });
                }
            } catch (e) {
                console.log('[PARSE-URL] AliExpress parsing failed:', e);
            }
        }

        // For non-WB URLs, use standard Open Graph parsing
        console.log('[PARSE-URL] Using standard OG parser');
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            redirect: 'follow', // Allow redirects
            signal: AbortSignal.timeout(10000) // Increase timeout
        });

        console.log(`[PARSE-URL] Response status: ${response.status}`);
        if (!response.ok) {
            console.log(`[PARSE-URL] Failed to fetch, returning nulls`);
            return res.json({ title: null, description: null, imageUrl: null });
        }

        const html = await response.text();
        console.log(`[PARSE-URL] HTML length: ${html.length}`);
        const $ = cheerio.load(html);

        // Extract Open Graph metadata
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogDescription = $('meta[property="og:description"]').attr('content');
        const ogImage = $('meta[property="og:image"]').attr('content');

        // Fallback to regular meta tags if OG tags not found
        const title = ogTitle || $('title').text() || null;
        const description = ogDescription || $('meta[name="description"]').attr('content') || null;
        const imageUrl = ogImage || null;

        console.log(`[PARSE-URL] Extracted - Title: ${title?.substring(0, 50)}, Image: ${imageUrl ? 'Yes' : 'No'}`);
        res.json({ title, description, imageUrl });
    } catch (e) {
        console.error('[PARSE-URL] Error:', e);
        res.json({ title: null, description: null, imageUrl: null });
    }
});

app.post('/api/wishlists', async (req, res) => {
    const { userId, title, url, description, priority, imageUrl } = req.body;
    console.log(`[WISHLIST] Adding item for user ${userId}: ${title}`);
    try {
        const item = await prisma.wishlistItem.create({
            data: { userId, title, url, imageUrl, description, priority }
        });
        console.log(`[WISHLIST] Item created successfully with ID: ${item.id}`);
        res.json(item);
    } catch (e) {
        console.error('[WISHLIST] Failed to create item:', e);
        res.status(500).json({ error: 'Add failed' });
    }
});

app.delete('/api/wishlists/:id', async (req, res) => {
    const { userId } = req.query;
    try {
        const item = await prisma.wishlistItem.findUnique({ where: { id: req.params.id } });

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (item.userId !== userId) {
            return res.status(403).json({ error: 'Forbidden: You can only delete your own items' });
        }

        await prisma.wishlistItem.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (e) {
        console.error('[WISHLIST] Delete failed:', e);
        res.status(500).json({ error: 'Delete failed' });
    }
});

app.post('/api/wishlists/:id/toggle-book', async (req, res) => {
    const { userId } = req.body;
    try {
        const item = await prisma.wishlistItem.findUnique({ where: { id: req.params.id } });
        if (!item) return res.status(404).json({ error: 'Not found' });

        let updated;
        if (item.isBooked) {
            if (item.bookedBy !== userId) return res.status(403).json({ error: 'Booked by another' });
            updated = await prisma.wishlistItem.update({
                where: { id: item.id },
                data: { isBooked: false, bookedBy: null }
            });
        } else {
            updated = await prisma.wishlistItem.update({
                where: { id: item.id },
                data: { isBooked: true, bookedBy: userId }
            });
        }
        res.json(updated);
    } catch (e) { res.status(500).json({ error: 'Toggle failed' }); }
});

// --- Santa ---
app.post('/api/santa', async (req, res) => {
    try {
        const room = await prisma.santaRoom.create({
            data: {
                groupId: req.body.groupId,
                adminId: req.body.adminId,
                title: req.body.title,
                budget: req.body.budget,
                deadline: req.body.deadline,
                participants: { create: { userId: req.body.adminId } }
            },
            include: { participants: true }
        });
        res.json({ ...room, participants: room.participants.map(p => p.userId) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Create santa failed' });
    }
});

app.get('/api/groups/:id/santa', async (req, res) => {
    try {
        const rooms = await prisma.santaRoom.findMany({
            where: {
                groupId: req.params.id,
                eventId: null // Exclude Angel Rooms (which have eventId)
            },
            include: { participants: true }
        });
        const formatted = rooms.map(r => {
            const participantInfo: Record<string, any> = {};
            r.participants.forEach(p => {
                participantInfo[p.userId] = { wishText: p.wishText, wishlistItemId: p.wishlistItemId };
            });
            let assignments = {};
            try {
                if (typeof r.assignments === 'string') {
                    assignments = JSON.parse(r.assignments);
                } else {
                    assignments = r.assignments || {};
                }
            } catch (e) { }

            return {
                ...r,
                participants: r.participants.map(p => p.userId),
                participantInfo,
                assignments
            };
        });
        res.json(formatted);
    } catch (e) { res.status(500).json([]); }
});

app.post('/api/santa/:id/join', async (req, res) => {
    const { userId, wishText, wishlistItemId } = req.body;
    try {
        const room = await prisma.santaRoom.findUnique({ where: { id: req.params.id } });
        if (!room) return res.status(404).json({ success: false });

        // Use upsert to allow updating wishes for existing participants
        await prisma.santaParticipant.upsert({
            where: {
                roomId_userId: {
                    roomId: room.id,
                    userId: userId
                }
            },
            update: {
                wishText,
                wishlistItemId
            },
            create: {
                roomId: room.id,
                userId,
                wishText,
                wishlistItemId
            }
        });
        res.json({ success: true });
    } catch (e) {
        console.error('[SANTA_JOIN] Error:', e);
        res.status(500).json({ success: false });
    }
});

app.post('/api/santa/:id/draw', async (req, res) => {
    try {
        const participants = await prisma.santaParticipant.findMany({
            where: { roomId: req.params.id }
        });
        const userIds = participants.map(p => p.userId);

        if (userIds.length < 2) return res.status(400).json({ error: 'Not enough players' });

        for (let i = userIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
        }

        const assignments: Record<string, string> = {};
        for (let i = 0; i < userIds.length; i++) {
            const giver = userIds[i];
            const receiver = userIds[(i + 1) % userIds.length];
            assignments[giver] = receiver;
        }

        await prisma.santaRoom.update({
            where: { id: req.params.id },
            data: {
                status: 'DRAWN',
                assignments: JSON.stringify(assignments)
            }
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Draw failed' }); }
});

// --- Admin ---
app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalGroups = await prisma.group.count();
        const totalEvents = await prisma.event.count();
        const totalSantaRooms = await prisma.santaRoom.count();
        const sumResult = await prisma.event.aggregate({ _sum: { targetAmount: true } });

        res.json({
            totalUsers,
            totalGroups,
            totalEvents,
            totalSantaRooms,
            totalMoneyExpected: sumResult._sum.targetAmount || 0
        });
    } catch (e) { res.status(500).json({}); }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
        const usersJson = JSON.parse(JSON.stringify(users, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(usersJson);
    } catch (e) { res.status(500).json([]); }
});

app.get('/api/admin/groups', async (req, res) => {
    try {
        const groups = await prisma.group.findMany({
            include: { members: true },
            orderBy: { createdAt: 'desc' }
        });
        const formatted = groups.map(g => ({
            ...g,
            members: g.members.map(m => m.userId)
        }));
        res.json(formatted);
    } catch (e) { res.status(500).json([]); }
});

// --- SECRET SANTA ---

// Get group's Santa rooms
app.get('/api/santa/group/:groupId', async (req, res) => {
    try {
        const rooms = await prisma.santaRoom.findMany({
            where: { groupId: req.params.groupId },
            include: { participants: true }
        });

        // Format response to match frontend expectations
        const formatted = rooms.map(room => ({
            ...room,
            participants: room.participants.map(p => p.userId)
        }));

        res.json(formatted);
    } catch (e) {
        console.error('[SANTA] Get rooms failed:', e);
        res.status(500).json([]);
    }
});

// Create Santa room
app.post('/api/santa/create', async (req, res) => {
    const { groupId, adminId, title, budget, deadline } = req.body;
    try {
        const room = await prisma.santaRoom.create({
            data: { groupId, adminId, title, budget, deadline },
            include: { participants: true }
        });

        const formatted = {
            ...room,
            participants: room.participants.map(p => p.userId)
        };

        res.json(formatted);
    } catch (e) {
        console.error('[SANTA] Create room failed:', e);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// Join Santa room
app.post('/api/santa/:roomId/join', async (req, res) => {
    const { userId, wishText, wishlistItemId } = req.body;
    try {
        await prisma.santaParticipant.create({
            data: { roomId: req.params.roomId, userId, wishText, wishlistItemId }
        });

        const room = await prisma.santaRoom.findUnique({
            where: { id: req.params.roomId },
            include: { participants: true }
        });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const formatted = {
            ...room,
            participants: room.participants.map(p => p.userId)
        };

        res.json(formatted);
    } catch (e) {
        console.error('[SANTA] Join failed:', e);
        res.status(500).json({ error: 'Failed to join room' });
    }
});

// Draw Santa - Random assignment algorithm
app.post('/api/santa/:roomId/draw', async (req, res) => {
    const { adminId } = req.body;
    try {
        const room = await prisma.santaRoom.findUnique({
            where: { id: req.params.roomId },
            include: { participants: true }
        });

        if (!room || room.adminId !== adminId) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        if (room.participants.length < 3) {
            return res.status(400).json({ success: false, error: 'Need at least 3 participants' });
        }

        // Random assignment algorithm (derangement)
        const participants = room.participants.map(p => p.userId);
        const assignments: Record<string, string> = {};

        // Fisher-Yates shuffle to create random derangement
        let receivers = [...participants];
        let isValid = false;
        let attempts = 0;

        while (!isValid && attempts < 100) {
            receivers = [...participants];
            // Shuffle
            for (let i = receivers.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
            }

            // Check if valid (no one gets themselves)
            isValid = participants.every((giver, idx) => giver !== receivers[idx]);
            attempts++;
        }

        if (!isValid) {
            return res.status(500).json({ success: false, error: 'Failed to generate valid assignment' });
        }

        // Create assignments map
        participants.forEach((giver, idx) => {
            assignments[giver] = receivers[idx];
        });

        // Update room with assignments and status
        await prisma.santaRoom.update({
            where: { id: req.params.roomId },
            data: {
                status: 'DRAWN',
                assignments: JSON.stringify(assignments)
            }
        });

        res.json({ success: true });
    } catch (e) {
        console.error('[SANTA] Draw failed:', e);
        res.status(500).json({ success: false, error: 'Draw failed' });
    }
});

// Get my Santa target
app.get('/api/santa/:roomId/target/:userId', async (req, res) => {
    try {
        const room = await prisma.santaRoom.findUnique({
            where: { id: req.params.roomId }
        });

        if (!room || !room.assignments) {
            return res.status(404).json({ error: 'Room not found or draw not completed' });
        }

        const assignments = JSON.parse(room.assignments);
        const targetId = assignments[req.params.userId];

        if (!targetId) {
            return res.status(404).json({ error: 'Target not found' });
        }

        // Get target user info
        const targetUser = await prisma.user.findUnique({
            where: { id: targetId }
        });

        // Get target's wish from SantaParticipant
        const targetParticipant = await prisma.santaParticipant.findUnique({
            where: { roomId_userId: { roomId: req.params.roomId, userId: targetId } }
        });

        // Get wishlist item if specified
        let wishlistItem = null;
        if (targetParticipant?.wishlistItemId) {
            wishlistItem = await prisma.wishlistItem.findUnique({
                where: { id: targetParticipant.wishlistItemId }
            });
        }

        const response = {
            ...targetUser,
            telegramId: targetUser?.telegramId.toString(),
            santaWish: {
                wishText: targetParticipant?.wishText,
                item: wishlistItem
            }
        };

        res.json(response);
    } catch (e) {
        console.error('[SANTA] Get target failed:', e);
        res.status(500).json({ error: 'Failed to get target' });
    }
});

// ========== ANGEL GUARDIAN (Event-based Santa) ==========

// Create Angel Room for event
app.post('/api/events/:eventId/angel', async (req, res) => {
    const { adminId, title, budget, deadline } = req.body;

    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: { angelRoom: true }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if (event.angelRoom) {
            return res.status(400).json({ error: 'Angel room already exists for this event' });
        }

        const angelRoom = await prisma.santaRoom.create({
            data: {
                groupId: event.groupId,
                eventId: event.id,
                adminId,
                title,
                budget,
                deadline,
                status: 'WAITING'
            },
            include: { participants: true }
        });

        console.log('[ANGEL] Room created:', angelRoom.id);
        res.json(angelRoom);
    } catch (e) {
        console.error('[ANGEL] Create failed:', e);
        res.status(500).json({ error: 'Failed to create angel room' });
    }
});

// Get Angel Room for event
app.get('/api/events/:eventId/angel', async (req, res) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: {
                angelRoom: {
                    include: { participants: true }
                }
            }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event.angelRoom);
    } catch (e) {
        console.error('[ANGEL] Get failed:', e);
        res.status(500).json({ error: 'Failed to get angel room' });
    }
});

// Join Angel Room
app.post('/api/events/:eventId/angel/join', async (req, res) => {
    const { userId, wishText, wishlistItemId } = req.body;

    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: { angelRoom: true }
        });

        if (!event || !event.angelRoom) {
            return res.status(404).json({ error: 'Angel room not found' });
        }

        // Check if already joined
        const existing = await prisma.santaParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId: event.angelRoom.id,
                    userId
                }
            }
        });

        if (existing) {
            // Update wish
            await prisma.santaParticipant.update({
                where: { id: existing.id },
                data: { wishText, wishlistItemId }
            });
        } else {
            // Join
            await prisma.santaParticipant.create({
                data: {
                    roomId: event.angelRoom.id,
                    userId,
                    wishText,
                    wishlistItemId
                }
            });
        }

        const updated = await prisma.santaRoom.findUnique({
            where: { id: event.angelRoom.id },
            include: { participants: true }
        });

        console.log('[ANGEL] User joined:', userId);
        res.json(updated);
    } catch (e) {
        console.error('[ANGEL] Join failed:', e);
        res.status(500).json({ error: 'Failed to join angel room' });
    }
});

// Draw Angel assignments
app.post('/api/events/:eventId/angel/draw', async (req, res) => {
    const { adminId } = req.body;

    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: {
                angelRoom: {
                    include: { participants: true }
                }
            }
        });

        if (!event || !event.angelRoom) {
            return res.status(404).json({ error: 'Angel room not found' });
        }

        if (event.angelRoom.adminId !== adminId) {
            return res.status(403).json({ error: 'Only admin can draw' });
        }

        if (event.angelRoom.participants.length < 3) {
            return res.status(400).json({ error: 'Need at least 3 participants' });
        }

        // Shuffle and assign
        const participants = [...event.angelRoom.participants];
        const shuffled = [...participants].sort(() => Math.random() - 0.5);

        const assignments: Record<string, string> = {};
        for (let i = 0; i < participants.length; i++) {
            const giver = participants[i].userId;
            const receiver = shuffled[(i + 1) % shuffled.length].userId;

            // Ensure no one gets themselves
            if (giver === receiver) {
                // Re-shuffle if someone got themselves
                return res.status(500).json({ error: 'Draw failed, please try again' });
            }

            assignments[giver] = receiver;
        }

        const updated = await prisma.santaRoom.update({
            where: { id: event.angelRoom.id },
            data: {
                status: 'DRAWN',
                assignments: JSON.stringify(assignments)
            },
            include: { participants: true }
        });

        console.log('[ANGEL] Drawn successfully');
        res.json(updated);
    } catch (e) {
        console.error('[ANGEL] Draw failed:', e);
        res.status(500).json({ error: 'Failed to draw' });
    }
});

// Get my Angel target
app.get('/api/events/:eventId/angel/target/:userId', async (req, res) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.eventId },
            include: { angelRoom: true }
        });

        if (!event || !event.angelRoom) {
            return res.status(404).json({ error: 'Angel room not found' });
        }

        if (event.angelRoom.status !== 'DRAWN') {
            return res.status(400).json({ error: 'Game not started yet' });
        }

        const assignments = JSON.parse(event.angelRoom.assignments || '{}');
        const targetUserId = assignments[req.params.userId];

        if (!targetUserId) {
            return res.status(404).json({ error: 'No assignment found' });
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId }
        });

        const targetParticipant = await prisma.santaParticipant.findUnique({
            where: {
                roomId_userId: {
                    roomId: event.angelRoom.id,
                    userId: targetUserId
                }
            }
        });

        let wishlistItem = null;
        if (targetParticipant?.wishlistItemId) {
            wishlistItem = await prisma.wishlistItem.findUnique({
                where: { id: targetParticipant.wishlistItemId }
            });
        }

        const response = {
            ...targetUser,
            telegramId: targetUser?.telegramId.toString(),
            angelWish: {
                wishText: targetParticipant?.wishText,
                item: wishlistItem
            }
        };

        res.json(response);
    } catch (e) {
        console.error('[ANGEL] Get target failed:', e);
        res.status(500).json({ error: 'Failed to get target' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Initialize notification service
    initNotificationService();
});