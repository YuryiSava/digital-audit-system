#!/usr/bin/env node
/**
 * Выполнить SQL скрипт импорта дефектов
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function executeSQLFile() {
    console.log('\n🏛️  ВЫПОЛНЕНИЕ SQL ИМПОРТА ДЕФЕКТОВ АПС\n');
    console.log('='.repeat(70) + '\n');

    try {
        // Read SQL file
        console.log('📂 Reading SQL file...');
        const sql = await fs.readFile('import-aps-defects.sql', 'utf-8');
        console.log(`   ✅ Loaded SQL (${sql.length} chars)\n`);

        // Execute SQL
        console.log('⚡ Executing SQL...\n');

        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            console.error('❌ SQL Error:', error);
            throw error;
        }

        console.log('='.repeat(70));
        console.log('✅ SQL ВЫПОЛНЕН УСПЕШНО!\n');
        console.log('📊 Результат:');
        console.log('   - Создан Audit: AUDIT-ASTANA-OPERA-2025');
        console.log('   - Импортировано 20 дефектов АПС');
        console.log('\n🌐 Откройте проект:');
        console.log('   http://localhost:3000/projects/d217668c-f97c-422e-bcbe-afb0c5403eea\n');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('\n❌ ОШИБКА:', error.message);
        console.error('\n💡 РЕШЕНИЕ: Выполните SQL вручную через Supabase SQL Editor:');
        console.error('   1. Откройте: https://supabase.com/dashboard');
        console.error('   2. Перейдите в SQL Editor');
        console.error('   3. Скопируйте содержимое файла: import-aps-defects.sql');
        console.error('   4. Выполните SQL\n');
        process.exit(1);
    }
}

executeSQLFile();
