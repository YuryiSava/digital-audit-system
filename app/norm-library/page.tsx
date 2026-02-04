import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { getNormSources } from "@/app/actions/norm-library";
import { CreateNormDialog } from "@/components/norm-library/create-norm-dialog";
import { getCurrentUser } from "@/app/actions/team";
import { NormLibraryList } from "@/components/norm-library/norm-library-list";

// Server Component
export default async function NormLibraryPage() {
    // Fetch data
    const [{ data: norms }, currentUser] = await Promise.all([
        getNormSources(),
        getCurrentUser()
    ]);

    const isAdmin = currentUser?.profile?.role === 'admin';

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
                <div className="mx-auto max-w-[1400px] px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link
                                href="/"
                                className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all"
                            >
                                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                                <span className="text-sm font-medium">Главная</span>
                            </Link>
                            <div className="h-6 w-px bg-white/10" />
                            <div className="flex items-center gap-4">
                                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Database className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold tracking-tight text-white uppercase">Norm Library</h1>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none mt-1">Нормативная база документов</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Button */}
                        {isAdmin && <CreateNormDialog />}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-[1400px] px-6 py-10">
                <NormLibraryList initialNorms={norms || []} isAdmin={isAdmin} />
            </main>
        </div>
    );
}
