import { Printer } from 'lucide-react';

export function ReportHeader({ title, docNumber, checklist }: { title: string, docNumber: string, checklist: any }) {
    return (
        <header className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-start print:border-slate-800">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded uppercase tracking-widest">
                        {docNumber}
                    </span>
                    {checklist.status === 'COMPLETED' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            Final Release
                        </span>
                    )}
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight leading-none">{title}</h1>
                <p className="text-lg text-slate-600 font-medium flex items-center gap-2">
                    {checklist.requirementSet?.system?.name}
                    <span className="text-slate-300">|</span>
                    <span className="text-base text-slate-500">{checklist.project?.name}</span>
                </p>

                <div className="flex gap-4 mt-3 text-xs text-slate-400 font-mono border-t border-slate-100 pt-3">
                    {checklist.contractNumber && (
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                            Договор № {checklist.contractNumber}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        {new Date(checklist.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                </div>
            </div>

            <div className="text-right flex flex-col items-end">
                {checklist.companyLogoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={checklist.companyLogoUrl} alt="Logo" className="h-14 mb-2 object-contain" />
                ) : (
                    <div className="h-14 mb-2 w-40 bg-slate-50 flex flex-col items-center justify-center text-slate-300 rounded border border-slate-200 border-dashed">
                        <span className="text-[10px] font-bold uppercase">Logo Area</span>
                    </div>
                )}
                <div className="text-[9px] text-slate-400 font-mono mt-1">
                    ID: {checklist.id.split('-')[0].toUpperCase()}
                </div>
            </div>
        </header>
    );
}

export function ReportFooter() {
    return (
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400 print:text-xs print:text-slate-400 print:fixed print:bottom-0 print:w-full print:bg-white">
            <div className="flex justify-between px-8">
                <span>Digital Audit System • ISB Engineering</span>
                <span>Сгенерировано автоматически</span>
                <span>Страница <span className="page-number"></span></span>
            </div>
        </footer>
    );
}
