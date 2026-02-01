'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import {
    updateProjectScope,
    freezeProjectBaseline,
    getAvailableRequirementSets,
    getProjectPreAuditProgress
} from '@/app/actions/project-preaudit';
import { getAvailableSystems } from '@/app/actions/pre-audit';

interface ProjectPreAuditWizardProps {
    project: any;
}

export default function ProjectPreAuditWizard({ project }: ProjectPreAuditWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [systems, setSystems] = useState<any[]>([]);
    const [requirementSets, setRequirementSets] = useState<any[]>([]);
    const [progress, setProgress] = useState<any>({});

    // Step 2: Scope
    const [scope, setScope] = useState({
        systemsInScope: project.systemsInScope || [],
        scopeDepth: project.scopeDepth || 'STANDARD',
        scopeExclusions: project.scopeExclusions || ''
    });

    // Step 3: Requirement Sets
    const [selectedRequirementSets, setSelectedRequirementSets] = useState<string[]>([]);

    useEffect(() => {
        loadSystems();
        loadProgress();
    }, []);

    useEffect(() => {
        if (currentStep === 3 && scope.systemsInScope.length > 0) {
            loadRequirementSets();
        }
    }, [currentStep, scope.systemsInScope]);

    const loadSystems = async () => {
        const result = await getAvailableSystems();
        if (result.success && result.systems) {
            setSystems(result.systems);
        }
    };

    const loadRequirementSets = async () => {
        const result = await getAvailableRequirementSets(project.id);
        if (result.success && result.requirementSets) {
            setRequirementSets(result.requirementSets);
        }
    };

    const loadProgress = async () => {
        const result = await getProjectPreAuditProgress(project.id);
        if (result.success && result.progress) {
            setProgress(result.progress);
        }
    };

    const handleSaveStep2 = async () => {
        if (scope.systemsInScope.length === 0) {
            alert('Выберите хотя бы одну систему');
            return;
        }

        setLoading(true);
        const result = await updateProjectScope(project.id, scope);
        setLoading(false);

        if (result.success) {
            await loadProgress();
            setCurrentStep(3);
        } else {
            alert(`Ошибка: ${result.error}`);
        }
    };

    const handleFreezeBaseline = async () => {
        if (selectedRequirementSets.length === 0) {
            alert('Выберите хотя бы один набор требований');
            return;
        }

        if (!confirm('Вы уверены? После заморозки baseline изменения будут невозможны.')) {
            return;
        }

        setLoading(true);
        const result = await freezeProjectBaseline(project.id, selectedRequirementSets);
        setLoading(false);

        if (result.success) {
            alert(`✅ Baseline заморожен!\n\nСоздано:\n- ${result.stats?.checklists} чек-листов\n- ${result.stats?.checkItems} пунктов проверки`);
            router.push(`/projects/${project.id}`);
            router.refresh();
        } else {
            alert(`Ошибка: ${result.error}`);
        }
    };

    const steps = [
        { number: 1, title: 'Информация о проекте', completed: progress.step1_basicInfo },
        { number: 2, title: 'Scope систем', completed: progress.step2_scope },
        { number: 3, title: 'Наборы требований', completed: progress.step3_requirementSets }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href={`/projects/${project.id}`}
                        className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-4"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Назад к проекту</span>
                    </Link>
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🎯 Pre-Audit Setup
                    </h1>
                    <p className="text-blue-200">
                        Проект: {project.name}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center flex-1">
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
                                    {step.completed ? <CheckCircle2 className="h-6 w-6" /> : step.number}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`flex-1 h-1 mx-2 ${step.completed ? 'bg-green-500' : 'bg-white/20'}`} />
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
                    {/* Step 1: Project Info (Read-only) */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">📋 Информация о проекте</h2>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Название проекта
                                    </label>
                                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                                        {project.name}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Адрес
                                    </label>
                                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                                        {project.address || 'Не указан'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Заказчик
                                    </label>
                                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                                        {project.customer || 'Не указан'}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Статус
                                    </label>
                                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                                        {project.status}
                                    </div>
                                </div>
                            </div>

                            {project.description && (
                                <div>
                                    <label className="block text-sm font-medium text-blue-200 mb-2">
                                        Описание
                                    </label>
                                    <div className="px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white">
                                        {project.description}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-4 mt-8">
                                <button
                                    onClick={() => setCurrentStep(2)}
                                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-blue-500/50"
                                >
                                    Далее →
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

                    {/* Step 3: Requirement Sets */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold text-white mb-6">📚 Наборы требований</h2>

                            {requirementSets.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📭</div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        Нет доступных наборов требований
                                    </h3>
                                    <p className="text-blue-200 mb-6">
                                        Для выбранных систем ({scope.systemsInScope.join(', ')}) нет опубликованных наборов требований.
                                    </p>
                                    <p className="text-sm text-blue-300">
                                        Сначала загрузите и распарсите нормативные документы в разделе Norm Library.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {requirementSets.map((reqSet) => (
                                            <label
                                                key={reqSet.id}
                                                className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all
                                                    ${selectedRequirementSets.includes(reqSet.id)
                                                        ? 'bg-blue-500/20 border-blue-500'
                                                        : 'bg-white/5 border-white/20 hover:border-white/40'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRequirementSets.includes(reqSet.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedRequirementSets([...selectedRequirementSets, reqSet.id]);
                                                        } else {
                                                            setSelectedRequirementSets(selectedRequirementSets.filter(id => id !== reqSet.id));
                                                        }
                                                    }}
                                                    className="w-5 h-5 mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="font-bold text-white text-lg">{reqSet.requirementSetId}</span>
                                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                                            {reqSet.system?.systemId || reqSet.systemId}
                                                        </span>
                                                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                                            v{reqSet.version}
                                                        </span>
                                                    </div>
                                                    {reqSet.notes && (
                                                        <p className="text-sm text-blue-200">{reqSet.notes}</p>
                                                    )}
                                                </div>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="flex justify-between gap-4 mt-8">
                                        <button
                                            onClick={() => setCurrentStep(2)}
                                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                                        >
                                            ← Назад
                                        </button>
                                        <button
                                            onClick={handleFreezeBaseline}
                                            disabled={loading || selectedRequirementSets.length === 0 || project.baselineFrozen}
                                            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/50 text-lg"
                                        >
                                            {loading ? '⏳ Заморозка...' : project.baselineFrozen ? '🔒 Уже заморожен' : '🔒 Freeze Baseline'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Frozen Status */}
                {project.baselineFrozen && (
                    <div className="bg-green-500/20 backdrop-blur-lg rounded-2xl p-6 border-2 border-green-500">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🔒</div>
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Baseline заморожен
                            </h3>
                            <p className="text-green-200">
                                Заморожено: {new Date(project.baselineFrozenAt).toLocaleString('ru-RU')}
                            </p>
                            <Link
                                href={`/projects/${project.id}`}
                                className="inline-block mt-4 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all"
                            >
                                Перейти к проекту
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
