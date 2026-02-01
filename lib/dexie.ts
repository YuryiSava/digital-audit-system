import Dexie, { type Table } from 'dexie';

export interface LocalProject {
    id: string;
    name: string;
    address?: string;
    status: string;
    updatedAt: string;
}

export interface LocalChecklist {
    id: string;
    projectId: string;
    requirementSetId: string;
    status: string;
    name: string; // From requirement set
    systemName: string; // From system
    projectName?: string; // Cache project name for watermarks
    updatedAt: string;
}

export interface LocalAuditResult {
    id: string;
    checklistId: string;
    requirementId: string;
    status: string;
    comment?: string;
    photos?: string[];
    requirementContent: string;
    requirementClause: string;
    updatedAt: string;
}

export interface LocalImage {
    id: string; // resultId_timestamp
    resultId: string;
    blob: Blob;
    uploaded: boolean;
    publicUrl?: string;
    createdAt: number;
}

export interface SyncOperation {
    id?: number;
    type: 'UPDATE_RESULT' | 'UPDATE_CHECKLIST' | 'UPLOAD_IMAGE';
    targetId: string;
    data: any;
    timestamp: number;
}

export class DASDatabase extends Dexie {
    projects!: Table<LocalProject>;
    checklists!: Table<LocalChecklist>;
    auditResults!: Table<LocalAuditResult>;
    syncQueue!: Table<SyncOperation>;
    images!: Table<LocalImage>;

    constructor() {
        super('DAS_Offline_DB');
        this.version(2).stores({
            projects: 'id, updatedAt',
            checklists: 'id, projectId, updatedAt',
            auditResults: 'id, checklistId, status',
            syncQueue: '++id, targetId, timestamp',
            images: 'id, resultId, uploaded'
        });
    }
}

export const db = new DASDatabase();
