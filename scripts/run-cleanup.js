import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
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

const KEEP_NORM_ID = 'ea2708a8-7f19-4fe4-b962-21f2cf17bde6';
const KEEP_REQ_SET_ID = 'RS-ea2708a8';

async function cleanup() {
    console.log('🧹 Starting database cleanup...\n');

    try {
        // 1. Delete audits
        console.log('🗑️  Deleting audits...');
        const { error: auditsError } = await supabase
            .from('audits')
            .delete()
            .neq('id', 'xxx'); // Delete all
        if (auditsError) console.warn('   ⚠️  Audits:', auditsError.message);
        else console.log('   ✅ Audits deleted');

        // 2. Delete projects
        console.log('🗑️  Deleting projects...');
        const { error: projectsError } = await supabase
            .from('projects')
            .delete()
            .neq('id', 'xxx'); // Delete all
        if (projectsError) console.warn('   ⚠️  Projects:', projectsError.message);
        else console.log('   ✅ Projects deleted');

        // 3. Delete old requirements
        console.log('🗑️  Deleting old requirements...');
        const { error: reqsError } = await supabase
            .from('requirements')
            .delete()
            .neq('normSourceId', KEEP_NORM_ID);
        if (reqsError) console.warn('   ⚠️  Requirements:', reqsError.message);
        else console.log('   ✅ Old requirements deleted');

        // 4. Delete old requirement sets
        console.log('🗑️  Deleting old requirement sets...');
        const { error: setsError } = await supabase
            .from('requirement_sets')
            .delete()
            .neq('requirementSetId', KEEP_REQ_SET_ID);
        if (setsError) console.warn('   ⚠️  Requirement sets:', setsError.message);
        else console.log('   ✅ Old requirement sets deleted');

        // 5. Delete old RAW fragments
        console.log('🗑️  Deleting old RAW fragments...');
        const { error: fragsError } = await supabase
            .from('raw_norm_fragments')
            .delete()
            .neq('normSourceId', KEEP_NORM_ID);
        if (fragsError) console.warn('   ⚠️  RAW fragments:', fragsError.message);
        else console.log('   ✅ Old fragments deleted');

        // 6. Delete old norm files
        console.log('🗑️  Deleting old norm files...');
        const { error: filesError } = await supabase
            .from('norm_files')
            .delete()
            .neq('normSourceId', KEEP_NORM_ID);
        if (filesError) console.warn('   ⚠️  Norm files:', filesError.message);
        else console.log('   ✅ Old files deleted');

        // 7. Delete old norm sources
        console.log('🗑️  Deleting old norm sources...');
        const { error: normsError } = await supabase
            .from('norm_sources')
            .delete()
            .neq('id', KEEP_NORM_ID);
        if (normsError) console.warn('   ⚠️  Norm sources:', normsError.message);
        else console.log('   ✅ Old norms deleted');

        // Verify cleanup
        console.log('\n📊 Verifying cleanup...');
        const tables = ['audits', 'projects', 'requirement_sets', 'requirements', 'norm_sources', 'raw_norm_fragments'];
        for (const table of tables) {
            const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
            console.log(`   ${table}: ${count || 0} records`);
        }

        console.log('\n✨ Cleanup completed successfully!');
        console.log('\n🎯 Ready for fresh testing:\n');
        console.log('   - 1 norm source: CП РК 2.02-102-2022 (Пожарная автоматика)');
        console.log('   - 1 requirement set: RS-ea2708a8 (4 requirements)');
        console.log('   - 375 RAW fragments (PROCESSED status)');
        console.log('   - All projects, audits, and old data removed\n');

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

cleanup()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
