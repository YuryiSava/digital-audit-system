-- Добавление колонки category в таблицу norm_sources
-- Эта колонка хранит раздел системы (Пожарная безопасность, Электроснабжение и т.д.)

ALTER TABLE norm_sources 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Комментарий для документации
COMMENT ON COLUMN norm_sources.category IS 'Раздел системы: Пожарная безопасность, Электроснабжение, Водоснабжение и др.';
