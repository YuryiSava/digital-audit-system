import { Camera, MapPin, Calendar, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { ReportHeader, ReportFooter } from '../shared/layout-elements';

export function Doc06Photos({ checklist }: { checklist: any }) {
    const results = checklist.results || [];

    // Фильтруем только результаты с фотографиями
    const itemsWithPhotos = results.filter((r: any) => r.photos && r.photos.length > 0);

    // Сплющиваем список для отображения в сетке
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

            <div className="mb-8 flex justify-between items-end border-b border-slate-200 pb-4">
                <p className="text-slate-500 text-sm max-w-2xl">
                    Фотофиксация технического состояния, подтвержденных дефектов и доказательной базы.
                    Все фотографии содержат встроенные цифровые водяные знаки для верификации.
                </p>
                <div className="flex items-center gap-3 text-slate-900 bg-slate-100 px-4 py-2 rounded-lg font-bold">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    <span className="text-xs uppercase tracking-tighter">Снимков: {allPhotos.length}</span>
                </div>
            </div>

            <div className="space-y-8">
                {allPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-10 gap-y-12">
                        {allPhotos.map((photo: any) => (
                            <div key={`${photo.id}-${photo.photoUrl}`} className="break-inside-avoid flex flex-col h-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Photo Frame */}
                                <div className="aspect-[4/3] bg-slate-100 relative group border-b border-slate-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.photoUrl}
                                        className="w-full h-full object-cover"
                                        alt={`Фото ${photo.localIdx}`}
                                    />

                                    {/* Index Overlay */}
                                    <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold border border-white/10 shadow-lg">
                                        ID {photo.globalIdx.toString().padStart(3, '0')}
                                    </div>

                                    {/* Status Badge */}
                                    <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg border ${(photo.status === 'DEFECT' || photo.status === 'VIOLATION')
                                        ? 'bg-red-600/90 text-white border-red-400/50'
                                        : 'bg-emerald-600/90 text-white border-emerald-400/50'
                                        }`}>
                                        {(photo.status === 'DEFECT' || photo.status === 'VIOLATION') ? 'DEFECT' : 'VERIFIED'}
                                    </div>
                                </div>

                                {/* Caption Area */}
                                <div className="p-5 flex flex-col flex-1 bg-gradient-to-b from-white to-slate-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="text-[10px] font-bold text-slate-900 bg-slate-200/50 border border-slate-300 px-2 py-1 rounded">
                                            <span className="text-slate-500 mr-2">{photo.requirement?.clause}</span>
                                            {photo.requirement?.normSource?.code}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium italic">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(checklist.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <p className="text-[11px] font-bold text-slate-800 mb-3 leading-snug">
                                        {photo.requirement?.content}
                                    </p>

                                    {photo.comment && (
                                        <div className="mt-auto pt-4 border-t border-slate-200">
                                            <div className="flex items-start gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                                <p className="text-[10px] text-slate-600 italic leading-relaxed">
                                                    «{photo.comment}»
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400">
                        <div className="bg-white p-6 rounded-full mb-6 shadow-sm border border-slate-100">
                            <Camera className="w-12 h-12 text-slate-200" />
                        </div>
                        <p className="text-xl font-black text-slate-700 uppercase tracking-widest">Фотоархив пуст</p>
                        <p className="text-xs max-w-xs text-center mt-2 font-medium">Снимки не были загружены или аудит проводился без фотофиксации.</p>
                    </div>
                )}
            </div>

            <ReportFooter />
        </div>
    );
}
