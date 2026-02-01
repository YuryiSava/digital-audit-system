const { Pool } = require('pg');
require('dotenv').config();

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log('--- SETTING UP NOTIFICATIONS SYSTEM ---');

    // 1. Create table if not exists (in case prisma db push is skipped)
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.notifications (
            id TEXT PRIMARY KEY,
            "userId" UUID,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            link TEXT,
            "isRead" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    `);

    // 2. Add RLS policy for notifications
    await pool.query(`
        DROP POLICY IF EXISTS "Users can see their own notifications or admin notifications" ON public.notifications;
        CREATE POLICY "Users can see their own notifications or admin notifications" ON public.notifications
        FOR SELECT TO authenticated
        USING (
            "userId" = auth.uid() OR 
            ("userId" IS NULL AND EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND lower(role) = 'admin'))
        );

        DROP POLICY IF EXISTS "Admins can update notifications" ON public.notifications;
        CREATE POLICY "Admins can update notifications" ON public.notifications
        FOR UPDATE TO authenticated
        USING (auth.uid() = "userId" OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND lower(role) = 'admin'))
        WITH CHECK (true);
    `);

    // 3. Update handle_new_user to insert a notification
    await pool.query(`
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER
        LANGUAGE plpgsql
        SECURITY DEFINER SET search_path = public
        AS $$
        BEGIN
          -- Create user profile
          INSERT INTO public.user_profiles (id, email, full_name, role)
          VALUES (
            new.id, 
            new.email, 
            new.raw_user_meta_data->>'full_name',
            'viewer'
          )
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name;

          -- Create notification for admins
          INSERT INTO public.notifications (id, type, title, message, link, "userId")
          VALUES (
            gen_random_uuid()::text,
            'USER_REGISTERED',
            'Новый пользователь',
            'Зарегистрировался новый пользователь: ' || COALESCE(new.raw_user_meta_data->>'full_name', new.email),
            '/team',
            NULL -- NULL means global/admin notification
          );

          RETURN new;
        END;
        $$;
    `);

    console.log('   Notifications table created and RLS applied.');
    console.log('   Trigger handle_new_user updated to create notifications.');

    await pool.end();
}

main().catch(console.error);
