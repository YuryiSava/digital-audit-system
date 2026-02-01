'use server';

import { spawn } from 'child_process';
import { revalidatePath } from 'next/cache';

/**
 * Call external universal parser script with LIVE LOGGING
 */
export async function parseNormUniversal(normSourceId: string) {
    console.log(`🚀 Initiating BACKGROUND UNIVERSAL parser for norm: ${normSourceId}`);

    try {
        const scriptPath = 'scripts/parse-pdf-universal.js';

        // Запускаем как полностью независимый процесс (detached)
        // Это гарантирует, что даже если Server Action завершится по таймауту,
        // сам процесс парсинга в системе продолжит работать.
        const child = spawn('node', [scriptPath, 'DIRECT', normSourceId], {
            cwd: process.cwd(),
            detached: true,
            stdio: 'ignore',
            shell: true, // КРИТИЧНО для стабильного запуска на Windows
            env: { ...process.env }
        });

        child.unref(); // Позволяем родительскому процессу (серверу) не ждать завершения

        return {
            success: true,
            fragmentCount: 0,
            message: `Парсинг запущен в фоновом режиме. Следите за прогрессом в окне.`
        };
    } catch (err: any) {
        console.error('[PARSER] Failed to start background process:', err);
        return {
            success: false,
            fragmentCount: 0,
            message: `Не удалось запустить парсер: ${err.message}`
        };
    }
}
