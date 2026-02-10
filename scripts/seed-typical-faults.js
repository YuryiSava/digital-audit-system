require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SEED_DATA = {
    document: [
        "Отсутствует",
        "Истек срок действия",
        "Не утверждено",
        "Не соответствует нормам",
        "Нет подписи/печати"
    ],
    visual: [
        "Механическое повреждение",
        "Загрязнено",
        "Не закреплено",
        "Отсутствует маркировка",
        "Загорожено / Нет доступа"
    ],
    fire_extinguisher: [
        "Нет пломбы",
        "Нет чеки",
        "Давление ниже нормы",
        "Требует перезарядки"
    ]
};

async function seedTypicalFaults() {
    console.log("🌱 Seeding typical faults...");

    // 1. Fetch all requirements
    const { data: requirements, error } = await supabase
        .from('requirements')
        .select('*');

    if (error) {
        console.error("Error fetching requirements:", error);
        return;
    }

    console.log(`Found ${requirements.length} requirements. Updating...`);

    let updatedCount = 0;

    for (const req of requirements) {
        let faults = [];

        // Logic to determine faults based on checkMethod and context (tags/text)
        if (req.checkMethod === 'document') {
            faults = [...SEED_DATA.document];
        } else if (req.checkMethod === 'visual') {
            faults = [...SEED_DATA.visual];

            // Heuristic for fire extinguishers
            const text = (req.requirementTextShort + " " + req.clause).toLowerCase();
            if (text.includes('огнетушител') || (req.tags && req.tags.some(t => t.includes('огнетуш')))) {
                faults = [...faults, ...SEED_DATA.fire_extinguisher];
            }
        } else {
            // Default visual for others
            faults = [...SEED_DATA.visual];
        }

        // Only update if currently empty (to not overwrite future custom ones if any)
        if (!req.typical_faults || req.typical_faults.length === 0) {
            const { error: updateError } = await supabase
                .from('requirements')
                .update({ typical_faults: faults })
                .eq('id', req.id);

            if (updateError) {
                console.error(`Failed to update ${req.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(`✅ Updated ${updatedCount} requirements with default faults.`);
}

seedTypicalFaults();
