const { Client } = require('pg');

const project = 'dvgnucppetrogunjqiti';
const pass = 'aDD-e2X-YdD-ZAV';
const poolers = [
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-eu-west-1.pooler.supabase.com',
    'aws-0-eu-west-2.pooler.supabase.com',
    'aws-0-eu-west-3.pooler.supabase.com',
    'aws-0-sa-east-1.pooler.supabase.com',
    'aws-0-ca-central-1.pooler.supabase.com',
    'aws-0-ap-south-1.pooler.supabase.com',
    'aws-0-ap-northeast-1.pooler.supabase.com'
];

async function checkPooler(host) {
    // Try format 1: postgres.project
    const conn1 = `postgres://postgres.${project}:${pass}@${host}:6543/postgres`;
    // Try format 2: project.postgres
    const conn2 = `postgres://${project}.postgres:${pass}@${host}:6543/postgres`;

    const client1 = new Client({ connectionString: conn1, connectionTimeoutMillis: 3000 });
    try {
        await client1.connect();
        console.log(`✅ SUCCESS (Format 1) connecting to ${host}!`);
        await client1.end();
        return host;
    } catch (e) {
        if (!e.message.includes('not found')) console.log(`   Format 1 failed on ${host}: ${e.message}`);
    }

    const client2 = new Client({ connectionString: conn2, connectionTimeoutMillis: 3000 });
    try {
        await client2.connect();
        console.log(`✅ SUCCESS (Format 2) connecting to ${host}!`);
        await client2.end();
        return host;
    } catch (e) {
        if (!e.message.includes('not found')) console.log(`   Format 2 failed on ${host}: ${e.message}`);
    }
    return null;
}

async function run() {
    for (const p of poolers) {
        const res = await checkPooler(p);
        if (res) process.exit(0);
    }
    console.log('No pooler matched.');
}

run();
