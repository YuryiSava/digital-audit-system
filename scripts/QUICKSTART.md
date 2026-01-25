# Быстрый старт External PDF Parser

## Как запустить прямо сейчас:

### Шаг 1: Откройте ваш норматив в браузере
```
http://localhost:3000/norm-library
```

Найдите "CH РК 2.02-01-2023" и откройте его.

### Шаг 2: Скопируйте ID из URL
URL будет выглядеть так:
```
http://localhost:3000/norm-library/cm6abc123xyz
```

Скопируйте часть после `/norm-library/` - это и есть `norm-id`.

### Шаг 3: Запустите парсер
```bash
node scripts/parse-pdf-with-gpt.js <norm-id>
```

Например:
```bash
node scripts/parse-pdf-with-gpt.js cm6abc12345
```

### Шаг 4: Проверьте результат
Парсер выведет детальный лог:
- Сколько символов извлечено из PDF
- Сколько требований найдено GPT
- Сколько сохранено в базу данных

После этого обновите страницу в браузере - требования должны появиться!

## Альтернатива: Найти ID через console браузера

1. Откройте страницу норматива
2. Нажмите F12 (DevTools)
3. В Console вставьте:
```javascript
window.location.pathname.split('/').pop()
```
4. Скопируйте результат - это norm-id

## Пример полного процесса

```bash
# 1. Узнать доступные нормативы (если база работает)
node scripts/list-norms.js

# 2. Запустить парсинг конкретного норматива
node scripts/parse-pdf-with-gpt.js cm6abc123xyz

# 3. Или запустить пакетную обработку всех
node scripts/parse-all-norms.js
```

## Что делать если скрипт упал?

Скрипт выводит подробные логи на каждом шаге. Смотрите где упал:

**Step 1: Fetching norm** → Неправильный ID
**Step 2: Fetching files** → Нет PDF файлов
**Step 3: Extracting text** → Проблема с PDF файлом
**Step 4: GPT API** → Проблема с OpenAI API (проверьте ключ)
**Step 5: Parsing response** → GPT вернул не JSON
**Step 6: Saving** → Проблема с базой данных

Любые ошибки пишите мне - разберемся!
