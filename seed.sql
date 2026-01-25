-- ============================================================================
-- SEED DATA FOR DIGITAL AUDIT SYSTEM
-- ============================================================================

-- 1. SYSTEMS
INSERT INTO "systems" ("id", "systemId", "name", "nameRu", "nameKz", "scopeDefault", "defectPrefix", "protocolPrefix", "photoPrefix", "order", "updatedAt") VALUES
('sys_aps',  'APS',  'Fire Alarm System',              'Автоматическая пожарная сигнализация',      'Автоматты өрт сигнализациясы',          true,  'APS-D',  'TP-APS',  'PHT-APS',  1, NOW()),
('sys_soue', 'SOUE', 'Fire Alarm & Evacuation System', 'Система оповещения и управления эвакуацией', 'Хабарлау және эвакуацияны басқару жүйесі', true,  'SOUE-D', 'TP-SOUE', 'PHT-SOUE', 2, NOW()),
('sys_cctv', 'CCTV', 'Video Surveillance System',      'Система видеонаблюдения (СОТ)',             'Бейнебақылау жүйесі',                       true,  'CCTV-D', 'TP-CCTV', 'PHT-CCTV', 3, NOW()),
('sys_acs',  'ACS',  'Access Control System',          'Система контроля и управления доступом (СКУД)', 'Қатынасты бақылау және басқару жүйесі', true,  'ACS-D',  'TP-ACS',  'PHT-ACS',  4, NOW()),
('sys_os',   'OS',   'Security Alarm System',          'Охранная сигнализация',                      'Қорғаныс сигнализациясы',                  false, 'OS-D',   'TP-OS',   'PHT-OS',   5, NOW()),
('sys_scs',  'SCS',  'Structured Cabling System',      'Структурированная кабельная система (СКС)',  'Құрылымдық кабельдік жүйе',                false, 'SCS-D',  'TP-SCS',  'PHT-SCS',  6, NOW())
ON CONFLICT ("systemId") DO NOTHING;

-- 2. DEFECT TYPES
INSERT INTO "defect_types" ("id", "code", "name", "nameRu", "defaultActionGroup", "romWorkType") VALUES
('dt_inst', 'INSTALLATION',  'Installation Issue',      'Проблема монтажа',           'Монтаж',        'installation'),
('dt_conf', 'CONFIGURATION', 'Configuration Issue',     'Проблема конфигурации',      'Пусконаладка',  'configuration'),
('dt_doc',  'DOCUMENTATION', 'Documentation Issue',     'Проблема документации',      'Документы',     'documentation'),
('dt_maint','MAINTENANCE',   'Maintenance Issue',       'Проблема обслуживания',      'Обслуживание',  'maintenance'),
('dt_pwr',  'POWER',         'Power Supply Issue',      'Проблема питания',           'Электропитание','power'),
('dt_lbl',  'LABELING',      'Labeling Issue',          'Проблема маркировки',        'Маркировка',    'labeling'),
('dt_test', 'TESTING',       'Testing Issue',           'Проблема испытаний',         'Испытания',     'testing'),
('dt_mon',  'MONITORING',    'Monitoring/Logs Issue',   'Проблема мониторинга/журналов', 'Мониторинг', 'monitoring')
ON CONFLICT ("code") DO NOTHING;

-- 3. SEVERITY LEVELS
INSERT INTO "severity_levels" ("id", "level", "impactMin", "impactMax", "likelihoodMin", "likelihoodMax", "defaultDueDays", "requiresRisk", "requiresClosure", "color", "order") VALUES
('sl_crit', 'CRITICAL', 4, 4, 3, 4, 30,  true,  true,  '#DC2626', 1),
('sl_high', 'HIGH',     3, 4, 2, 4, 90,  true,  true,  '#F59E0B', 2),
('sl_med',  'MEDIUM',   2, 3, 2, 3, 180, false, false, '#3B82F6', 3),
('sl_low',  'LOW',      1, 2, 1, 2, 365, false, false, '#10B981', 4)
ON CONFLICT ("level") DO NOTHING;

