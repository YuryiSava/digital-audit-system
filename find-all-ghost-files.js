require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findGhostFiles() {
    try {
        // Step 1: Find ALL files in the database
        console.log('📊 Fetching ALL norm files...\n');
        const { data: allFiles, error } = await supabase
            .from('norm_files')
            .select('*');

        if (error) {
            console.error('Error:', error);
            return;
        }

        console.log(`Total files in database: ${allFiles.length}\n`);

        // Step 2: Filter ghost files
        const ghostFiles = allFiles.filter(f =>
            f.storageUrl.includes('test/data') || f.storageUrl.includes('test\\data')
        );

        if (ghostFiles.length > 0) {
            console.log(`🔴 Found ${ghostFiles.length} GHOST FILES:\n`);

            for (const file of ghostFiles) {
                console.log(`File ID: ${file.id}`);
                console.log(`Name: ${file.fileName}`);
                console.log(`Path: ${file.storageUrl}`);
                console.log(`Norm ID: ${file.normSourceId}`);
                console.log(`Uploaded: ${file.uploadedAt}\n`);

                // Get the norm details
                const { data: norm } = await supabase
                    .from('norm_sources')
                    .select('*')
                    .eq('id', file.normSourceId)
                    .single();

                if (norm) {
                    console.log(`   ↳ Attached to norm: ${norm.code} - ${norm.title}\n`);
                }
            }

            // Offer to delete
            console.log('\n❌ These ghost files need to be deleted!');
            console.log(`Run: node delete-ghost-files.js`);

        } else {
            console.log('✅ No ghost files found!');

            // Show sample of actual files
            console.log('\n📋 Sample of actual files:');
            allFiles.slice(0, 5).forEach(f => {
                console.log(`   - ${f.fileName}`);
                console.log(`     Path: ${f.storageUrl}\n`);
            });
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

findGhostFiles();
