import Link from "next/link";
import { getChecklistDetails } from "@/app/actions/audit";
import { AuditWorkspace } from "@/components/audit/audit-workspace";

export const dynamic = 'force-dynamic';

export default async function FieldAuditPage({ params }: { params: { id: string } }) {
    const { data: checklist, error } = await getChecklistDetails(params.id);

    if (error || !checklist) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">Раздел аудита не найден</h1>
                    <Link href="/field" className="text-blue-400 hover:underline">Вернуться на главную</Link>
                </div>
            </div>
        );
    }

    // Для мобильной версии мы можем использовать тот же компонент, 
    // он уже адаптивный, но можно его немного упростить или обернуть
    return (
        <div className="min-h-screen bg-slate-950">
            <AuditWorkspace
                initialResults={checklist.results}
                checklist={checklist}
                mode="field"
            />
        </div>
    );
}
