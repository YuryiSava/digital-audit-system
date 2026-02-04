const { createClient } = require('@supabase/supabase-js');
const url = 'https://dvgnucppetrogunjqiti.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2Z251Y3BwZXRyb2d1bmpxaXRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODIyMDkyNiwiZXhwIjoyMDUzNzk2OTI2fQ.sb_secret_c3eGG1aEWvaN5dmT5jdkU_i1V';
const supabase = createClient(url, key);

async function create() {
    console.log('🚀 Attempting to create missing buckets...');

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
        console.error('❌ Error listing buckets:', listError);
        return;
    }

    const required = ['norm-docs', 'audit-evidence'];
    for (const b of required) {
        if (!buckets.find(x => x.name === b)) {
            console.log(`➕ Creating bucket: ${b}`);
            const { data, error } = await supabase.storage.createBucket(b, { public: true });
            if (error) console.error(`❌ Error creating ${b}:`, error);
            else console.log(`✅ Bucket ${b} created successfully.`);
        } else {
            console.log(`ℹ️ Bucket ${b} already exists.`);
        }
    }
}
create();
