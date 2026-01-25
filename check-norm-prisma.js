const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFilesForNorm() {
    try {
        // Find the norm first
        console.log('🔍 Finding norm "CH РК 2.02-01-2023"...\n');

        const norms = await prisma.normSource.findMany({
            where: {
                OR: [
                    { code: { contains: '2.02-01-2023', mode: 'insensitive' } },
                    { code: { contains: 'CH РК', mode: 'insensitive' } }
                ]
            },
            include: {
                files: true
            }
        });

        if (!norms || norms.length === 0) {
            console.log('❌ Norm not found');
            return;
        }

        console.log(`✅ Found ${norms.length} norm(s)\n`);

        for (const norm of norms) {
            console.log(`📋 Norm:`);
            console.log(`   ID: ${norm.id}`);
            console.log(`   Code: ${norm.code}`);
            console.log(`   Title: ${norm.title}`);
            console.log(`   Status: ${norm.status}\n`);

            console.log(`   📁 Files (${norm.files.length}):\n`);

            norm.files.forEach((file, idx) => {
                console.log(`   ${idx + 1}. ${file.fileName}`);
                console.log(`      ID: ${file.id}`);
                console.log(`      Path: ${file.storageUrl}`);
                console.log(`      Uploaded: ${file.uploadedAt}`);

                if (file.storageUrl.includes('test/data') || file.storageUrl.includes('test\\data')) {
                    console.log(`      🔴🔴🔴 GHOST FILE DETECTED! 🔴🔴🔴`);
                }
                console.log('');
            });
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

checkFilesForNorm();
