const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Портативный бэкап DAS (v0.5.1)
 * Не требует pg_dump. Экспортирует все таблицы в JSON.
 */

const BACKUP_DIR = path.join(process.cwd(), 'backups');

async function createPortableBackup() {
    console.log('📦 Starting Portable Database Backup (JSON)...');

    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `das_data_backup_${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('❌ Error: DATABASE_URL not found in .env');
        return;
    }

    const client = new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false } // Нужно для Supabase
    });

    try {
        await client.connect();
        console.log('   - Connected to database.');

        // Получаем список всех таблиц в схеме public
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        `);

        const tables = tablesRes.rows.map(r => r.table_name);
        const backupData = {
            metadata: {
                timestamp: new Date().toISOString(),
                version: "0.5.1",
                tables_count: tables.length
            },
            data: {}
        };

        for (const table of tables) {
            console.log(`   - Exporting table: ${table}...`);
            const dataRes = await client.query(`SELECT * FROM "${table}"`);
            backupData.data[table] = dataRes.rows;
        }

        fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
        console.log(`✅ Backup saved to: ${filePath}`);

        // Ротация: оставляем только 5 последних
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('das_data_backup_'))
            .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 5) {
            files.slice(5).forEach(f => {
                fs.unlinkSync(path.join(BACKUP_DIR, f.name));
                console.log(`   - Deleted old backup: ${f.name}`);
            });
        }

    } catch (err) {
        console.error('❌ Backup failed:', err.message);
    } finally {
        await client.end();
    }
}

createPortableBackup();
