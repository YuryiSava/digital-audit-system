#!/usr/bin/env node
/**
 * Batch PDF Parser
 * Processes multiple norms at once
 * Usage: node scripts/parse-all-norms.js
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('\n📦 Batch PDF Parser');
console.log('===================\n');

async function parseAllNorms() {
    try {
        // Fetch all norms with files
        console.log('🔍 Fetching all norms with files...\n');

        const { data: norms, error } = await supabase
            .from('norm_sources')
            .select(`
        id,
        code,
        title,
        status
      `)
            .eq('status', 'ACTIVE')
            .order('code');

        if (error) {
            throw error;
        }

        console.log(`Found ${norms.length} norms\n`);

        // Process each norm
        for (let i = 0; i < norms.length; i++) {
            const norm = norms[i];

            console.log(`\n[${i + 1}/${norms.length}] Processing: ${norm.code}`);
            console.log('─'.repeat(60));

            // Check if has files
            const { data: files } = await supabase
                .from('norm_files')
                .select('id')
                .eq('normSourceId', norm.id);

            if (!files || files.length === 0) {
                console.log('⏭️  Skipping - no files attached\n');
                continue;
            }

            // Check if already has requirements
            const { data: existingReqs } = await supabase
                .from('requirements')
                .select('id')
                .eq('normSourceId', norm.id)
                .limit(1);

            if (existingReqs && existingReqs.length > 0) {
                console.log('⏭️  Skipping - already has requirements\n');
                continue;
            }

            // Run parser
            console.log('🚀 Running parser...\n');

            await new Promise((resolve, reject) => {
                const parser = spawn('node', ['scripts/parse-pdf-with-gpt.js', norm.id], {
                    stdio: 'inherit'
                });

                parser.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        console.error(`Parser exited with code ${code}`);
                        resolve(); // Continue with next norm
                    }
                });

                parser.on('error', (err) => {
                    console.error('Failed to start parser:', err);
                    resolve(); // Continue with next norm
                });
            });

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('\n✅ Batch processing complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

parseAllNorms();
