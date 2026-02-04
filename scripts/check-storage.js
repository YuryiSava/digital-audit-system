const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBuckets() {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }
    console.log('Existing buckets:', buckets.map(b => b.name));

    const requiredBuckets = ['norm-docs', 'audit-evidence'];
    for (const bucketName of requiredBuckets) {
        if (!buckets.find(b => b.name === bucketName)) {
            console.log(`Creating bucket: ${bucketName}`);
            const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true
            });
            if (createError) console.error(`Error creating ${bucketName}:`, createError);
            else console.log(`Bucket ${bucketName} created.`);
        }
    }
}

checkBuckets();
