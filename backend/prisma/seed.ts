import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Создаем тестовых пользователей
    const user1 = await prisma.user.upsert({
        where: { telegramId: BigInt(414153884) },
        update: {},
        create: {
            telegramId: BigInt(414153884),
            name: 'Владислав',
            username: 'vladchn',
            isAdmin: true,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { telegramId: BigInt(123456789) },
        update: {},
        create: {
            telegramId: BigInt(123456789),
            name: 'Тестовый Пользователь',
            username: 'testuser',
            isAdmin: false,
        },
    });

    const user3 = await prisma.user.upsert({
        where: { telegramId: BigInt(987654321) },
        update: {},
        create: {
            telegramId: BigInt(987654321),
            name: 'Анна Иванова',
            username: 'anna_ivanova',
            isAdmin: false,
        },
    });

    console.log('✅ Created users:', { user1: user1.name, user2: user2.name, user3: user3.name });

    // Создаем тестовую группу
    const group = await prisma.group.create({
        data: {
            id: 'TEST01',
            title: 'Семья',
            password: '1234',
            description: 'Семейная группа для подарков',
            creatorId: user1.id,
            members: {
                create: [
                    { userId: user1.id },
                    { userId: user2.id },
                    { userId: user3.id },
                ],
            },
        },
    });

    console.log('✅ Created group:', group.title);

    // Создаем тестовое событие
    const event = await prisma.event.create({
        data: {
            groupId: group.id,
            title: 'День рождения Анны',
            date: '2025-12-15',
            targetAmount: 5000,
            currency: 'RUB',
            creatorId: user1.id,
            beneficiaryId: user3.id,
            participants: {
                create: [
                    { userId: user1.id, status: 'JOINED', paidAmount: 2000 },
                    { userId: user2.id, status: 'JOINED', paidAmount: 1500 },
                ],
            },
        },
    });

    console.log('✅ Created event:', event.title);

    // Создаем вишлист для Анны
    await prisma.wishlistItem.createMany({
        data: [
            {
                userId: user3.id,
                title: 'Книга "Мастер и Маргарита"',
                url: 'https://example.com/book',
                description: 'Коллекционное издание',
                priority: 'high',
            },
            {
                userId: user3.id,
                title: 'Наушники Sony WH-1000XM5',
                url: 'https://example.com/headphones',
                description: 'Беспроводные с шумоподавлением',
                priority: 'medium',
                isBooked: true,
                bookedBy: user1.id,
            },
            {
                userId: user3.id,
                title: 'Кофемашина',
                priority: 'low',
            },
        ],
    });

    console.log('✅ Created wishlist items');

    // Создаем комнату Secret Santa
    const santaRoom = await prisma.santaRoom.create({
        data: {
            groupId: group.id,
            adminId: user1.id,
            title: 'Новогодний Secret Santa 2025',
            budget: '1000-3000 руб',
            deadline: '2025-12-25',
            status: 'WAITING',
            participants: {
                create: [
                    { userId: user1.id, wishText: 'Хочу настольную игру' },
                    { userId: user2.id, wishText: 'Сертификат в кино' },
                    { userId: user3.id, wishText: 'Сладости' },
                ],
            },
        },
    });

    console.log('✅ Created Santa room:', santaRoom.title);

    console.log('\n🎉 Seeding completed successfully!');
    console.log('\n📊 Database summary:');
    console.log(`   Users: ${await prisma.user.count()}`);
    console.log(`   Groups: ${await prisma.group.count()}`);
    console.log(`   Events: ${await prisma.event.count()}`);
    console.log(`   Wishlist items: ${await prisma.wishlistItem.count()}`);
    console.log(`   Santa rooms: ${await prisma.santaRoom.count()}`);
    console.log('\n🔑 Test credentials:');
    console.log(`   Group ID: TEST01`);
    console.log(`   Password: 1234`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
