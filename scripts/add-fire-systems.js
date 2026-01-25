require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addFireSafetySystems() {
    console.log('\n🔥 Добавление систем пожарной безопасности...\n');

    const systems = [
        {
            systemId: 'FIRE_GENERAL',
            name: 'Fire Safety General',
            nameRu: 'Общие требования ПБ',
            nameKz: 'Өрт қауіпсіздігінің жалпы талаптары',
            order: 100
        },
        {
            systemId: 'FIRE_EXTINGUISH',
            name: 'Fire Extinguishing',
            nameRu: 'Автомат. пожаротушение',
            nameKz: 'Автоматты өрт сөндіру',
            order: 101
        },
        {
            systemId: 'SMOKE_CONTROL',
            name: 'Smoke Control',
            nameRu: 'Противодымная защита',
            nameKz: 'Түтіннен қорғау',
            order: 102
        },
        {
            systemId: 'EVACUATION',
            name: 'Evacuation',
            nameRu: 'Эвакуация',
            nameKz: 'Эвакуация',
            order: 103
        },
        {
            systemId: 'FIRE_POWER',
            name: 'Fire Power Supply',
            nameRu: 'Электроснабжение ПБ',
            nameKz: 'ӨҚ электрмен жабдықтау',
            order: 104
        }
    ];

    for (const sys of systems) {
        console.log(`Добавление: ${sys.nameRu}...`);

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
                photoPrefix: sys.systemId.substring(0, 3)
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                console.log(`   ⚠️  Уже существует`);
            } else {
                console.error(`   ❌ Ошибка:`, error.message);
            }
        } else {
            console.log(`   ✅ Добавлено (ID: ${data.id})`);
        }
    }

    console.log('\n📊 Все системы в базе:\n');

    const { data: allSystems } = await supabase
        .from('systems')
        .select('systemId, nameRu, status')
        .order('order');

    if (allSystems) {
        allSystems.forEach((s, idx) => {
            console.log(`${idx + 1}. ${s.systemId.padEnd(20)} - ${s.nameRu}`);
        });
    }

    console.log('\n✅ Готово!');
}

addFireSafetySystems();
