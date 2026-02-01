import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // Используем Service Role Key для админских прав!
    );

    try {
        // Мы не можем выполнить DDL через JS клиент напрямую.
        // Но мы можем попробовать вызвать RPC, если он есть.
        // Если нет - нам придется делать это руками в дашборде Supabase.

        // Попытка 1: Проверить соединение
        const { data, error } = await supabase.from('norm_sources').select('count').limit(1);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Database connection OK, but cannot run DDL migrations via client-side API. Please run SQL in Supabase Dashboard SQL Editor.',
            sql: 'ALTER TABLE "norm_sources" ADD COLUMN IF NOT EXISTS "parsing_details" JSONB DEFAULT NULL;'
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
