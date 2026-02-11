/**
 * Mapping between System IDs and Requirement Tags
 * Used to filter requirements when generating checklists from Normative Documents.
 */

export const SYSTEM_TAG_MAP: Record<string, string[]> = {
    // Fire Alarm System
    'APS': ['APS', 'АПС', 'SISTEMA_APS', 'GENERAL', 'FIRE_SAFETY', 'COMMON'],

    // Evacuation System
    'SOUE': ['SOUE', 'СОУЭ', 'SISTEMA_SOUE', 'GENERAL', 'FIRE_SAFETY', 'COMMON'],

    // Extinguishing System
    'AUPT': ['AUPT', 'АУПТ', 'AGPT', 'АГПТ', 'SISTEMA_AUPT', 'GENERAL', 'FIRE_SAFETY', 'COMMON'],

    // Video Surveillance
    'CCTV': ['CCTV', 'СОТ', 'VIDEO', 'GENERAL', 'SECURITY', 'COMMON'],

    // Access Control
    'ACS': ['ACS', 'СКУД', 'ACCESS', 'GENERAL', 'SECURITY', 'COMMON'],

    // Security Alarm
    'OS': ['OS', 'ОС', 'SECURITY', 'GENERAL', 'COMMON'],

    // Cabling
    'SCS': ['SCS', 'СКС', 'CABLING', 'GENERAL', 'COMMON'],
};

/**
 * Get all relevant tags for a list of system IDs
 */
export function getTagsForSystems(systemIds: string[]): string[] {
    const tags = new Set<string>();

    systemIds.forEach(sysId => {
        const sysTags = SYSTEM_TAG_MAP[sysId] || [];
        sysTags.forEach(tag => tags.add(tag));
    });

    return Array.from(tags);
}
