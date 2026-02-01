require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupDemo() {
    console.log('🚀 Setting up demo norm...');

    const nid = uuidv4();
    // 1. Create Norm Source
    const normSource = {
        id: nid,
        normSourceId: 'NS-DEMO-2026',
        code: 'DEMO-2026',
        title: 'Демонстрационный стандарт безопасности',
        docType: 'Стандарт',
        jurisdiction: 'KZ',
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
    };

    const { error: nErr } = await supabase.from('norm_sources').upsert(normSource);
    if (nErr) { console.error('Norm Error:', nErr); return; }
    console.log('✅ Norm Source created:', nid);

    // 2. Create Requirement Set
    const rsid = uuidv4();
    const reqSet = {
        id: rsid,
        requirementSetId: 'RS-DEMO-2026',
        systemId: 'APS', // Use generic APS
        jurisdiction: 'KZ',
        version: '1.0',
        status: 'DRAFT',
        updatedAt: new Date().toISOString()
    };
    const { error: rsErr } = await supabase.from('requirement_sets').upsert(reqSet);
    if (rsErr) { console.error('RS Error:', rsErr); return; }
    console.log('✅ Requirement Set created:', rsid);

    // 3. Add 3 raw requirements
    const requirements = [
        {
            id: uuidv4(),
            requirementId: 'REQ-DEMO-001',
            requirementSetId: rsid,
            systemId: 'APS',
            normSourceId: nid,
            clause: '5.1.2',
            requirementTextShort: 'Расстояние между оросителями должно быть не более 3 метров.',
            checkMethod: 'visual',
            mustCheck: true,
            updatedAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            requirementId: 'REQ-DEMO-002',
            requirementSetId: rsid,
            systemId: 'APS',
            normSourceId: nid,
            clause: '6.3.1',
            requirementTextShort: 'Не допускается установка датчиков вблизи приточных вентиляционных отверстий.',
            checkMethod: 'visual',
            mustCheck: true,
            updatedAt: new Date().toISOString()
        },
        {
            id: uuidv4(),
            requirementId: 'REQ-DEMO-003',
            requirementSetId: rsid,
            systemId: 'APS',
            normSourceId: nid,
            clause: '7.4',
            requirementTextShort: 'Сопротивление изоляции кабелей должно быть не менее 50 Мом.',
            checkMethod: 'visual',
            mustCheck: true,
            updatedAt: new Date().toISOString()
        }
    ];

    const { error: reqErr } = await supabase.from('requirements').insert(requirements);
    if (reqErr) { console.error('Req Error:', reqErr); return; }

    console.log('✅ 3 Requirements added');
    console.log('ID документа для обогащения:', nid);
}

setupDemo();
