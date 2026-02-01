import { getChecklistDetails } from "@/app/actions/audit";
import { MobileAuditClient } from "@/components/field/mobile-audit-client";

export const dynamic = 'force-dynamic';

export default async function MobileAuditPage({ params }: { params: { id: string } }) {
    // We still fetch once on server to ensure SEO/Initial load works IF online
    // But the client component will take over using Dexie
    return <MobileAuditClient checklistId={params.id} />;
}
