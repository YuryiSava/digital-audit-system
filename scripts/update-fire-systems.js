require('dotenv').config({ path: '.env' });
const { Client } = require('pg');

async function checkAndUpdateSystems() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // Проверяем текущие значения
        console.log('📋 Текущие значения:');
        const { rows } = await client.query(`SELECT "systemId", "nameRu", name FROM systems WHERE "systemId" IN ('AGPT','APPT','AVPT','FIRE_WATER_INT')`);
        rows.forEach((r) => console.log(`  ${r.systemId}: nameRu="${r.nameRu}", name="${r.name}"`));

        // Обновляем nameRu с полной расшифровкой
        console.log('\n🔧 Обновляем nameRu...');
        const updates = [
            { systemId: 'AGPT', nameRu: 'АГПТ - Автоматическое газовое пожаротушение' },
            { systemId: 'APPT', nameRu: 'АППТ - Автоматическое порошковое пожаротушение' },
            { systemId: 'AVPT', nameRu: 'АВПТ - Автоматическое водяное (пенное) пожаротушение' },
            { systemId: 'FIRE_WATER_INT', nameRu: 'ВПВ - Внутренний пожарный водопровод' }
        ];

        for (const sys of updates) {
            await client.query(`UPDATE systems SET "nameRu" = $1, "updatedAt" = NOW() WHERE "systemId" = $2`, [sys.nameRu, sys.systemId]);
            console.log(`  ✅ ${sys.systemId} обновлен`);
        }

        // Проверяем после обновления
        console.log('\n📋 После обновления:');
        const { rows: updated } = await client.query(`SELECT "systemId", "nameRu" FROM systems WHERE "systemId" IN ('AGPT','APPT','AVPT','FIRE_WATER_INT')`);
        updated.forEach((r) => console.log(`  ${r.systemId}: ${r.nameRu}`));

        console.log('\n✅ Готово!');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        await client.end();
    }
}

checkAndUpdateSystems();