-- 4. NA REASONS
INSERT INTO "na_reasons" ("id", "code", "text", "textRu", "needsComment", "order") VALUES
('nr_proj', 'NOT_IN_PROJECT',      'Not provided in project',              'Не предусмотрено проектом',           false, 1),
('nr_sub',  'SUBSYSTEM_ABSENT',    'Subsystem not present',                'Подсистема отсутствует',              false, 2),
('nr_acc',  'ZONE_INACCESSIBLE',   'Zone inaccessible',                    'Зона недоступна',                     true,  3),
('nr_conf', 'NOT_APPLICABLE_CONFIG','Not applicable to system configuration','Не применимо к конфигурации системы', true,  4),
('nr_exc',  'SCOPE_EXCLUSION',     'Excluded from audit scope',            'Исключено рамками аудита',            false, 5),
('nr_perm', 'REQUIRES_PERMISSION', 'Requires separate access/permission',  'Требует отдельного доступа/разрешения',true,  6)
ON CONFLICT ("code") DO NOTHING;

-- 5. EVIDENCE TYPES
INSERT INTO "evidence_types" ("id", "code", "name", "isMandatoryOnFail", "allowedFormats") VALUES
('et_ph',   'photo',       'Photo',                 false, ARRAY['jpg', 'jpeg', 'png', 'heic']),
('et_prot', 'protocol',    'Test Protocol',         false, ARRAY['pdf']),
('et_meas', 'measurement', 'Measurement Data',      false, ARRAY['pdf', 'xlsx', 'csv']),
('et_log',  'log',         'System Log/Screenshot', false, ARRAY['jpg', 'png', 'pdf']),
('et_doc',  'document',    'Document Reference',    false, ARRAY['pdf', 'docx']),
('et_vid',  'video',       'Video',                 false, ARRAY['mp4', 'mov', 'avi'])
ON CONFLICT ("code") DO NOTHING;

-- 6. CUSTOMER DOC TYPES
INSERT INTO "customer_doc_types" ("id", "code", "name", "nameRu", "required", "appliesToSystems", "acceptsSubstitutes", "order") VALUES
('cdt_proj', 'PROJECT',          'Project Documentation',    'Проектная документация',     true,  ARRAY['APS', 'SOUE', 'CCTV', 'ACS'], false, 1),
('cdt_ab',   'AS_BUILT',         'As-Built Documentation',   'Исполнительная документация',true,  ARRAY['APS', 'SOUE', 'CCTV', 'ACS'], true,  2),
('cdt_com',  'COMMISSIONING',    'Commissioning Acts',       'Акты ПНР',                   true,  ARRAY['APS', 'SOUE'],                false, 3),
('cdt_log',  'MAINTENANCE_LOG',  'Maintenance Logs',         'Журналы ТО/ППР',             true,  ARRAY['APS', 'SOUE'],                false, 4),
('cdt_cert', 'CERTIFICATES',     'Equipment Certificates',   'Сертификаты оборудования',   false, ARRAY['APS', 'SOUE'],                true,  5),
('cdt_prot', 'PROTOCOLS',        'Test Protocols',           'Протоколы испытаний',        false, ARRAY['APS', 'SOUE'],                false, 6),
('cdt_man',  'MANUALS',          'User Manuals',             'Руководства пользователя',   false, ARRAY['APS', 'SOUE', 'CCTV', 'ACS'], true,  7)
ON CONFLICT ("code") DO NOTHING;

-- 7. DEMO USERS
INSERT INTO "persons" ("id", "personId", "fullName", "role", "organization", "contact", "permissions", "updatedAt") VALUES
('p_la', 'PERSON-LA-001', 'Главный Аудитор (Demo)', 'LA', 'ISB Инжиниринг', 'demo@isb.kz', ARRAY['ALL'], NOW()),
('p_fe', 'PERSON-FE-001', 'Полевой Инженер (Demo)', 'FE', 'ISB Инжиниринг', 'field@isb.kz', ARRAY['FIELD_AUDIT'], NOW())
ON CONFLICT ("personId") DO NOTHING;
