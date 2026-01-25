require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addAllFireSystems() {
    console.log('\n🔥 Добавление ВСЕХ систем ПБ согласно СН/СП РК...\n');

    const systems = [
        // Уже существуют: APS, SOUE, но добавим на всякий случай
        {
            systemId: 'APS',
            name: 'Automatic Fire Alarm',
            nameRu: 'АПС',
            nameKz: 'Өрт дабылы',
            description: 'Система автоматической пожарной сигнализации',
            order: 1
        },
        {
            systemId: 'SOUE',
            name: 'Fire Warning & Evacuation',
            nameRu: 'СОУЭ',
            nameKz: 'ХЭБЖ',
            description: 'Система оповещения и управления эвакуацией людей при пожаре',
            order: 2
        },
        {
            systemId: 'AUPT',
            name: 'Automatic Fire Suppression',
            nameRu: 'АУПТ',
            nameKz: 'АӨСҚ',
            description: 'Автоматические установки пожаротушения',
            order: 3
        },
        {
            systemId: 'SMOKE_CONTROL',
            name: 'Smoke Control System',
            nameRu: 'Противодымная защита',
            nameKz: 'Түтіннен қорғау',
            description: 'Система противодымной защиты зданий и сооружений',
            order: 4
        },
        {
            systemId: 'FIRE_WATER_INT',
            name: 'Internal Fire Water Supply',
            nameRu: 'ВПВ',
            nameKz: 'ІӨС',
            description: 'Внутренний противопожарный водопровод',
            order: 5
        },
        {
            systemId: 'FIRE_WATER_EXT',
            name: 'External Fire Water Supply',
            nameRu: 'Наружное ПВ',
            nameKz: 'Сыртқы ӨС',
            description: 'Наружное противопожарное водоснабжение',
            order: 6
        },
        {
            systemId: 'FIRE_POWER',
            name: 'Fire Safety Power Supply',
            nameRu: 'Электроснабжение ПБ',
            nameKz: 'ӨҚ электрмен жабдықтау',
            description: 'Электроснабжение систем противопожарной защиты',
            order: 7
        },
        {
            systemId: 'FIRE_CABLES',
            name: 'Fire Safety Cable Lines',
            nameRu: 'Кабельные линии ПБ',
            nameKz: 'ӨҚ кабель желілері',
            description: 'Кабельные линии и огнестойкие трассы систем ПБ',
            order: 8
        },
        {
            systemId: 'FIRE_BARRIERS',
            name: 'Fire Barriers',
            nameRu: 'Противопожарные преграды',
            nameKz: 'Өрт кедергілері',
            description: 'Противопожарные стены, перегородки, перекрытия, двери, ворота, люки',
            order: 9
        },
        {
            systemId: 'FIRE_PRIMARY',
            name: 'Primary Fire Fighting Means',
            nameRu: 'Первичные средства',
            nameKz: 'Бастапқы құралдар',
            description: 'Первичные средства пожаротушения',
            order: 10
        },
        {
            systemId: 'FIRE_CONTROL',
            name: 'Fire Protection Control System',
            nameRu: 'Управление ПЗ',
            nameKz: 'ӨҚ басқару',
            description: 'Автоматическое управление системами противопожарной защиты',
            order: 11
        },
        {
            systemId: 'FIRE_MONITORING',
            name: 'Fire Monitoring & Dispatch',
            nameRu: 'Передача извещений',
            nameKz: 'Хабарламаларды жіберу',
            description: 'Система передачи извещений о пожаре и диспетчеризации',
            order: 12
        },
        {
            systemId: 'FIRE_GENERAL',
            name: 'Fire Safety General',
            nameRu: 'Общие требования ПБ',
            nameKz: 'ӨҚ жалпы талаптары',
            description: 'Общие требования пожарной безопасности',
            order: 0
        }
    ];

    let added = 0;
    let skipped = 0;

    for (const sys of systems) {
        console.log(`Добавление: ${sys.nameRu} (${sys.systemId})...`);

        const { data, error } = await supabase
            .from('systems')
            .insert({
                id: crypto.randomUUID(),
                systemId: sys.systemId,
                name: sys.name,
                nameRu: sys.nameRu,
                nameKz: sys.nameKz,
                status: 'ACTIVE',
                order: sys.order,
                defectPrefix: sys.systemId.substring(0, 3),
                protocolPrefix: sys.systemId.substring(0, 3),
                photoPrefix: sys.systemId.substring(0, 3),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                console.log(`   ⚠️  Уже существует`);
                skipped++;
            } else {
                console.error(`   ❌ Ошибка:`, error.message);
            }
        } else {
            console.log(`   ✅ Добавлено`);
            added++;
        }
    }

    console.log(`\n📊 Результат: добавлено ${added}, пропущено ${skipped}\n`);
    console.log('📋 Все системы ПБ в базе:\n');

    const { data: allSystems } = await supabase
        .from('systems')
        .select('systemId, nameRu, status')
        .in('systemId', systems.map(s => s.systemId))
        .order('order');

    if (allSystems) {
        allSystems.forEach((s, idx) => {
            console.log(`${(idx + 1).toString().padStart(2, ' ')}. ${s.systemId.padEnd(20)} - ${s.nameRu}`);
        });
    }

    console.log('\n✅ Готово!');
}

addAllFireSystems();
