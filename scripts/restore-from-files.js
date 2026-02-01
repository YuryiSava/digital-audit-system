import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

const normsDir = join(process.cwd(), 'public', 'uploads', 'norms');

// Mapping of file patterns to norm metadata
const normMetadata = {
    'SN-RK-4.01_01_2011': {
        code: 'СН РК 4.01-01-2011',
        title: 'Внутренний водопровод и канализация зданий и сооружений',
        jurisdiction: 'KZ',
        category: 'СТРОИТЕЛЬНЫЕ НОРМЫ'
    },
    'SP-RK-4.02_101_2012': {
        code: 'СП РК 4.02-101-2012',
        title: 'Отопление, вентиляция и кондиционирование воздуха',
        jurisdiction: 'KZ',
        category: 'СВОД ПРАВИЛ'
    },
    'SN-RK-2.02_02_2023': {
        code: 'СН РК 2.02-02-2023',
        title: 'Пожарная автоматика зданий и сооружений',
        jurisdiction: 'KZ',
        category: 'СТРОИТЕЛЬНЫЕ НОРМЫ'
    },
    'SP-RK-2.02_102_2022': {
        code: 'СП РК 2.02-102-2022',
        title: 'Пожарная автоматика зданий и сооружений',
        jurisdiction: 'KZ',
        category: 'СВОД ПРАВИЛ'
    },
    'SP-RK-2.02_101_2022': {
        code: 'СП РК 2.02-101-2022',
        title: 'Пожарная безопасность зданий и сооружений',
        jurisdiction: 'KZ',
        category: 'СВОД ПРАВИЛ'
    },
    'SN-RK-2.02_01_2023': {
        code: 'СН РК 2.02-01-2023',
        title: 'Пожарная безопасность зданий и сооружений',
        jurisdiction: 'KZ',
        category: 'СТРОИТЕЛЬНЫЕ НОРМЫ'
    },
    'PUE': {
        code: 'ПУЭ',
        title: 'Правила устройства электроустановок',
        jurisdiction: 'KZ',
        category: 'ПРАВИЛА'
    },
    'Tekhnicheskiy-reglament': {
        code: 'ТР РК',
        title: 'Общие требования к пожарной безопасности',
        jurisdiction: 'KZ',
        category: 'ТЕХНИЧЕСКИЙ РЕГЛАМЕНТ'
    }
};

async function restoreNorms() {
    console.log('🔄 Restoring norms from local PDF files...\n');

    try {
        // Get all PDF files
        const files = readdirSync(normsDir)
            .filter(f => f.endsWith('.pdf'))
            .map(f => ({
                name: f,
                path: join(normsDir, f),
                size: statSync(join(normsDir, f)).size
            }));

        console.log(`📁 Found ${files.length} PDF files\n`);

        // Get existing norms
        const { data: existing } = await supabase
            .from('norm_sources')
            .select('id, code');
        const existingCodes = new Set(existing?.map(n => n.code) || []);

        let restored = 0;
        let skipped = 0;

        for (const file of files) {
            // Try to match metadata
            let metadata = null;
            for (const [pattern, meta] of Object.entries(normMetadata)) {
                if (file.name.includes(pattern)) {
                    metadata = meta;
                    break;
                }
            }

            if (!metadata) {
                console.log(`⚠️  Skipping ${file.name} - no metadata mapping`);
                skipped++;
                continue;
            }

            if (existingCodes.has(metadata.code)) {
                console.log(`⏭️  Skipping ${metadata.code} - already exists`);
                skipped++;
                continue;
            }

            // Create norm source
            const normId = crypto.randomUUID();
            const now = new Date().toISOString();

            console.log(`📄 Creating: ${metadata.code} - ${metadata.title}`);

            const { error: normError } = await supabase
                .from('norm_sources')
                .insert({
                    id: normId,
                    normSourceId: normId, // Alias for id
                    code: metadata.code,
                    title: metadata.title,
                    jurisdiction: metadata.jurisdiction,
                    docType: 'NORM',
                    status: 'DRAFT',
                    createdAt: now,
                    updatedAt: now
                });

            if (normError) {
                console.error(`   ❌ Error creating norm:`, normError.message);
                continue;
            }

            // Create norm file entry
            const relativePath = `/uploads/norms/${file.name}`;
            const { error: fileError } = await supabase
                .from('norm_files')
                .insert({
                    id: crypto.randomUUID(),
                    normSourceId: normId,
                    fileName: file.name,
                    fileType: 'application/pdf',
                    fileSize: file.size,
                    storageUrl: relativePath, // Use storageUrl instead
                    uploadedAt: now
                });

            if (fileError) {
                console.error(`   ⚠️  Error creating file entry:`, fileError.message);
            } else {
                console.log(`   ✅ Created with file entry`);
                restored++;
            }
        }

        console.log(`\n✨ Restoration completed!`);
        console.log(`   Restored: ${restored}`);
        console.log(`   Skipped: ${skipped}\n`);

        // Verify
        const { count } = await supabase
            .from('norm_sources')
            .select('*', { count: 'exact', head: true });
        console.log(`📊 Total norm sources in database: ${count}\n`);
        console.log(`🎯 Next steps:`);
        console.log(`   1. Go to Norm Library in the app`);
        console.log(`   2. Run "Универсальный парсинг" on each restored norm`);
        console.log(`   3. Convert fragments to requirements`);
        console.log(`   4. Publish requirement sets\n`);

    } catch (error) {
        console.error('❌ Restoration failed:', error);
        throw error;
    }
}

restoreNorms()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
