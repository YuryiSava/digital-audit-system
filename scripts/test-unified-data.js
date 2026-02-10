require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function testUnifiedFetch() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Get a project ID to test with
        const { rows: projects } = await client.query(`SELECT id, name FROM projects LIMIT 1`);
        if (projects.length === 0) {
            console.log('❌ No projects found to test');
            return;
        }
        const projectId = projects[0].id;
        console.log(`Testing with Project: ${projects[0].name} (${projectId})`);

        // 2. Fetch checklists manually to compare
        const { rows: checklists } = await client.query(`SELECT id, "requirementSetId" FROM audit_checklists WHERE "projectId" = $1`, [projectId]);
        console.log(`Found ${checklists.length} checklists`);

        // 3. Simulate the JOIN logic from the server action
        console.log('Fetching aggregated results...');
        const query = `
            SELECT 
                r.id, 
                r.status, 
                req."systemId",
                req.tags,
                s.name as "systemName"
            FROM audit_results r
            JOIN audit_checklists c ON r."checklistId" = c.id
            JOIN requirements req ON r."requirementId" = req.id
            LEFT JOIN requirement_sets rs ON req."requirementSetId" = rs.id
            LEFT JOIN systems s ON req."systemId" = s."systemId"
            WHERE c."projectId" = $1
        `;

        const { rows: results } = await client.query(query, [projectId]);

        console.log(`✅ Total results: ${results.length}`);

        // Group by system
        const bySystem = {};
        results.forEach(r => {
            const sys = r.systemName || r.systemId || 'UNKNOWN';
            if (!bySystem[sys]) bySystem[sys] = 0;
            bySystem[sys]++;
        });

        console.log('📊 Breakdown by System:');
        Object.entries(bySystem).forEach(([sys, count]) => {
            console.log(`  - ${sys}: ${count} items`);
        });

        // Check if tags are present
        const withTags = results.filter(r => r.tags && r.tags.length > 0).length;
        console.log(`🏷️ Items with tags: ${withTags} / ${results.length}`);

    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await client.end();
    }
}

testUnifiedFetch();
