const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkRelations() {
    const client = await pool.connect();
    try {
        console.log('🔍 CHECKING NORM FRAGMENTS RELATIONS...');

        // 1. Get all norms
        const normsRes = await client.query('SELECT id, "normSourceId", code, title FROM norm_sources');
        const norms = normsRes.rows;

        if (norms.length === 0) {
            console.log('❌ No norms found.');
            return;
        }

        console.log(`Found ${norms.length} norms.`);

        // 2. Count fragments for each norm
        for (const norm of norms) {
            const countRes = await client.query(
                'SELECT count(*) FROM raw_norm_fragments WHERE "normSourceId" = $1',
                [norm.id]
            );
            const count = countRes.rows[0].count;
            console.log(`   📚 [${norm.code}] ${norm.title}`);
            console.log(`       ID: ${norm.id}`);
            console.log(`       Fragments: ${count}`);
        }

        // 3. Check for orphaned fragments
        const orphanedRes = await client.query(`
            SELECT count(*) FROM raw_norm_fragments 
            WHERE "normSourceId" NOT IN (SELECT id FROM norm_sources)
        `);
        console.log(`\n👻 Orphaned Fragments (linked to non-existent norm): ${orphanedRes.rows[0].count}`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkRelations();
