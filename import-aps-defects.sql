-- ============================================================================
-- ИМПОРТ ДЕФЕКТОВ АПС - АСТАНА ОПЕРА
-- ============================================================================
-- Проект: Астана Опера
-- Project ID: d217668c-f97c-422e-bcbe-afb0c5403eea
-- Дата: 2025-01-25
-- Всего дефектов: 20
-- ============================================================================

BEGIN;

-- Step 1: Создать Audit для проекта
INSERT INTO audits (
    id,
    "auditId",
    "objectName",
    "objectAddress",
    "customerName",
    "systemsInScope",
    "scopeDepth",
    status,
    "preAuditStatus",
    "fieldStatus",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'AUDIT-ASTANA-OPERA-2025',
    'Астана Опера',
    'г. Астана, улица Динмухамед Конаев 1',
    'Государственный театр оперы и балета "Астана Опера"',
    ARRAY['APS', 'SOUE', 'AUPT'],
    'STANDARD',
    'IN_PROGRESS',
    'COMPLETED',
    'IN_PROGRESS',
    NOW(),
    NOW()
)
ON CONFLICT ("auditId") DO NOTHING;

-- Step 2: Импорт дефектов АПС (20 штук)

-- Defect 1: Резервное питание
INSERT INTO defects (
    id,
    "defectId",
    "auditId",
    "systemId",
    "defectFact",
    "noncomplianceStatement",
    recommendation,
    impact,
    likelihood,
    "defectStatus",
    "actionStatus",
    "photoIds",
    "protocolIds",
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'APS-D-0001',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'),
    'APS',
    'Резервное питание не обеспечивает нормативное время работы',
    NULL,
    'Заменить аккумуляторные батареи по сроку службы',
    4,
    4,
    'IN_REVIEW',
    'NOT_STARTED',
    ARRAY[]::text[],
    ARRAY[]::text[],
    NOW(),
    NOW()
);

-- Defect 2: Индикация ППКП
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0002',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Индикация «Пожар / Неисправность» отображается, но корректность настройки не подтверждена',
    'Проверить и откорректировать настройки ППКП', 2, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 3: Передача сигнала нестабильна
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0003',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Автоматическая передача сигнала «Пожар» нестабильна',
    'Проверить логику, интерфейсы и корректность работы датчиков', 4, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 4: АКБ
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0004',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Срок службы аккумуляторных батарей превышен',
    'Произвести замену аккумуляторных батарей', 3, 4,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 5: Линии LSN
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0005',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Выявлена неисправность кольцевых линий LSN',
    'Выявить причину и устранить неисправности линий связи', 3, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 6: Расчёт нагрузки
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0006',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Расчёт нагрузки по току отсутствует',
    'Выполнить расчёт нагрузки и перераспределить адресные устройства', 3, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 7: Адресная карта
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0007',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Актуальная адресная карта системы отсутствует',
    'Актуализировать адресную карту устройств', 2, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 8: Извещатели не срабатывают (CRITICAL)
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0008',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Часть извещателей не срабатывает при тестировании',
    'Провести диагностику и заменить неисправные извещатели', 4, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 9: Линейные извещатели
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0009',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Юстировка и чувствительность не подтверждены',
    'Выполнить настройку и юстировку линейных извещателей', 3, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 10: Интерфейсные модули
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0010',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Передача сигналов управления нестабильна',
    'Выполнить диагностику и восстановить стабильную связь', 3, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 11: Интеграция систем (CRITICAL)
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0011',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Запуск смежных систем по сигналу «Пожар» не всегда корректен',
    'Восстановить корректную логику взаимодействия систем', 4, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 12: ПО ППК
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0012',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Версия программного обеспечения не актуальна',
    'Обновить программное обеспечение ППК', 2, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 13: Fire Monitoring
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0013',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Программное обеспечение устарело, графический план не соответствует зданию',
    'Обновить ПО и актуализировать графические планы объекта', 3, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 14: Конфигурационные файлы
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0014',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Отсутствуют актуальные конфигурационные файлы системы',
    'Восстановить и задокументировать конфигурационные файлы', 3, 4,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 15: Права доступа
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0015',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Отсутствуют пароли и права доступа для обслуживания системы',
    'Настроить права доступа и администрирования АПС', 3, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 16: Перегрузка линий (CRITICAL)
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0016',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Перегрузка отдельных кольцевых линий и отключение шлейфов в режиме «Пожар»',
    'Перераспределить нагрузку и заменить АКБ резервных источников питания', 4, 4,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 17: Покрытие извещателями (CRITICAL)
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0017',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Имеются неисправные и отключённые извещатели, не во всех помещениях установлены ИП',
    'Восстановить покрытие помещений пожарными извещателями', 4, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 18: Дренчерная завеса (CRITICAL + нарушение ППБ РК п.41)
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", "noncomplianceStatement", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0018',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Дренчерная завеса и противопожарные шторы не запускаются автоматически по сигналу «Пожар»',
    'п.41 ППБ РК',
    'Реализовать автоматический запуск противопожарных устройств от АПС', 4, 3,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 19: Эксплуатационная документация
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", "noncomplianceStatement", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0019',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Отсутствуют журналы ТО, регламенты, акты проверок и инструкции',
    'Приказ МЧС РК №55 п.п.73–75',
    'Разработать и вести полный комплект эксплуатационной документации', 3, 4,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

-- Defect 20: Техническое освидетельствование (CRITICAL + нарушение)
INSERT INTO defects (
    id, "defectId", "auditId", "systemId", "defectFact", "noncomplianceStatement", recommendation, impact, likelihood,
    "defectStatus", "actionStatus", "photoIds", "protocolIds", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid(), 'APS-D-0020',
    (SELECT id FROM audits WHERE "auditId" = 'AUDIT-ASTANA-OPERA-2025'), 'APS',
    'Техническое освидетельствование АПС в нормативные сроки не проведено',
    'Приказ МЧС РК №55 п.п.73–75',
    'Провести техническое освидетельствование и подтвердить соответствие требованиям ПБ', 4, 4,
    'IN_REVIEW', 'NOT_STARTED', ARRAY[]::text[], ARRAY[]::text[], NOW(), NOW()
);

COMMIT;

-- ============================================================================
-- ИТОГО:
-- - Создан Audit: AUDIT-ASTANA-OPERA-2025
-- - Импортировано 20 дефектов АПС
-- - 7 CRITICAL (impact 4)
-- - 10 HIGH (impact 3)
-- - 3 MEDIUM (impact 2)
-- ============================================================================
