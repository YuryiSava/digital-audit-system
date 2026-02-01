import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

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

async function restore() {
    console.log('🔄 Restoring normative documents from backup...\n');

    try {
        // Read backup
        const backupPath = join(process.cwd(), 'backups', 'das_data_backup_2026-01-31T07-09-17-002Z.json');
        const backup = JSON.parse(readFileSync(backupPath, 'utf-8'));

        console.log('📦 Backup loaded:');
        console.log(`   Norm sources: ${backup.normSources?.length || 0}`);
        console.log(`   Norm files: ${backup.normFiles?.length || 0}`);
        console.log(`   RAW fragments: ${backup.rawFragments?.length || 0}`);
        console.log(`   Requirements: ${backup.requirements?.length || 0}`);
        console.log(`   Requirement sets: ${backup.requirementSets?.length || 0}\n`);

        // Get current norm sources to avoid duplicates
        const { data: existing } = await supabase
            .from('norm_sources')
            .select('id');
        const existingIds = new Set(existing?.map(n => n.id) || []);

        // Restore norm sources (excluding already existing)
        const normsToRestore = backup.normSources?.filter(n => !existingIds.has(n.id)) || [];
        if (normsToRestore.length > 0) {
            console.log(`📄 Restoring ${normsToRestore.length} norm sources...`);
            const { error: normsError } = await supabase
                .from('norm_sources')
                .insert(normsToRestore);
            if (normsError) {
                console.error('   ❌ Error:', normsError.message);
            } else {
                console.log('   ✅ Restored!');
            }
        }

        // Restore norm files
        const filesToRestore = backup.normFiles?.filter(f => !existingIds.has(f.normSourceId)) || [];
        if (filesToRestore.length > 0) {
            console.log(`📎 Restoring ${filesToRestore.length} norm files...`);
            const { error: filesError } = await supabase
                .from('norm_files')
                .insert(filesToRestore);
            if (filesError) {
                console.error('   ⚠️  Error:', filesError.message);
            } else {
                console.log('   ✅ Restored!');
            }
        }

        // Restore RAW fragments (only for restored norms)
        const fragsToRestore = backup.rawFragments?.filter(f => !existingIds.has(f.normSourceId)) || [];
        if (fragsToRestore.length > 0) {
            console.log(`📝 Restoring ${fragsToRestore.length} RAW fragments...`);
            // Insert in batches of 100
            for (let i = 0; i < fragsToRestore.length; i += 100) {
                const batch = fragsToRestore.slice(i, i + 100);
                const { error } = await supabase
                    .from('raw_norm_fragments')
                    .insert(batch);
                if (error) {
                    console.error(`   ⚠️  Batch ${Math.floor(i / 100) + 1} error:`, error.message);
                }
                process.stdout.write(`\r   Progress: ${Math.min(i + 100, fragsToRestore.length)}/${fragsToRestore.length}`);
            }
            console.log('\n   ✅ Restored!');
        }

        // Restore requirement sets (only for restored norms)
        const setsToRestore = backup.requirementSets?.filter(s =>
            s.requirementSetId !== 'RS-ea2708a8' // Keep our new one
        ) || [];
        if (setsToRestore.length > 0) {
            console.log(`📚 Restoring ${setsToRestore.length} requirement sets...`);
            const { error: setsError } = await supabase
                .from('requirement_sets')
                .insert(setsToRestore);
            if (setsError) {
                console.error('   ⚠️  Error:', setsError.message);
            } else {
                console.log('   ✅ Restored!');
            }
        }

        // Restore requirements (only for restored sets)
        const reqsToRestore = backup.requirements?.filter(r => !existingIds.has(r.normSourceId)) || [];
        if (reqsToRestore.length > 0) {
            console.log(`✓ Restoring ${reqsToRestore.length} requirements...`);
            // Insert in batches of 50
            for (let i = 0; i < reqsToRestore.length; i += 50) {
                const batch = reqsToRestore.slice(i, i + 50);
                const { error } = await supabase
                    .from('requirements')
                    .insert(batch);
                if (error) {
                    console.error(`   ⚠️  Batch ${Math.floor(i / 50) + 1} error:`, error.message);
                }
                process.stdout.write(`\r   Progress: ${Math.min(i + 50, reqsToRestore.length)}/${reqsToRestore.length}`);
            }
            console.log('\n   ✅ Restored!');
        }

        console.log('\n✨ Restoration completed!\n');

        // Verify
        const { count: normCount } = await supabase.from('norm_sources').select('*', { count: 'exact', head: true });
        const { count: setCount } = await supabase.from('requirement_sets').select('*', { count: 'exact', head: true });
        console.log('📊 Current state:');
        console.log(`   Norm sources: ${normCount}`);
        console.log(`   Requirement sets: ${setCount}\n`);

    } catch (error) {
        console.error('❌ Restoration failed:', error);
        throw error;
    }
}

restore()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
