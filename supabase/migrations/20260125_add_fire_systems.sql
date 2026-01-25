-- Добавление систем пожарной безопасности

-- 1. Общие требования пожарной безопасности
INSERT INTO systems (id, "systemId", name, "nameRu", description, category, status, "order", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'FIRE_GENERAL',
  'Fire Safety General Requirements',
  'Общие требования пожарной безопасности',
  'Общие нормативные требования по пожарной безопасности зданий и сооружений',
  'Fire Safety',
  'ACTIVE',
  100,
  NOW(),
  NOW()
);

-- 2. Автоматическое пожаротушение
INSERT INTO systems (id, "systemId", name, "nameRu", description, category, status, "order", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'FIRE_EXTINGUISH',
  'Automatic Fire Extinguishing Systems',
  'Автоматическое пожаротушение',
  'Системы автоматического пожаротушения',
  'Fire Safety',
  'ACTIVE',
  101,
  NOW(),
  NOW()
);

-- 3. Противодымная защита
INSERT INTO systems (id, "systemId", name, "nameRu", description, category, status, "order", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'SMOKE_CONTROL',
  'Smoke Control Systems',
  'Противодымная защита',
  'Системы противодымной вентиляции и защиты',
  'Fire Safety',
  'ACTIVE',
  102,
  NOW(),
  NOW()
);

-- 4. Эвакуационные пути и выходы
INSERT INTO systems (id, "systemId", name, "nameRu", description, category, status, "order", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'EVACUATION',
  'Evacuation Routes and Exits',
  'Эвакуационные пути и выходы',
  'Требования к путям эвакуации, эвакуационным выходам и освещению',
  'Fire Safety',
  'ACTIVE',
  103,
  NOW(),
  NOW()
);

-- 5. Электроснабжение систем ПБ
INSERT INTO systems (id, "systemId", name, "nameRu", description, category, status, "order", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'FIRE_POWER',
  'Fire Safety Power Supply',
  'Электроснабжение систем ПБ',
  'Требования к электроснабжению систем противопожарной защиты',
  'Fire Safety',
  'ACTIVE',
  104,
  NOW(),
  NOW()
);

-- Проверка
SELECT "systemId", "nameRu", category, status 
FROM systems 
WHERE category = 'Fire Safety'
ORDER BY "order";
