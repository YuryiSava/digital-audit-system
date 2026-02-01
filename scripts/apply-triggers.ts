import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:aDD%2De2X%2DYdD%2DZAV@db.dvgnucppetrogunjqiti.supabase.co:6543/postgres?pgbouncer=true",
        },
    },
});

async function main() {
    console.log('Applying database triggers and functions...');

    try {
        // 1. Ensure user_profiles table exists (Prisma should have handled this, but good to be safe)
        // We rely on Prisma for the table structure to match functionality.

        // 2. Create the Trigger Function
        await prisma.$executeRawUnsafe(`
            create or replace function public.handle_new_user()
            returns trigger
            language plpgsql
            security definer set search_path = public
            as $$
            begin
              insert into public.user_profiles (id, email, full_name, role)
              values (
                new.id, 
                new.email, 
                new.raw_user_meta_data->>'full_name',
                'ENGINEER'
              )
              on conflict (id) do nothing; -- Prevent error if profile exists
              return new;
            end;
            $$;
        `);
        console.log('Function handle_new_user updated.');

        // 3. Create the Trigger
        await prisma.$executeRawUnsafe(`
            drop trigger if exists on_auth_user_created on auth.users;
            create trigger on_auth_user_created
              after insert on auth.users
              for each row execute procedure public.handle_new_user();
        `);
        console.log('Trigger on_auth_user_created applied.');

        console.log('Success! Database triggers repaired.');
    } catch (e: any) {
        console.error('Error applying triggers:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
