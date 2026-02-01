'use client';

import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/dexie';
import { saveAuditResult, getProjectFullAuditData } from '@/app/actions/audit';
import { uploadEvidence } from '@/app/actions/storage';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

    // 1. Monitor online status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processSyncQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // 2. Process Sync Queue
    const processSyncQueue = useCallback(async () => {
        if (!navigator.onLine || isSyncing) return;

        const operations = await db.syncQueue.toArray();
        if (operations.length === 0) return;

        setIsSyncing(true);
        console.log(`[Sync] Processing ${operations.length} operations...`);

        for (const op of operations) {
            try {
                if (op.type === 'UPDATE_RESULT') {
                    const res = await saveAuditResult(
                        op.targetId,
                        op.data.status,
                        op.data.comment,
                        op.data.photos
                    );
                    if (res.success) {
                        await db.syncQueue.delete(op.id!);
                    }
                } else if (op.type === 'UPLOAD_IMAGE') {
                    const img = await db.images.get(op.targetId);
                    if (img && !img.uploaded) {
                        const path = `evidence/${op.data.projectId}/${op.targetId}.jpg`;
                        const res = await uploadEvidence(img.blob, path);

                        if (res.success && res.publicUrl) {
                            // 1. Mark image as uploaded
                            await db.images.update(op.targetId, {
                                uploaded: true,
                                publicUrl: res.publicUrl
                            });

                            // 2. Add to audit result photos array
                            const result = await db.auditResults.get(img.resultId);
                            if (result) {
                                const newPhotos = [...(result.photos || []), res.publicUrl];
                                await db.auditResults.update(img.resultId, { photos: newPhotos });

                                // 3. Queue a result update to sync the new photos list
                                await db.syncQueue.add({
                                    type: 'UPDATE_RESULT',
                                    targetId: img.resultId,
                                    data: { status: result.status, comment: result.comment, photos: newPhotos },
                                    timestamp: Date.now()
                                });
                            }

                            // 4. Remove this upload op
                            await db.syncQueue.delete(op.id!);
                        }
                    } else {
                        // Already uploaded or missing, just clean up op
                        await db.syncQueue.delete(op.id!);
                    }
                }
            } catch (err) {
                console.error('[Sync] Failed operation:', op, err);
                break;
            }
        }

        setIsSyncing(false);
    }, [isSyncing]);

    // 3. Hydrate Project Data (Download for Offline)
    const hydrateProject = async (projectId: string) => {
        if (!navigator.onLine) return { success: false, error: 'Нет интернета для синхронизации' };

        setIsSyncing(true);
        try {
            const res = await getProjectFullAuditData(projectId);
            if (!res.success) throw new Error(res.error);

            const now = new Date().toISOString();

            // Save Project
            await db.projects.put({
                id: res.project.id,
                name: res.project.name,
                address: res.project.address,
                status: res.project.status,
                updatedAt: now
            });

            // Save Checklists and Results
            for (const checklist of res.checklists || []) {
                await db.checklists.put({
                    id: checklist.id,
                    projectId: checklist.projectId,
                    requirementSetId: checklist.requirementSetId,
                    status: checklist.status,
                    name: checklist.requirementSet?.name,
                    systemName: checklist.requirementSet?.system?.name,
                    projectName: res.project.name,
                    updatedAt: now
                });

                for (const result of checklist.results || []) {
                    await db.auditResults.put({
                        id: result.id,
                        checklistId: result.checklistId,
                        requirementId: result.requirementId,
                        status: result.status,
                        comment: result.comment,
                        photos: result.photos,
                        requirementContent: result.requirement?.content,
                        requirementClause: result.requirement?.clause,
                        updatedAt: now
                    });
                }
            }

            setLastSyncTime(now);
            return { success: true };
        } catch (err: any) {
            console.error('[Hydration] Error:', err);
            return { success: false, error: err.message };
        } finally {
            setIsSyncing(false);
        }
    };

    // 4. Update Audit Result (The Offline-First Way)
    const updateResult = async (resultId: string, status: string, comment?: string, photos?: string[]) => {
        const updatedAt = new Date().toISOString();

        // Update local DB immediately
        await db.auditResults.update(resultId, {
            status,
            comment,
            photos,
            updatedAt
        });

        // Queue for sync
        await db.syncQueue.add({
            type: 'UPDATE_RESULT',
            targetId: resultId,
            data: { status, comment, photos },
            timestamp: Date.now()
        });

        // Try to sync if online
        if (navigator.onLine) {
            processSyncQueue();
        }
    };

    // 5. Save Photo Offline-First
    const savePhoto = async (resultId: string, projectId: string, blob: Blob) => {
        const imageId = `${resultId}_${Date.now()}`;

        // 1. Store blob locally
        await db.images.add({
            id: imageId,
            resultId,
            blob,
            uploaded: false,
            createdAt: Date.now()
        });

        // 2. Queue for upload
        await db.syncQueue.add({
            type: 'UPLOAD_IMAGE',
            targetId: imageId,
            data: { projectId },
            timestamp: Date.now()
        });

        if (navigator.onLine) {
            processSyncQueue();
        }
    };

    return {
        isOnline,
        isSyncing,
        lastSyncTime,
        updateResult,
        savePhoto,
        hydrateProject,
        processSyncQueue
    };
}
