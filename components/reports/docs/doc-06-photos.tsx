import { Camera, MapPin, Calendar, Image as ImageIcon } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc06Photos({ checklist }: { checklist: any }) {
    const results = checklist.results || [];

    // Фильтруем только результаты с фотографиями
    const itemsWithPhotos = results.filter((r: any) => r.photos && r.photos.length > 0);

    // Flat list of all photos to simpler mapping
    const allPhotos: any[] = [];
    itemsWithPhotos.forEach((item: any, itemIdx: number) => {
        item.photos.forEach((url: string, photoIdx: number) => {
            allPhotos.push({
                ...item,
                photoUrl: url,
                globalIdx: allPhotos.length + 1,
                localIdx: `${itemIdx + 1}.${photoIdx + 1}`
            });
        });
    });

    return (
        <div className="bg-white p-12 min-h-[29.7cm] relative text-slate-900 font-sans">
            <ReportHeader title="Фото-приложение" docNumber="DOC-06" checklist={checklist} />

            <div className="mb-6 flex justify-between items-end border-b border-slate-200 pb-4">
                <p className="text-slate-500 text-sm max-w-2xl">
                    Фотофиксация выявленных несоответствий и общего состояния системы.
                </p>
                <div className="flex items-center gap-2 text-slate-400">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Всего снимков: {allPhotos.length}</span>
                </div>
            </div>

            <div className="space-y-8">
                {allPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-10">
                        {allPhotos.map((photo: any) => (
                            <div key={`${photo.id}-${photo.photoUrl}`} className="break-inside-avoid flex flex-col h-full bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                {/* Photo Frame */}
                                <div className="aspect-[4/3] bg-gray-200 relative group">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.photoUrl}
                                        className="w-full h-full object-cover"
                                        alt={`Фото ${photo.localIdx}`}
                                    />

                                    {/* Overlays */}
                                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-mono border border-white/20">
                                        IMG_{photo.globalIdx.toString().padStart(4, '0')}
                                    </div>
                                    <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] flex items-center gap-1.5 border border-white/20">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(checklist.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Caption Area */}
                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-xs font-mono font-bold text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                            <span className="text-[9px] text-slate-400 mr-1">{photo.requirement.normSource?.code}</span>
                                            {photo.requirement.clause}
                                        </div>
                                        <div className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${photo.status === 'VIOLATION' || photo.status === 'FAIL' ? 'bg-red-100 text-red-700' :
                                            photo.status === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {photo.status === 'VIOLATION' || photo.status === 'FAIL' ? 'Critical' : photo.status === 'WARNING' ? 'Warning' : 'Info'}
                                        </div>
                                    </div>

                                    <p className="text-xs font-medium text-slate-800 mb-2 leading-relaxed">
                                        {photo.requirement.requirementTextShort}
                                    </p>

                                    {photo.comment && (
                                        <div className="mt-auto pt-3 border-t border-slate-200/50">
                                            <p className="text-[10px] text-slate-500 italic">
                                                "{photo.comment}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                        <div className="bg-white p-4 rounded-full mb-4 shadow-sm border border-slate-100">
                            <Camera className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-medium text-slate-600">Фотографии отсутствуют</p>
                        <p className="text-sm max-w-sm text-center mt-1">В ходе аудита фотофиксация не проводилась или изображения не были загружены в систему.</p>
                    </div>
                )}
            </div>

            <ReportFooter />
        </div>
    );
}
