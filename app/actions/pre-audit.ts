'use server';

import { supabase } from '@/lib/supabaseClient';
import { revalidatePath } from 'next/cache';

/**
 * Update Object Profile (Step 1 of Pre-Audit Wizard)
 */
export async function updateObjectProfile(auditId: string, data: {
    objectName: string;
    objectAddress?: string;
    customerName?: string;
    customerContact?: string;
    objectType?: string;
    operationMode?: string;
    criticalZones?: string[];
    accessNotes?: string;
}) {
    try {
        const { error } = await supabase
            .from('audits')
            .update({
                objectName: data.objectName,
                objectAddress: data.objectAddress,
                customerName: data.customerName,
                customerContact: data.customerContact,
                objectType: data.objectType,
                operationMode: data.operationMode,
                criticalZones: data.criticalZones || [],
                accessNotes: data.accessNotes,
                updatedAt: new Date().toISOString()
            })
            .eq('id', auditId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/audits/${auditId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Set Scope - Select systems to audit (Step 2)
 */
export async function setAuditScope(auditId: string, data: {
    systemsInScope: string[];
    scopeDepth?: 'BASIC' | 'STANDARD' | 'DEEP';
    scopeExclusions?: string;
}) {
    try {
        const { error } = await supabase
            .from('audits')
            .update({
                systemsInScope: data.systemsInScope,
                scopeDepth: data.scopeDepth || 'STANDARD',
                scopeExclusions: data.scopeExclusions,
                updatedAt: new Date().toISOString()
            })
            .eq('id', auditId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/audits/${auditId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create Test Plan (Step 6)
 */
export async function createTestPlan(auditId: string, data: {
    systemId: string;
    testType: string;
    zones: string[];
    samplingMode: 'FULL' | 'SAMPLE';
    samplingRules?: string;
    participants: string[];
    notes?: string;
}) {
    try {
        const { error } = await supabase
            .from('test_plans')
            .insert({
                id: crypto.randomUUID(),
                auditId: auditId,
                systemId: data.systemId,
                testType: data.testType,
                zones: data.zones,
                samplingMode: data.samplingMode,
                samplingRules: data.samplingRules,
                participants: data.participants,
                notes: data.notes,
                createdAt: new Date().toISOString()
            });

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/audits/${auditId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Test Plans for an audit
 */
export async function getTestPlans(auditId: string) {
    try {
        const { data, error } = await supabase
            .from('test_plans')
            .select('*')
            .eq('auditId', auditId)
            .order('createdAt', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, testPlans: data };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete Test Plan
 */
export async function deleteTestPlan(testPlanId: string, auditId: string) {
    try {
        const { error } = await supabase
            .from('test_plans')
            .delete()
            .eq('id', testPlanId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/audits/${auditId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Create Document Request (Step 7)
 */
export async function createDocumentRequest(auditId: string, data: {
    docTypeId: string;
    required: boolean;
    dueDate?: string;
    deliveryChannel?: string;
    substitutesAllowed?: boolean;
    notes?: string;
}) {
    try {
        const { error } = await supabase
            .from('document_requests')
            .insert({
                id: crypto.randomUUID(),
                auditId: auditId,
                docTypeId: data.docTypeId,
                required: data.required,
                dueDate: data.dueDate,
                deliveryChannel: data.deliveryChannel,
                substitutesAllowed: data.substitutesAllowed || false,
                notes: data.notes,
                status: 'REQUESTED',
                createdAt: new Date().toISOString()
            });

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/audits/${auditId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Document Requests for an audit
 */
export async function getDocumentRequests(auditId: string) {
    try {
        const { data, error } = await supabase
            .from('document_requests')
            .select(`
                *,
                docType:customer_doc_types(*)
            `)
            .eq('auditId', auditId)
            .order('createdAt', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, documentRequests: data };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Update Document Request Status
 */
export async function updateDocumentRequestStatus(
    requestId: string,
    auditId: string,
    status: 'REQUESTED' | 'PROVIDED' | 'NOT_PROVIDED',
    providedBy?: string
) {
    try {
        const updateData: any = {
            status: status,
            updatedAt: new Date().toISOString()
        };

        if (status === 'PROVIDED') {
            updateData.providedAt = new Date().toISOString();
            updateData.providedBy = providedBy;
        }

        const { error } = await supabase
            .from('document_requests')
            .update(updateData)
            .eq('id', requestId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/audits/${auditId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Delete Document Request
 */
export async function deleteDocumentRequest(requestId: string, auditId: string) {
    try {
        const { error } = await supabase
            .from('document_requests')
            .delete()
            .eq('id', requestId);

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath(`/audits/${auditId}`);
        return { success: true };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get available systems for scope selection
 */
export async function getAvailableSystems() {
    try {
        const { data, error } = await supabase
            .from('systems')
            .select('*')
            .eq('status', 'ACTIVE')
            .order('order', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, systems: data };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get available document types
 */
export async function getCustomerDocTypes() {
    try {
        const { data, error } = await supabase
            .from('customer_doc_types')
            .select('*')
            .order('order', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, docTypes: data };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Get Pre-Audit Progress
 */
export async function getPreAuditProgress(auditId: string) {
    try {
        const { data: audit, error: auditError } = await supabase
            .from('audits')
            .select('*')
            .eq('id', auditId)
            .single();

        if (auditError || !audit) {
            return { success: false, error: 'Audit not found' };
        }

        // Check completion of each step
        const progress = {
            step1_objectProfile: !!(audit.objectName && audit.objectAddress),
            step2_scope: !!(audit.systemsInScope && audit.systemsInScope.length > 0),
            step3_normativeBase: false, // TODO: Check if norms are selected
            step4_requirementSets: false, // TODO: Check if requirement sets exist
            step5_applicability: false, // TODO: Check if applicability rules are set
            step6_testPlan: false,
            step7_documentRequest: false,
            readyToFreeze: false
        };

        // Check test plans
        const { data: testPlans } = await supabase
            .from('test_plans')
            .select('id')
            .eq('auditId', auditId);

        progress.step6_testPlan = !!(testPlans && testPlans.length > 0);

        // Check document requests
        const { data: docRequests } = await supabase
            .from('document_requests')
            .select('id')
            .eq('auditId', auditId);

        progress.step7_documentRequest = !!(docRequests && docRequests.length > 0);

        // Check if ready to freeze
        progress.readyToFreeze = progress.step1_objectProfile && progress.step2_scope;

        return { success: true, progress, audit };

    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
