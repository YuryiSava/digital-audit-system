#!/usr/bin/env node
/**
 * Check RequirementSets in database
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRequirementSets() {
    console.log('🔍 Checking RequirementSets in database...\n');

    try {
        // Get all requirement sets
        const { data: requirementSets, error } = await supabase
            .from('requirement_sets')
            .select(`
                *,
                system:systems(systemId, name, nameRu)
            `)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('❌ Error:', error.message);
            return;
        }

        if (!requirementSets || requirementSets.length === 0) {
            console.log('❌ No RequirementSets found in database!\n');
            console.log('📋 You need to:');
            console.log('1. Go to /norm-library');
            console.log('2. Upload a PDF norm');
            console.log('3. Parse it with GPT');
            console.log('4. This will create Requirements and RequirementSets\n');
            return;
        }

        console.log(`✅ Found ${requirementSets.length} RequirementSets:\n`);
        console.log('─'.repeat(80));

        requirementSets.forEach((rs, idx) => {
            console.log(`${idx + 1}. ${rs.requirementSetId}`);
            console.log(`   System: ${rs.system?.systemId || rs.systemId}`);
            console.log(`   Status: ${rs.status}`);
            console.log(`   Version: ${rs.version}`);
            console.log(`   Created: ${new Date(rs.createdAt).toLocaleString('ru-RU')}`);
            if (rs.notes) {
                console.log(`   Notes: ${rs.notes}`);
            }
            console.log('');
        });

        console.log('─'.repeat(80));

        // Count by status
        const published = requirementSets.filter(rs => rs.status === 'PUBLISHED').length;
        const draft = requirementSets.filter(rs => rs.status === 'DRAFT').length;

        console.log(`\n📊 Summary:`);
        console.log(`   PUBLISHED: ${published}`);
        console.log(`   DRAFT: ${draft}`);
        console.log(`   TOTAL: ${requirementSets.length}\n`);

        if (published === 0) {
            console.log('⚠️  WARNING: No PUBLISHED RequirementSets!');
            console.log('   Pre-Audit Setup only shows PUBLISHED sets.\n');
            console.log('💡 To publish a RequirementSet:');
            console.log('   UPDATE requirement_sets SET status = \'PUBLISHED\' WHERE id = \'...\';');
            console.log('   Or use Supabase Dashboard → Table Editor\n');
        }

        // Count requirements for each set
        console.log('📋 Requirements count:\n');
        for (const rs of requirementSets) {
            const { data: requirements, error: reqError } = await supabase
                .from('requirements')
                .select('id')
                .eq('requirementSetId', rs.id);

            if (!reqError && requirements) {
                console.log(`   ${rs.requirementSetId}: ${requirements.length} requirements`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkRequirementSets();
