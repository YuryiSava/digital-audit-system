'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    updateObjectProfile,
    setAuditScope,
    getAvailableSystems,
    getPreAuditProgress
} from '@/app/actions/pre-audit';
import { freezeBaseline } from '@/app/actions/baseline';

interface PreAuditWizardProps {
    auditId: string;
    initialAudit: any;
}

export default function PreAuditWizard({ auditId, initialAudit }: PreAuditWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [systems, setSystems] = useState<any[]>([]);
    const [progress, setProgress] = useState<any>({});

    // Step 1: Object Profile
    const [objectProfile, setObjectProfile] = useState({
        objectName: initialAudit.objectName || '',
        objectAddress: initialAudit.objectAddress || '',
        customerName: initialAudit.customerName || '',
        customerContact: initialAudit.customerContact || '',
        objectType: initialAudit.objectType || '',
        operationMode: initialAudit.operationMode || '',
        criticalZones: initialAudit.criticalZones || [],
        accessNotes: initialAudit.accessNotes || ''
    });

    // Step 2: Scope
    const [scope, setScope] = useState({
        systemsInScope: initialAudit.systemsInScope || [],
        scopeDepth: initialAudit.scopeDepth || 'STANDARD',
        scopeExclusions: initialAudit.scopeExclusions || ''
    });

    useEffect(() => {
        loadSystems();
        loadProgress();
    }, []);

    const loadSystems = async () => {
        const result = await getAvailableSystems();
        if (result.success && result.systems) {
            setSystems(result.systems);
        }
    };

    const loadProgress = async () => {
        const result = await getPreAuditProgress(auditId);
        if (result.success && result.progress) {
            setProgress(result.progress);
        }
    };

    const handleSaveStep1 = async () => {
        setLoading(true);
        const result = await updateObjectProfile(auditId, objectProfile);
        setLoading(false);

        if (result.success) {
            await loadProgress();
            setCurrentStep(2);
        } else {
            alert(`Ошибка: ${result.error}`);
        }
    };

    const handleSaveStep2 = async () => {
        if (scope.systemsInScope.length === 0) {
            alert('Выберите хотя бы одну систему');
            return;
        }

        setLoading(true);
        const result = await setAuditScope(auditId, scope);
        setLoading(false);

        if (result.success) {
            await loadProgress();
            setCurrentStep(3);
        } else {
            alert(`Ошибка: ${result.error}`);
        }
    };

    const handleFreezeBaseline = async () => {
        if (!confirm('Вы уверены? После заморозки baseline изменения будут невозможны.')) {
            return;
        }

        setLoading(true);
        const result = await freezeBaseline(auditId);
        setLoading(false);

        if (result.success) {
            alert(`✅ Baseline заморожен!\n\nСоздано:\n- ${result.stats?.checkItems} чек-листов\n- ${result.stats?.normSnapshots} снапшотов норм\n- ${result.stats?.requirementSetSnapshots} снапшотов требований`);
            router.push(`/audits/${auditId}`);
            router.refresh();
        } else {
            alert(`Ошибка: ${result.error}`);
        }
    };

    const steps = [
        { number: 1, title: 'Карточка объекта', completed: progress.step1_objectProfile },
        { number: 2, title: 'Scope систем', completed: progress.step2_scope },
        { number: 3, title: 'Нормативная база', completed: progress.step3_normativeBase },
        { number: 4, title: 'Requirement Sets', completed: progress.step4_requirementSets },
        { number: 5, title: 'Применимость', completed: progress.step5_applicability },
        { number: 6, title: 'План испытаний', completed: progress.step6_testPlan },
        { number: 7, title: 'Запрос документов', completed: progress.step7_documentRequest }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🎯 Pre-Audit Setup Wizard
                    </h1>
                    <p className="text-blue-200">
                        Аудит: {initialAudit.auditId} - {initialAudit.objectName || 'Новый объект'}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition-all cursor-pointer
                                        ${currentStep === step.number
                                            ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/50'
                                            : step.completed
                                                ? 'bg-green-500 text-white'
                                                : 'bg-white/20 text-white/60'
                                        }`}
                                    onClick={() => setCurrentStep(step.number)}
                                >
                                    {step.completed ? '✓' : step.number}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-16 h-1 mx-2 ${step.completed ? 'bg-green-500' : 'bg-white/20'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <h3 className="text-xl font-semibold text-white">
                            {steps[currentStep - 1]?.title}
                        </h3>
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6">
                    {/* Step 1: Object Profile */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">📋 Карточка объекта</h2>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Название объекта *
                                    </label>
                                    <input
                                        type="text"
                                        value={objectProfile.objectName}
                                        onChange={(e) => setObjectProfile({ ...objectProfile, objectName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Например: Бизнес-центр Astana Tower"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Адрес *
                                    </label>
                                    <input
                                        type="text"
                                        value={objectProfile.objectAddress}
                                        onChange={(e) => setObjectProfile({ ...objectProfile, objectAddress: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="г. Астана, ул. Кабанбай батыра, 15"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Заказчик
                                    </label>
                                    <input
                                        type="text"
                                        value={objectProfile.customerName}
                                        onChange={(e) => setObjectProfile({ ...objectProfile, customerName: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="ТОО 'Компания'"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Контакт заказчика
                                    </label>
                                    <input
                                        type="text"
                                        value={objectProfile.customerContact}
                                        onChange={(e) => setObjectProfile({ ...objectProfile, customerContact: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="+7 (777) 123-45-67"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Тип объекта
                                    </label>
                                    <select
                                        value={objectProfile.objectType}
                                        onChange={(e) => setObjectProfile({ ...objectProfile, objectType: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Выберите тип</option>
                                        <option value="БЦ">Бизнес-центр</option>
                                        <option value="ЖК">Жилой комплекс</option>
                                        <option value="ТРЦ">Торговый центр</option>
                                        <option value="Производство">Производство</option>
                                        <option value="Склад">Склад</option>
                                        <option value="Отель">Отель</option>
                                        <option value="Больница">Больница</option>
                                        <option value="Школа">Школа</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Режим работы
                                    </label>
                                    <input
                                        type="text"
                                        value={objectProfile.operationMode}
                                        onChange={(e) => setObjectProfile({ ...objectProfile, operationMode: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="24/7, 8:00-18:00, и т.д."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Примечания по доступу
                                </label>
                                <textarea
                                    value={objectProfile.accessNotes}
                                    onChange={(e) => setObjectProfile({ ...objectProfile, accessNotes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Особенности доступа, пропускной режим, контакты охраны..."
                                />
                            </div>

                            <div className="flex justify-end gap-4 mt-8">
                                <button
                                    onClick={handleSaveStep1}
                                    disabled={loading || !objectProfile.objectName || !objectProfile.objectAddress}
                                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
                                >
                                    {loading ? 'Сохранение...' : 'Далее →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Scope */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">🎯 Scope систем</h2>

                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-4">
                                    Выберите системы для аудита *
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {systems.map((system) => (
                                        <label
                                            key={system.systemId}
                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                                                ${scope.systemsInScope.includes(system.systemId)
                                                    ? 'bg-blue-500/20 border-blue-500'
                                                    : 'bg-white/5 border-white/20 hover:border-white/40'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={scope.systemsInScope.includes(system.systemId)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setScope({
                                                            ...scope,
                                                            systemsInScope: [...scope.systemsInScope, system.systemId]
                                                        });
                                                    } else {
                                                        setScope({
                                                            ...scope,
                                                            systemsInScope: scope.systemsInScope.filter((s: string) => s !== system.systemId)
                                                        });
                                                    }
                                                }}
                                                className="w-5 h-5"
                                            />
                                            <div>
                                                <div className="font-semibold text-white">{system.systemId}</div>
                                                <div className="text-sm text-blue-200">{system.nameRu || system.name}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Глубина аудита
                                </label>
                                <select
                                    value={scope.scopeDepth}
                                    onChange={(e) => setScope({ ...scope, scopeDepth: e.target.value as any })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="BASIC">BASIC - Базовый (визуальный осмотр)</option>
                                    <option value="STANDARD">STANDARD - Стандартный (осмотр + выборочные тесты)</option>
                                    <option value="DEEP">DEEP - Глубокий (полный объем тестирования)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-blue-200 mb-2">
                                    Исключения из scope
                                </label>
                                <textarea
                                    value={scope.scopeExclusions}
                                    onChange={(e) => setScope({ ...scope, scopeExclusions: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Например: Подвал не включен, серверная комната недоступна..."
                                />
                            </div>

                            <div className="flex justify-between gap-4 mt-8">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                                >
                                    ← Назад
                                </button>
                                <button
                                    onClick={handleSaveStep2}
                                    disabled={loading || scope.systemsInScope.length === 0}
                                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/50"
                                >
                                    {loading ? 'Сохранение...' : 'Далее →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Steps 3-7: Placeholder */}
                    {currentStep >= 3 && currentStep <= 7 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🚧</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Шаг {currentStep} в разработке
                            </h3>
                            <p className="text-blue-200 mb-8">
                                {steps[currentStep - 1]?.title}
                            </p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setCurrentStep(currentStep - 1)}
                                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                                >
                                    ← Назад
                                </button>
                                {currentStep < 7 && (
                                    <button
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all"
                                    >
                                        Пропустить →
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Freeze Baseline Button */}
                {progress.readyToFreeze && !initialAudit.baselineFrozen && (
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-green-500/50">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    ✅ Готово к заморозке Baseline
                                </h3>
                                <p className="text-blue-200">
                                    Минимальные требования выполнены. Вы можете заморозить baseline и начать полевые работы.
                                </p>
                            </div>
                            <button
                                onClick={handleFreezeBaseline}
                                disabled={loading}
                                className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 shadow-lg hover:shadow-green-500/50 text-lg"
                            >
                                {loading ? '⏳ Заморозка...' : '🔒 Freeze Baseline'}
                            </button>
                        </div>
                    </div>
                )}

                {initialAudit.baselineFrozen && (
                    <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-green-500">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🔒</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Baseline заморожен
                            </h3>
                            <p className="text-green-200">
                                Заморожено: {new Date(initialAudit.baselineFrozenAt).toLocaleString('ru-RU')}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
