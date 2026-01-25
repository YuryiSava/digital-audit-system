'use server';

import pdf from 'pdf-parse';

type ParsedNormData = {
    success: boolean;
    data?: {
        code?: string;
        title?: string;
        jurisdiction?: string;
        docType?: string;
        editionDate?: string; // YYYY-MM-DD
    };
    error?: string;
};

export async function parseNormPdf(formData: FormData): Promise<ParsedNormData> {
    // Проверяем, что pdf-parse вообще импортировался
    if (!pdf) {
        return { success: false, error: 'Библиотека pdf-parse не загружена' };
    }

    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, error: 'Файл не передан на сервер' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Пытаемся распарсить с опциями по умолчанию
        const data = await pdf(buffer);

        if (!data || !data.text) {
            return { success: false, error: 'Не удалось извлечь текст из PDF (пустой результат)' };
        }

        const text = data.text;

        // Берем начало текста (первые 3000 символов)
        const headerText = text.substring(0, 3000);

        // --- 1. ПАРСИНГ КОДА ---
        const codeRegex = /([СC]Н(?:\s+РК)?|[СC]П(?:\s+РК)?|ГОСТ|СТ\s+РК|МСН|МСП)\s+[\d\.]+(?:-\d+)+/i;
        const codeMatch = headerText.match(codeRegex);

        let code = '';
        let docType = '';
        let jurisdiction = 'KZ';
        let editionDate = '';

        if (codeMatch) {
            code = codeMatch[0];
            // Нормализуем С/C (латиница -> кириллица)
            code = code.replace(/C/g, 'С');

            if (code.match(/СН|СП|СТ РК/i)) {
                jurisdiction = 'KZ';
                const parts = code.split(' ');
                if (parts.length >= 2) {
                    docType = parts.slice(0, 2).join(' '); // "СН РК"
                } else {
                    docType = parts[0];
                }
            } else if (code.match(/ГОСТ/i)) {
                jurisdiction = 'INT';
                docType = 'ГОСТ';
            }
        }

        // --- 2. ПАРСИНГ ДАТЫ ---
        // Приоритет 1: "Дата введения – 2023-06-16"
        const entryDateRegex = /Дата\s+введения\s*–\s*(\d{4}-\d{2}-\d{2})/i;
        const entryDateMatch = headerText.match(entryDateRegex);

        if (entryDateMatch) {
            editionDate = entryDateMatch[1];
        } else {
            // Приоритет 2: "приказ ... от DD.MM.YYYY"
            const orderDateRegex = /приказ.*?от\s+(\d{1,2})[\./](\d{1,2})[\./](\d{2,4})\s*г/i;
            const orderMatch = headerText.match(orderDateRegex);

            if (orderMatch) {
                let year = orderMatch[3];
                if (year.length === 2) year = '20' + year;
                const month = orderMatch[2].padStart(2, '0');
                const day = orderMatch[1].padStart(2, '0');
                editionDate = `${year}-${month}-${day}`;
            } else {
                // Приоритет 3: Год в коде (СН РК ...-2023)
                const yearFromCode = code.match(/-(20\d{2})$/);
                if (yearFromCode) {
                    editionDate = `${yearFromCode[1]}-01-01`;
                } else {
                    // Приоритет 4: Любой год
                    const anyYear = headerText.match(/20\d{2}/);
                    if (anyYear) editionDate = `${anyYear[0]}-01-01`;
                }
            }
        }

        // --- 3. ПАРСИНГ НАЗВАНИЯ ---
        let title = '';

        // Разбиваем на строки
        const lines = headerText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

        // Игнорируемые фразы (технические заголовки)
        const ignoredPhrases = [
            'Издание официальное',
            'Official Edition',
            'ҚАЗАҚСТАН РЕСПУБЛИКАСЫНЫҢ',
            'СТРОИТЕЛЬНЫЕ НОРМЫ РЕСПУБЛИКИ',
            'СВОД ПРАВИЛ РЕСПУБЛИКИ',
            'ГОСУДАРСТВЕННЫЕ НОРМАТИВЫ',
            'Комитет по делам строительства'
        ];

        const isIgnored = (line: string) => {
            return ignoredPhrases.some(phrase => line.toUpperCase().includes(phrase));
        };

        const isEnglish = (str: string) => {
            const latinChars = (str.match(/[a-zA-Z]/g) || []).length;
            return latinChars > str.length * 0.5 && str.length > 3;
        };

        // Проверка на казахский язык (по специфическим буквам)
        const isKazakh = (str: string) => {
            return /[әіңғүұқөһӘІҢҒҮҰҚӨҺ]/.test(str);
        };

        // Находим индекс кода
        const normalize = (s: string) => s.replace(/\s+/g, ' ').toLowerCase();
        const normalizedCode = normalize(code);
        const codeIndex = lines.findIndex(l => normalize(l).includes(normalizedCode));

        if (codeIndex !== -1) {
            // Ищем первую строку ПОСЛЕ кода, которая НЕ игнорируется, НЕ английская и НЕ казахская (если хотим русское название)
            // Если русское не найдем, возьмем казахское как запасной вариант (или первое что нашли)
            let firstCandidate = '';

            for (let i = codeIndex + 1; i < Math.min(codeIndex + 10, lines.length); i++) {
                const line = lines[i];

                // Пропускаем цифры (номера страниц)
                if (/^\d+$/.test(line)) continue;

                if (!isIgnored(line) && !isEnglish(line)) {
                    // Если это первая найденная строка - запомним её
                    if (!firstCandidate) firstCandidate = line;

                    // Если это казахский - пропускаем (ищем дальше русский)
                    if (isKazakh(line)) continue;

                    // Нашли русское (или просто без спецсимволов KZ)
                    title = line;
                    // Проверяем следующую строку (если название в 2 строки)
                    if (lines[i + 1] && !isIgnored(lines[i + 1]) && !isEnglish(lines[i + 1]) && !isKazakh(lines[i + 1]) && !lines[i + 1].startsWith('Дата введения')) {
                        title += ' ' + lines[i + 1];
                    }
                    break;
                }
            }

            // Если русское не нашли, но была какая-то строка, берем её
            if (!title && firstCandidate) {
                title = firstCandidate;
            }
        }

        // Фоллбэк: Если по строкам не вышло
        if (!title && codeMatch) {
            // Простейший фоллбэк: берем строку после кода
            const afterCode = headerText.substring(codeMatch.index! + codeMatch[0].length);
            // Но он не очень надежен, лучше пустота, чем мусор
        }

        // Чистка
        title = title
            .replace(/_/g, '')
            .replace(/\s+/g, ' ')
            .replace(/\d{4}$/, '')
            .trim();

        return {
            success: true,
            data: {
                code,
                title,
                docType,
                jurisdiction,
                editionDate: editionDate || new Date().toISOString().split('T')[0]
            }
        };

    } catch (error: any) {
        console.error('PDF Parse Error Details:', error);
        // Возвращаем реальную ошибку, чтобы увидеть её в UI
        return {
            success: false,
            error: `Ошибка чтения PDF: ${error.message || JSON.stringify(error)}`
        };
    }
}
