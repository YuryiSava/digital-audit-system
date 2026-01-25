import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Calculate severity level based on Impact and Likelihood (4x4 matrix)
 * Returns: CRITICAL, HIGH, MEDIUM, or LOW
 */
export function calculateSeverity(impact: number, likelihood: number): string {
    const score = impact * likelihood;

    if (score >= 13) return 'CRITICAL';
    if (score >= 9) return 'HIGH';
    if (score >= 5) return 'MEDIUM';
    return 'LOW';
}

/**
 * Generate location_full string from location components
 */
export function generateLocationFull(location: {
    buildingName: string;
    floorLabel: string;
    areaName?: string | null;
    roomLabel?: string | null;
    roomName?: string | null;
    pointName?: string | null;
}): string {
    const parts: string[] = [];

    if (location.buildingName) parts.push(location.buildingName);
    if (location.floorLabel) parts.push(`этаж ${location.floorLabel}`);

    if (location.roomLabel || location.roomName) {
        const room = [location.roomLabel, location.roomName].filter(Boolean).join(' ');
        parts.push(room);
    } else if (location.areaName) {
        parts.push(location.areaName);
    }

    if (location.pointName) parts.push(location.pointName);

    return parts.join(' / ');
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}

/**
 * Format datetime for display
 */
export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
    switch (severity.toUpperCase()) {
        case 'CRITICAL':
            return 'text-red-500 bg-red-500/10 border-red-500/20';
        case 'HIGH':
            return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        case 'MEDIUM':
            return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        case 'LOW':
            return 'text-green-500 bg-green-500/10 border-green-500/20';
        default:
            return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
        case 'ACTIVE':
        case 'PUBLISHED':
        case 'APPROVED':
        case 'PASS':
        case 'COMPLETED':
            return 'text-green-500 bg-green-500/10 border-green-500/20';
        case 'DRAFT':
        case 'IN_REVIEW':
        case 'IN_PROGRESS':
            return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
        case 'FAIL':
        case 'REJECTED':
        case 'CRITICAL':
            return 'text-red-500 bg-red-500/10 border-red-500/20';
        case 'DEPRECATED':
        case 'ARCHIVED':
        case 'N_A':
            return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        default:
            return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
}

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix: string, number: number): string {
    return `${prefix}-${String(number).padStart(4, '0')}`;
}

/**
 * Validate requirement ID format
 */
export function isValidRequirementId(id: string): boolean {
    return /^REQ-[A-Z]+-[A-Z]{2,3}-\d{4}$/.test(id);
}

/**
 * Parse requirement ID
 */
export function parseRequirementId(id: string): {
    system: string;
    docSet: string;
    number: number;
} | null {
    const match = id.match(/^REQ-([A-Z]+)-([A-Z]{2,3})-(\d{4})$/);
    if (!match) return null;

    return {
        system: match[1],
        docSet: match[2],
        number: parseInt(match[3], 10),
    };
}
