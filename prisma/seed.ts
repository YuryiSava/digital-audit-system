import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // ============================================================================
    // SYSTEMS (Системы)
    // ============================================================================
    console.log('📦 Seeding Systems...');

    const systems = [
        {
            systemId: 'APS',
            name: 'Fire Alarm System',
            nameRu: 'Автоматическая пожарная сигнализация',
            nameKz: 'Автоматты өрт сигнализациясы',
            scopeDefault: true,
            defectPrefix: 'APS-D',
            protocolPrefix: 'TP-APS',
            photoPrefix: 'PHT-APS',
            order: 1,
        },
        {
            systemId: 'SOUE',
            name: 'Fire Alarm & Evacuation System',
            nameRu: 'Система оповещения и управления эвакуацией',
            nameKz: 'Хабарлау және эвакуацияны басқару жүйесі',
            scopeDefault: true,
            defectPrefix: 'SOUE-D',
            protocolPrefix: 'TP-SOUE',
            photoPrefix: 'PHT-SOUE',
            order: 2,
        },
        {
            systemId: 'CCTV',
            name: 'Video Surveillance System',
            nameRu: 'Система видеонаблюдения (СОТ)',
            nameKz: 'Бейнебақылау жүйесі',
            scopeDefault: true,
            defectPrefix: 'CCTV-D',
            protocolPrefix: 'TP-CCTV',
            photoPrefix: 'PHT-CCTV',
            order: 3,
        },
        {
            systemId: 'ACS',
            name: 'Access Control System',
            nameRu: 'Система контроля и управления доступом (СКУД)',
            nameKz: 'Қатынасты бақылау және басқару жүйесі',
            scopeDefault: true,
            defectPrefix: 'ACS-D',
            protocolPrefix: 'TP-ACS',
            photoPrefix: 'PHT-ACS',
            order: 4,
        },
        {
            systemId: 'OS',
            name: 'Security Alarm System',
            nameRu: 'Охранная сигнализация',
            nameKz: 'Қорғаныс сигнализациясы',
            scopeDefault: false,
            defectPrefix: 'OS-D',
            protocolPrefix: 'TP-OS',
            photoPrefix: 'PHT-OS',
            order: 5,
        },
        {
            systemId: 'SCS',
            name: 'Structured Cabling System',
            nameRu: 'Структурированная кабельная система (СКС)',
            nameKz: 'Құрылымдық кабельдік жүйе',
            scopeDefault: false,
            defectPrefix: 'SCS-D',
            protocolPrefix: 'TP-SCS',
            photoPrefix: 'PHT-SCS',
            order: 6,
        },
    ];

    for (const system of systems) {
        await prisma.system.upsert({
            where: { systemId: system.systemId },
            update: system,
            create: system,
        });
    }

    // ============================================================================
    // DEFECT TYPES (Типы дефектов)
    // ============================================================================
    console.log('🔧 Seeding Defect Types...');

    const defectTypes = [
        { code: 'INSTALLATION', name: 'Installation Issue', nameRu: 'Проблема монтажа', defaultActionGroup: 'Монтаж', romWorkType: 'installation' },
        { code: 'CONFIGURATION', name: 'Configuration Issue', nameRu: 'Проблема конфигурации', defaultActionGroup: 'Пусконаладка', romWorkType: 'configuration' },
        { code: 'DOCUMENTATION', name: 'Documentation Issue', nameRu: 'Проблема документации', defaultActionGroup: 'Документы', romWorkType: 'documentation' },
        { code: 'MAINTENANCE', name: 'Maintenance Issue', nameRu: 'Проблема обслуживания', defaultActionGroup: 'Обслуживание', romWorkType: 'maintenance' },
        { code: 'POWER', name: 'Power Supply Issue', nameRu: 'Проблема питания', defaultActionGroup: 'Электропитание', romWorkType: 'power' },
        { code: 'LABELING', name: 'Labeling Issue', nameRu: 'Проблема маркировки', defaultActionGroup: 'Маркировка', romWorkType: 'labeling' },
        { code: 'TESTING', name: 'Testing Issue', nameRu: 'Проблема испытаний', defaultActionGroup: 'Испытания', romWorkType: 'testing' },
        { code: 'MONITORING', name: 'Monitoring/Logs Issue', nameRu: 'Проблема мониторинга/журналов', defaultActionGroup: 'Мониторинг', romWorkType: 'monitoring' },
    ];

    for (const type of defectTypes) {
        await prisma.defectType.upsert({
            where: { code: type.code },
            update: type,
            create: type,
        });
    }

    // ============================================================================
    // SEVERITY LEVELS (Уровни критичности)
    // ============================================================================
    console.log('⚠️ Seeding Severity Levels...');

    const severityLevels = [
        {
            level: 'CRITICAL',
            impactMin: 4,
            impactMax: 4,
            likelihoodMin: 3,
            likelihoodMax: 4,
            defaultDueDays: 30,
            requiresRisk: true,
            requiresClosure: true,
            color: '#DC2626',
            order: 1,
        },
        {
            level: 'HIGH',
            impactMin: 3,
            impactMax: 4,
            likelihoodMin: 2,
            likelihoodMax: 4,
            defaultDueDays: 90,
            requiresRisk: true,
            requiresClosure: true,
            color: '#F59E0B',
            order: 2,
        },
        {
            level: 'MEDIUM',
            impactMin: 2,
            impactMax: 3,
            likelihoodMin: 2,
            likelihoodMax: 3,
            defaultDueDays: 180,
            requiresRisk: false,
            requiresClosure: false,
            color: '#3B82F6',
            order: 3,
        },
        {
            level: 'LOW',
            impactMin: 1,
            impactMax: 2,
            likelihoodMin: 1,
            likelihoodMax: 2,
            defaultDueDays: 365,
            requiresRisk: false,
            requiresClosure: false,
            color: '#10B981',
            order: 4,
        },
    ];

    for (const level of severityLevels) {
        await prisma.severityLevel.upsert({
            where: { level: level.level },
            update: level,
            create: level,
        });
    }

    // ============================================================================
    // N/A REASONS (Причины неприменимости)
    // ============================================================================
    console.log('❌ Seeding N/A Reasons...');

    const naReasons = [
        { code: 'NOT_IN_PROJECT', text: 'Not provided in project', textRu: 'Не предусмотрено проектом', needsComment: false, order: 1 },
        { code: 'SUBSYSTEM_ABSENT', text: 'Subsystem not present', textRu: 'Подсистема отсутствует', needsComment: false, order: 2 },
        { code: 'ZONE_INACCESSIBLE', text: 'Zone inaccessible', textRu: 'Зона недоступна', needsComment: true, order: 3 },
        { code: 'NOT_APPLICABLE_CONFIG', text: 'Not applicable to system configuration', textRu: 'Не применимо к конфигурации системы', needsComment: true, order: 4 },
        { code: 'SCOPE_EXCLUSION', text: 'Excluded from audit scope', textRu: 'Исключено рамками аудита', needsComment: false, order: 5 },
        { code: 'REQUIRES_PERMISSION', text: 'Requires separate access/permission', textRu: 'Требует отдельного доступа/разрешения', needsComment: true, order: 6 },
    ];

    for (const reason of naReasons) {
        await prisma.nAReason.upsert({
            where: { code: reason.code },
            update: reason,
            create: reason,
        });
    }

    // ============================================================================
    // EVIDENCE TYPES (Типы доказательств)
    // ============================================================================
    console.log('📸 Seeding Evidence Types...');

    const evidenceTypes = [
        { code: 'photo', name: 'Photo', isMandatoryOnFail: false, allowedFormats: ['jpg', 'jpeg', 'png', 'heic'] },
        { code: 'protocol', name: 'Test Protocol', isMandatoryOnFail: false, allowedFormats: ['pdf'] },
        { code: 'measurement', name: 'Measurement Data', isMandatoryOnFail: false, allowedFormats: ['pdf', 'xlsx', 'csv'] },
        { code: 'log', name: 'System Log/Screenshot', isMandatoryOnFail: false, allowedFormats: ['jpg', 'png', 'pdf'] },
        { code: 'document', name: 'Document Reference', isMandatoryOnFail: false, allowedFormats: ['pdf', 'docx'] },
        { code: 'video', name: 'Video', isMandatoryOnFail: false, allowedFormats: ['mp4', 'mov', 'avi'] },
    ];

    for (const type of evidenceTypes) {
        await prisma.evidenceType.upsert({
            where: { code: type.code },
            update: type,
            create: type,
        });
    }

    // ============================================================================
    // CUSTOMER DOC TYPES (Типы документов заказчика)
    // ============================================================================
    console.log('📄 Seeding Customer Document Types...');

    const customerDocTypes = [
        { code: 'PROJECT', name: 'Project Documentation', nameRu: 'Проектная документация', required: true, appliesToSystems: ['APS', 'SOUE', 'CCTV', 'ACS'], acceptsSubstitutes: false, order: 1 },
        { code: 'AS_BUILT', name: 'As-Built Documentation', nameRu: 'Исполнительная документация', required: true, appliesToSystems: ['APS', 'SOUE', 'CCTV', 'ACS'], acceptsSubstitutes: true, order: 2 },
        { code: 'COMMISSIONING', name: 'Commissioning Acts', nameRu: 'Акты ПНР', required: true, appliesToSystems: ['APS', 'SOUE'], acceptsSubstitutes: false, order: 3 },
        { code: 'MAINTENANCE_LOG', name: 'Maintenance Logs', nameRu: 'Журналы ТО/ППР', required: true, appliesToSystems: ['APS', 'SOUE'], acceptsSubstitutes: false, order: 4 },
        { code: 'CERTIFICATES', name: 'Equipment Certificates', nameRu: 'Сертификаты оборудования', required: false, appliesToSystems: ['APS', 'SOUE'], acceptsSubstitutes: true, order: 5 },
        { code: 'PROTOCOLS', name: 'Test Protocols', nameRu: 'Протоколы испытаний', required: false, appliesToSystems: ['APS', 'SOUE'], acceptsSubstitutes: false, order: 6 },
        { code: 'MANUALS', name: 'User Manuals', nameRu: 'Руководства пользователя', required: false, appliesToSystems: ['APS', 'SOUE', 'CCTV', 'ACS'], acceptsSubstitutes: true, order: 7 },
    ];

    for (const docType of customerDocTypes) {
        await prisma.customerDocType.upsert({
            where: { code: docType.code },
            update: docType,
            create: docType,
        });
    }

    // ============================================================================
    // DEMO PERSON (Демо пользователь)
    // ============================================================================
    console.log('👤 Seeding Demo Person...');

    await prisma.person.upsert({
        where: { personId: 'PERSON-LA-001' },
        update: {},
        create: {
            personId: 'PERSON-LA-001',
            fullName: 'Главный Аудитор (Demo)',
            role: 'LA',
            organization: 'ISB Инжиниринг',
            contact: 'demo@isb.kz',
            permissions: ['ALL'],
        },
    });

    await prisma.person.upsert({
        where: { personId: 'PERSON-FE-001' },
        update: {},
        create: {
            personId: 'PERSON-FE-001',
            fullName: 'Полевой Инженер (Demo)',
            role: 'FE',
            organization: 'ISB Инжиниринг',
            contact: 'field@isb.kz',
            permissions: ['FIELD_AUDIT'],
        },
    });

    console.log('✅ Database seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
