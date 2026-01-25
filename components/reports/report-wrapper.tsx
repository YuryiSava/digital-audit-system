'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/simple-ui';
import { Settings } from 'lucide-react';
import { Doc01Executive } from './docs/doc-01-executive';
import { Doc02Technical } from './docs/doc-02-technical';
import { Doc03Defects } from './docs/doc-03-defects';
import { Doc04Matrix } from './docs/doc-04-matrix';
import { Doc06Photos } from './docs/doc-06-photos';
import { Doc05Protocols } from './docs/doc-05-protocols';
import { Doc07CAPA } from './docs/doc-07-capa';
import { Doc08Budget } from './docs/doc-08-budget';
import { ReportSettingsModal } from './report-settings-modal';

export function ReportWrapper({ checklist }: { checklist: any }) {
    const [activeTab, setActiveTab] = useState<'doc-01' | 'doc-02' | 'doc-03' | 'doc-04' | 'doc-05' | 'doc-06' | 'doc-07' | 'doc-08'>('doc-01');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPrintMode, setIsPrintMode] = useState(false);

    const handlePrint = () => {
        setIsPrintMode(true);
        setTimeout(() => {
            window.print();
            setIsPrintMode(false);
        }, 100);
    };

    return (
        <div className="min-h-screen bg-gray-100 text-black p-8 print:p-0 print:bg-white text-base">

            {/* Modal - Rendered conditionally but controlled by internal state */}
            {/* Added a key to force re-render if needed, but not strictly required */}
            <ReportSettingsModal
                checklist={checklist}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* Toolbar (Hidden while printing) */}
            <div className="max-w-[210mm] mx-auto mb-6 flex flex-col gap-4 print:hidden">
                <div className="flex justify-between items-center bg-white p-2 rounded-lg shadow-sm w-full">
                    <div className="flex flex-wrap gap-1">
                        <button
                            onClick={() => setActiveTab('doc-01')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-01' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-01 Exec
                        </button>
                        <button
                            onClick={() => setActiveTab('doc-02')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-02' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-02 Tech
                        </button>
                        <button
                            onClick={() => setActiveTab('doc-03')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-03' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-03 Defect
                        </button>
                        <button
                            onClick={() => setActiveTab('doc-04')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-04' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-04 Matrix
                        </button>
                        <button
                            onClick={() => setActiveTab('doc-05')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-05' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-05 Protocol
                        </button>
                        <button
                            onClick={() => setActiveTab('doc-06')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-06' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-06 Photo
                        </button>
                        <button
                            onClick={() => setActiveTab('doc-07')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-07' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-07 CAPA
                        </button>
                        <button
                            onClick={() => setActiveTab('doc-08')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'doc-08' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:bg-gray-100'}`}
                        >
                            DOC-08 Budget
                        </button>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <Button
                            variant="outline"
                            onClick={() => {
                                console.log('Opening settings...'); // Debug
                                setIsSettingsOpen(true);
                            }}
                            className="bg-white border-gray-200 text-slate-700 hover:bg-gray-50 flex items-center h-8 text-xs"
                        >
                            <Settings className="w-3.5 h-3.5 mr-2" />
                            Настройки
                        </Button>
                        <Button variant="ghost" onClick={() => window.history.back()} className="h-8 text-xs">
                            Назад
                        </Button>
                        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs">
                            Печать / PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Document Container (A4 width) */}
            <div className={`max-w-[210mm] mx-auto bg-white shadow-xl min-h-[297mm] print:shadow-none print:w-full print:max-w-none`}>

                {(activeTab === 'doc-01' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc01Executive checklist={checklist} />
                    </div>
                )}

                {(activeTab === 'doc-02' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc02Technical checklist={checklist} />
                    </div>
                )}

                {(activeTab === 'doc-03' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc03Defects checklist={checklist} />
                    </div>
                )}

                {(activeTab === 'doc-04' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc04Matrix checklist={checklist} />
                    </div>
                )}

                {(activeTab === 'doc-05' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc05Protocols checklist={checklist} />
                    </div>
                )}

                {(activeTab === 'doc-06' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc06Photos checklist={checklist} />
                    </div>
                )}

                {(activeTab === 'doc-07' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc07CAPA checklist={checklist} />
                    </div>
                )}

                {(activeTab === 'doc-08' || isPrintMode) && (
                    <div className={isPrintMode ? 'break-after-page' : ''}>
                        <Doc08Budget checklist={checklist} />
                    </div>
                )}
            </div>

            <div className="max-w-[210mm] mx-auto mt-4 text-center text-xs text-gray-400 print:hidden">
                Режим предпросмотра печати A4
            </div>
        </div>
    );
}
