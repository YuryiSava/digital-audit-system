require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addTechnicalSystems() {
    console.log('\n🏗️  Добавление технических систем...\n');

    const systems = [
        // === ОТОПЛЕНИЕ, ВЕНТИЛЯЦИЯ, КОНДИЦИОНИРОВАНИЕ ===
        {
            systemId: 'HVAC',
            name: 'HVAC Systems',
            nameRu: 'ОВиК',
            nameKz: 'ЖВК',
            description: 'Отопление, вентиляция и кондиционирование воздуха',
            order: 200
        },
        {
            systemId: 'HEATING',
            name: 'Heating System',
            nameRu: 'Отопление',
            nameKz: 'Жылыту',
            description: 'Системы отопления',
            order: 201
        },
        {
            systemId: 'VENTILATION',
            name: 'Ventilation System',
            nameRu: 'Вентиляция',
            nameKz: 'Желдету',
            description: 'Системы вентиляции',
            order: 202
        },
        {
            systemId: 'AC',
            name: 'Air Conditioning',
            nameRu: 'Кондиционирование',
            nameKz: 'Кондиционерлеу',
            description: 'Системы кондиционирования',
            order: 203
        },

        // === ВОДОСНАБЖЕНИЕ И КАНАЛИЗАЦИЯ ===
        {
            systemId: 'WATER_SUPPLY',
            name: 'Water Supply',
            nameRu: 'Водоснабжение',
            nameKz: 'Сумен жабдықтау',
            description: 'Системы водоснабжения',
            order: 210
        },
        {
            systemId: 'SEWERAGE',
            name: 'Sewerage System',
            nameRu: 'Канализация',
            nameKz: 'Кәріз',
            description: 'Системы канализации',
            order: 211
        },

        // === ЭЛЕКТРОСНАБЖЕНИЕ ===
        {
            systemId: 'POWER',
            name: 'Power Supply',
            nameRu: 'Электроснабжение',
            nameKz: 'Электрмен жабдықтау',
            description: 'Общее электроснабжение',
            order: 220
        },
        {
            systemId: 'LIGHTING',
            name: 'Lighting System',
            nameRu: 'Освещение',
            nameKz: 'Жарықтандыру',
            description: 'Системы освещения',
            order: 221
        },

        // === СПЕЦИАЛЬНЫЕ СИСТЕМЫ ===
        {
            systemId: 'STAGE_MACHINERY',
            name: 'Stage Machinery',
            nameRu: 'Машинерия сцены',
            nameKz: 'Сахна машинериясы',
            description: 'Сценическое оборудование - подъемно-опускные механизмы, штанкеты, поворотный круг',
            order: 230
        },
        {
            systemId: 'STAGE_LIGHTING',
            name: 'Stage Lighting',
            nameRu: 'Сценическое освещение',
            nameKz: 'Сахналық жарықтандыру',
            description: 'Системы сценического освещения',
            order: 231
        },
        {
            systemId: 'STAGE_SOUND',
            name: 'Stage Sound System',
            nameRu: 'Звуковое оборудование',
            nameKz: 'Дыбыс жүйесі',
            description: 'Системы озвучивания и акустики',
            order: 232
        },

        // === ОБЩИЕ КАТЕГОРИИ ===
        {
            systemId: 'BUILDING',
            name: 'Building Structures',
            nameRu: 'Строительные конструкции',
            nameKz: 'Құрылыс конструкциялары',
            description: 'Строительные конструкции и архитектура',
            order: 300
        },
        {
            systemId: 'GENERAL',
            name: 'General Requirements',
            nameRu: 'Общие требования',
            nameKz: 'Жалпы талаптар',
            description: 'Общие нормативные требования',
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
    console.log('📋 Все технические системы:\n');

    const { data: allSystems } = await supabase
        .from('systems')
        .select('systemId, nameRu, status')
        .order('order');

    if (allSystems) {
        console.log('=== ОБЩИЕ ===');
        allSystems.filter(s => s.systemId === 'GENERAL' || s.systemId === 'FIRE_GENERAL')
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));

        console.log('\n=== ПОЖАРНАЯ БЕЗОПАСНОСТЬ ===');
        allSystems.filter(s => s.systemId.startsWith('FIRE') || s.systemId === 'APS' || s.systemId === 'SOUE' || s.systemId === 'AUPT' || s.systemId === 'SMOKE_CONTROL')
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));

        console.log('\n=== ОВиК ===');
        allSystems.filter(s => s.systemId.startsWith('HVAC') || s.systemId === 'HEATING' || s.systemId === 'VENTILATION' || s.systemId === 'AC')
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));

        console.log('\n=== ВОДОСНАБЖЕНИЕ ===');
        allSystems.filter(s => s.systemId.includes('WATER') || s.systemId === 'SEWERAGE')
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));

        console.log('\n=== ЭЛЕКТРОСНАБЖЕНИЕ ===');
        allSystems.filter(s => s.systemId === 'POWER' || s.systemId === 'LIGHTING')
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));

        console.log('\n=== СЦЕНА И СЦЕНИЧЕСКОЕ ОБОРУДОВАНИЕ ===');
        allSystems.filter(s => s.systemId.startsWith('STAGE'))
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));

        console.log('\n=== СЛАБОТОЧНЫЕ ===');
        allSystems.filter(s => ['CCTV', 'ACS', 'OS', 'SCS'].includes(s.systemId))
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));

        console.log('\n=== ПРОЧИЕ ===');
        allSystems.filter(s => s.systemId === 'BUILDING')
            .forEach(s => console.log(`  ${s.systemId.padEnd(20)} - ${s.nameRu}`));
    }

    console.log('\n✅ Готово!');
    console.log(`\n📊 Всего систем в базе: ${allSystems?.length || 0}`);
}

addTechnicalSystems();
