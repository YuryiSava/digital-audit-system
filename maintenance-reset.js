
const { createClient } = require('@supabase/supabase-js');

// Production Support Script v1.1
// This script clears any 'PARSING' status that has timed out on Vercel.

const supabase = createClient(
    'https://dvgnucppetrogunjqiti.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z251Y3BwZXRyb2d1bmpxaXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE1MDk0MywiZXhwIjoyMDg0NzI2OTQzfQ.qFX_yBVlRmqeQBQJioKq1N0QAFS5eTc3nqtbNhub20o'
);

async function flushParsers() {
    console.log('--- PRODUCTION MAINTENANCE: CLEARING HANGS ---');

    // Reset all hanging processes to DRAFT
    const { data, error } = await supabase
        .from('norm_sources')
        .update({ status: 'DRAFT', parsing_details: null })
        .eq('status', 'PARSING');

    if (error) {
        console.error('FAILED:', error.message);
    } else {
        console.log('SUCCESS: All PARSING statuses reset to DRAFT.');
    }
}

flushParsers();
