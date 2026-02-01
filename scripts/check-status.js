
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Norm Sources ---');
        const norms = await prisma.normSource.findMany({
            select: { id: true, code: true, title: true }
        });
        norms.forEach(n => console.log(`${n.code}: ${n.id} (${n.title})`));

        console.log('\n--- Raw Fragments Status ---');
        // Check mostly typically the SN RK 2.02-02-2023 one
        const targetId = '452c6587-bd11-4058-b2e7-9476b037e1dd';

        const count = await prisma.rawNormFragment.count({
            where: { normSourceId: targetId }
        });
        console.log(`Total Fragments for ${targetId}: ${count}`);

        const lastFragment = await prisma.rawNormFragment.findFirst({
            where: { normSourceId: targetId },
            orderBy: { createdAt: 'desc' }
        });

        if (lastFragment) {
            console.log(`Latest fragment created at: ${lastFragment.createdAt}`);
            console.log(`Time since last fragment: ${Math.floor((Date.now() - new Date(lastFragment.createdAt).getTime()) / 1000)} seconds`);
            console.log(`Latest text preview: ${lastFragment.rawText.substring(0, 50)}...`);
        } else {
            console.log('No fragments found.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
