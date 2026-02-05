-- Миграция: добавление колонок tags и check_method
-- Дата: 2026-02-05

ALTER TABLE raw_norm_fragments 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

ALTER TABLE raw_norm_fragments 
ADD COLUMN IF NOT EXISTS check_method TEXT;
