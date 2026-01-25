import Link from "next/link";
import { ArrowLeft, FileText, Download, Layers } from "lucide-react";
import { getNormById } from "@/app/actions/norm-library";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { ParseButton } from "./parse-button";
import { UploadFileButton } from "./upload-file-button";
import { DeleteFileButton } from "./delete-file-button";
import { DeleteRequirementButton } from "./delete-requirement-button";
import { AddRequirementButton } from "./add-requirement-button";
import { EditRequirementButton } from "./edit-requirement-button";

// Disable caching to show fresh data
export const revalidate = 0;

export default async function NormDetailPage({ params }: { params: { id: string } }) {
    const { data: norm, error } = await getNormById(params.id);

    if (error || !norm) {
        redirect('/norm-library');
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/norm-library"
                            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                            <span>К списку</span>
                        </Link>
                        <div className="h-6 w-px bg-white/20" />
                        <h1 className="text-xl font-bold text-white truncate max-w-xl" title={norm.title}>
                            {norm.code} <span className="text-gray-400 font-normal">| {norm.title}</span>
                        </h1>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 flex-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Col: Metadata */}
                    <div className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <h2 className="text-lg font-semibold text-white mb-4">Информация</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Тип</label>
                                    <p className="text-white font-medium">{norm.docType} ({norm.jurisdiction})</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Дата редакции</label>
                                    <p className="text-white font-medium">{formatDate(norm.editionDate)}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Издатель</label>
                                    <p className="text-white font-medium">{norm.publisher || 'Не указан'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase tracking-wider">Статус</label>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold mt-1 ${norm.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {norm.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    Файлы
                                </h2>
                                <UploadFileButton normId={norm.id} />
                            </div>
                            {norm.files && norm.files.length > 0 ? (
                                <ul className="space-y-3">
                                    {norm.files.map((file: any) => (
                                        <li key={file.id} className="flex items-center justify-between bg-black/20 p-3 rounded border border-white/5">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="h-8 w-8 rounded bg-red-500/20 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-red-400">PDF</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm text-white truncate" title={file.fileName}>{file.fileName}</p>
                                                    <p className="text-xs text-gray-500">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <a
                                                    href={file.storageUrl}
                                                    target="_blank"
                                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-blue-400"
                                                    download
                                                    title="Скачать"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                                <DeleteFileButton fileId={file.id} normId={norm.id} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Файлы не загружены</p>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Content / Parsed Data */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 min-h-[500px]">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-purple-400" />
                                    Требования и Разделы
                                </h2>
                                <div className="flex items-center gap-3">
                                    <AddRequirementButton normId={params.id} />
                                    <ParseButton normId={params.id} />
                                </div>
                            </div>

                            {norm.requirements && norm.requirements.length > 0 ? (
                                <div className="space-y-4">
                                    {norm.requirements.map((req: any) => (
                                        <div key={req.id} className="bg-black/20 p-4 rounded border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex justify-between mb-2">
                                                <span className="font-mono font-bold text-blue-300 text-sm align-middle flex items-center gap-2">
                                                    {req.clause}
                                                    {req.severityHint === 'CRITICAL' && <span className="text-[9px] bg-red-500 text-white px-1 py-0.5 rounded uppercase font-bold tracking-wider">Critical</span>}
                                                    {req.severityHint === 'HIGH' && <span className="text-[9px] bg-orange-500 text-white px-1 py-0.5 rounded uppercase font-bold tracking-wider">High</span>}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {req.mustCheck && <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Обязательно</span>}
                                                    <EditRequirementButton requirement={req} />
                                                    <DeleteRequirementButton requirementId={req.id} normId={params.id} />
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-300 mb-3">{req.requirementTextShort}</p>

                                            <div className="flex flex-wrap gap-2 items-center text-xs text-gray-400">
                                                <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded border border-white/5">
                                                    <span className="text-slate-500">Method:</span>
                                                    <span className={`font-medium ${req.checkMethod === 'measurement' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                        {req.checkMethod || 'visual'}
                                                    </span>
                                                </div>

                                                {req.tags && req.tags.map((tag: string) => (
                                                    <span key={tag} className="bg-slate-700 px-2 py-1 rounded text-slate-300 text-[10px]">#{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                                    <Layers className="h-10 w-10 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400 mb-2">Требования не извлечены</p>
                                    <p className="text-sm text-gray-600 max-w-sm mx-auto">
                                        Система пока не обработала этот документ. Нажмите "Запустить парсинг", чтобы извлечь требования автоматически.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                </div >
            </main >
        </div >
    );
}
