-- ============================================================================
-- МИГРАЦИЯ: Добавление таблицы raw_norm_fragments
-- ============================================================================
-- Универсальная архитектура парсинга нормативных документов
-- PDF → RawNormFragments → Review → Requirements
-- ============================================================================

BEGIN;

-- Таблица для сырых фрагментов норм
CREATE TABLE IF NOT EXISTS raw_norm_fragments (
    id TEXT PRIMARY KEY,
    "fragmentId" TEXT UNIQUE NOT NULL,
    "normSourceId" TEXT NOT NULL,
    "sourceSection" TEXT,
    "sourceClause" TEXT,
    "rawText" TEXT NOT NULL,
    "detectedModality" TEXT,
    "detectedConditions" TEXT[],
    "detectedParameters" JSONB,
    "predictedRequirementType" TEXT,
    "confidenceScore" DECIMAL(3,2),
    status TEXT DEFAULT 'PENDING',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "reviewedBy" TEXT,
    "convertedToRequirementId" TEXT,
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT fk_norm_source 
        FOREIGN KEY ("normSourceId") 
        REFERENCES norm_sources(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_requirement 
        FOREIGN KEY ("convertedToRequirementId") 
        REFERENCES requirements(id) 
        ON DELETE SET NULL
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_raw_fragments_norm_source 
    ON raw_norm_fragments("normSourceId");

CREATE INDEX IF NOT EXISTS idx_raw_fragments_status 
    ON raw_norm_fragments(status);

CREATE INDEX IF NOT EXISTS idx_raw_fragments_confidence 
    ON raw_norm_fragments("confidenceScore" DESC);

CREATE INDEX IF NOT EXISTS idx_raw_fragments_clause 
    ON raw_norm_fragments("sourceClause");

-- Комментарии
COMMENT ON TABLE raw_norm_fragments IS 
'Сырые фрагменты норм, извлеченные AI-парсером перед преобразованием в Requirements';

COMMENT ON COLUMN raw_norm_fragments.status IS 
'PENDING | APPROVED | REJECTED | CONVERTED';

COMMENT ON COLUMN raw_norm_fragments."predictedRequirementType" IS 
'constructive | functional | parameterized | operational | prohibitive | conditional | base | undefined';

COMMIT;

-- ============================================================================
-- ИТОГО:
-- - Создана таблица raw_norm_fragments
-- - Добавлены индексы для быстрого поиска
-- - Настроены внешние ключи
-- ============================================================================
