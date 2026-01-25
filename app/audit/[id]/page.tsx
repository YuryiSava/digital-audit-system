import Link from "next/link";
import { getChecklistDetails } from "@/app/actions/audit";
import { AuditWorkspace } from "@/components/audit/audit-workspace";

export default async function AuditPage({ params }: { params: { id: string } }) {
    const { data: checklist, error } = await getChecklistDetails(params.id);

    if (error || !checklist) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Раздел аудита не найден</h1>
                    <Link href="/projects" className="text-blue-400 hover:underline">Вернуться к проектам</Link>
                </div>
            </div>
        );
    }

    return (
        <AuditWorkspace
            initialResults={checklist.results}
            checklist={checklist}
        />
    );
}
