import Link from "next/link";
import { ArrowLeft, FileText, Download, Layers } from "lucide-react";
import { getNormById } from "@/app/actions/norm-library";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";
import { UploadFileButton } from "./upload-file-button";
import { DeleteFileButton } from "./delete-file-button";
import { DeleteRequirementButton } from "./delete-requirement-button";
import { AddRequirementButton } from "./add-requirement-button";
import { EditRequirementButton } from "./edit-requirement-button";
import { UniversalParseButton } from "./universal-parse-button";
import { EditNormMetadataButton } from "./edit-metadata-button";
import TabsView from "./TabsView";

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
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Информация</h2>
                                <EditNormMetadataButton
                                    normId={norm.id}
                                    currentData={{
                                        docType: norm.docType,
                                        jurisdiction: norm.jurisdiction,
                                        editionDate: norm.editionDate,
                                        publisher: norm.publisher,
                                        status: norm.status,
                                        title: norm.title
                                    }}
                                />
                            </div>
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
                        <TabsView normId={params.id} norm={norm} />
                    </div>

                </div >
            </main >
        </div >
    );
}
