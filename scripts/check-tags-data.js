require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function checkTags() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`
            SELECT id, tags, "requirementTextShort" 
            FROM requirements 
            WHERE tags IS NOT NULL AND cardinality(tags) > 0
            LIMIT 5;
        `);
        console.log('Requirements with Tags:', res.rows.length);
        res.rows.forEach(r => console.log(`- [${r.tags.join(', ')}] ${r.requirementTextShort.substring(0, 50)}...`));

        const res2 = await client.query(`
            SELECT count(*) FROM requirements WHERE tags IS NULL OR cardinality(tags) = 0;
        `);
        console.log('Requirements without Tags:', res2.rows[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkTags();
