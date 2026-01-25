import Link from "next/link";
import { getChecklistDetails } from "@/app/actions/audit";
import { ReportWrapper } from "@/components/reports/report-wrapper";

export const dynamic = 'force-dynamic';

export default async function ReportPage({ params }: { params: { id: string } }) {
    const { data: checklist, error } = await getChecklistDetails(params.id);

    if (error || !checklist) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Отчет не найден</h1>
                    <Link href="/projects" className="text-blue-500 hover:underline">Вернуться к проектам</Link>
                </div>
            </div>
        );
    }

    return (
        <ReportWrapper checklist={checklist} />
    );
}
