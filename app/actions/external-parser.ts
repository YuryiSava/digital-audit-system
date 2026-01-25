'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabaseClient';

const execAsync = promisify(exec);

/**
 * Check if norm already has requirements (to prevent accidental overwrites)
 */
export async function checkExistingRequirements(normId: string) {
    const { data: requirements, error } = await supabase
        .from('requirements')
        .select('id, createdBy')
        .eq('normSourceId', normId);

    if (error) {
        return { exists: false, count: 0, manualCount: 0 };
    }

    const count = requirements?.length || 0;
    const manualCount = requirements?.filter((r: any) => r.createdBy === 'manual').length || 0;

    return {
        exists: count > 0,
        count,
        manualCount
    };
}

/**
 * Parse PDF using external GPT parser script
 */
export async function parseNormWithExternalGPT(normId: string, targetSystem?: string) {
    try {
        console.log(`🚀 Starting external GPT parser for norm: ${normId}`);

        // Build command
        const scriptPath = 'scripts/parse-pdf-with-gpt.js';
        const command = targetSystem
            ? `node ${scriptPath} ${normId} ${targetSystem}`
            : `node ${scriptPath} ${normId}`;

        console.log(`📝 Command: ${command}`);

        // Execute parser script
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 600000, // 10 minutes timeout (increased for large documents)
            maxBuffer: 20 * 1024 * 1024 // 20MB buffer
        });

        console.log('✅ Parser output:', stdout);
        if (stderr) {
            console.warn('⚠️ Parser stderr:', stderr);
        }

        // Parse result from output
        const lines = stdout.split('\n');
        const savedLine = lines.find(line => line.includes('Requirements saved:'));
        const count = savedLine ? parseInt(savedLine.match(/\d+/)?.[0] || '0') : 0;

        // Revalidate page
        revalidatePath(`/norm-library/${normId}`);

        return {
            success: true,
            count,
            message: `Successfully parsed ${count} requirements`
        };

    } catch (error: any) {
        console.error('❌ External parser error:', error);

        return {
            success: false,
            error: error.message || 'Parser execution failed',
            details: error.stderr || error.stdout
        };
    }
}

/**
 * Parse all norms with PDF files
 */
export async function parseAllNorms() {
    try {
        console.log('🚀 Starting batch parser for all norms');

        const scriptPath = 'scripts/parse-all-norms.js';
        const command = `node ${scriptPath}`;

        console.log(`📝 Command: ${command}`);

        // Execute batch parser script
        const { stdout, stderr } = await execAsync(command, {
            cwd: process.cwd(),
            timeout: 1800000, // 30 minutes timeout for batch
            maxBuffer: 50 * 1024 * 1024 // 50MB buffer
        });

        console.log('✅ Batch parser output:', stdout);
        if (stderr) {
            console.warn('⚠️ Batch parser stderr:', stderr);
        }

        // Parse results from output
        const lines = stdout.split('\n');
        const processedLine = lines.find(line => line.includes('Processed:'));
        const successfulLine = lines.find(line => line.includes('Successful:'));
        const failedLine = lines.find(line => line.includes('Failed:'));

        const processed = processedLine ? parseInt(processedLine.match(/\d+/)?.[0] || '0') : 0;
        const successful = successfulLine ? parseInt(successfulLine.match(/\d+/)?.[0] || '0') : 0;
        const failed = failedLine ? parseInt(failedLine.match(/\d+/)?.[0] || '0') : 0;

        // Revalidate norm library page
        revalidatePath('/norm-library');

        return {
            success: true,
            processed,
            successful,
            failed,
            message: `Batch processing complete: ${successful}/${processed} successful`
        };

    } catch (error: any) {
        console.error('❌ Batch parser error:', error);

        return {
            success: false,
            error: error.message || 'Batch parser execution failed',
            details: error.stderr || error.stdout
        };
    }
}
