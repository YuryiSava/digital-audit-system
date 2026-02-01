
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const policies = await prisma.$queryRawUnsafe("SELECT * FROM pg_policies WHERE tablename = 'raw_norm_fragments'");
        console.log('POLICIES:', JSON.stringify(policies, null, 2));

        const rlsStatus = await prisma.$queryRawUnsafe("SELECT relname, relrowsecurity FROM pg_class JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace WHERE relname = 'raw_norm_fragments' AND nspname = 'public'");
        console.log('RLS_STATUS:', JSON.stringify(rlsStatus, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
