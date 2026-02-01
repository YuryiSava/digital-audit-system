#!/usr/bin/env node
/**
 * Publish RequirementSets (change status from DRAFT to PUBLISHED)
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function publishRequirementSets() {
    console.log('📢 Publishing RequirementSets...\n');

    try {
        // Get all DRAFT requirement sets
        const { data: draftSets, error: fetchError } = await supabase
            .from('requirement_sets')
            .select('*')
            .eq('status', 'DRAFT');

        if (fetchError) {
            console.error('❌ Error fetching sets:', fetchError.message);
            return;
        }

        if (!draftSets || draftSets.length === 0) {
            console.log('✅ No DRAFT RequirementSets found. All are already PUBLISHED!\n');
            return;
        }

        console.log(`Found ${draftSets.length} DRAFT RequirementSets:\n`);
        draftSets.forEach((rs, idx) => {
            console.log(`${idx + 1}. ${rs.requirementSetId} (${rs.systemId})`);
        });

        console.log('\n🔄 Publishing all DRAFT sets to PUBLISHED...\n');

        // Update all DRAFT to PUBLISHED
        const { data: updated, error: updateError } = await supabase
            .from('requirement_sets')
            .update({
                status: 'PUBLISHED',
                updatedAt: new Date().toISOString()
            })
            .eq('status', 'DRAFT')
            .select();

        if (updateError) {
            console.error('❌ Error updating:', updateError.message);
            return;
        }

        console.log(`✅ Successfully published ${updated.length} RequirementSets!\n`);

        updated.forEach((rs, idx) => {
            console.log(`${idx + 1}. ${rs.requirementSetId}`);
            console.log(`   System: ${rs.systemId}`);
            console.log(`   Status: ${rs.status} ✅`);
            console.log('');
        });

        console.log('─'.repeat(60));
        console.log('✅ DONE! You can now use these sets in Pre-Audit Setup.');
        console.log('   Refresh the page: /projects/[id]/pre-audit\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

publishRequirementSets();
