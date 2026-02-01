'use server';

import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from './team';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'checking';

export interface SystemHealth {
    database: HealthStatus;
    storage: HealthStatus;
    ai: HealthStatus;
    overall: HealthStatus;
    timestamp: string;
    details?: {
        dbError?: string;
        storageError?: string;
        aiError?: string;
    }
}

export async function getSystemHealth(): Promise<SystemHealth> {
    const currentUser = await getCurrentUser();

    // Only admins can see full system health
    if (currentUser?.profile?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const supabase = createClient();
    const health: SystemHealth = {
        database: 'checking',
        storage: 'checking',
        ai: 'checking',
        overall: 'healthy',
        timestamp: new Date().toISOString(),
        details: {}
    };

    // 1. Check Database
    try {
        const { error } = await supabase.from('systems').select('count', { count: 'exact', head: true });
        if (error) throw error;
        health.database = 'healthy';
    } catch (e: any) {
        health.database = 'unhealthy';
        health.details!.dbError = e.message;
        health.overall = 'unhealthy';
    }

    // 2. Check Storage
    try {
        const { error } = await supabase.storage.listBuckets();
        if (error) throw error;
        health.storage = 'healthy';
    } catch (e: any) {
        health.storage = 'unhealthy';
        health.details!.storageError = e.message;
        health.overall = health.overall === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    // 3. Check AI (OpenAI API Connectivity)
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('API Key missing');

        // Simple lightweight call to check connectivity
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
            next: { revalidate: 3600 } // Cache this check for an hour
        });

        if (!response.ok) throw new Error(`OpenAI API returned ${response.status}`);
        health.ai = 'healthy';
    } catch (e: any) {
        health.ai = 'unhealthy';
        health.details!.aiError = e.message;
        health.overall = health.overall === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    return health;
}
