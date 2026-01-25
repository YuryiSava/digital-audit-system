
export function enrichRequirement(text: string) {
    const lower = text.toLowerCase();

    // 1. Detect Check Method
    let checkMethod = 'visual'; // Default
    if (lower.includes('измер') || lower.includes('замер') || lower.includes('сопротивлен')) {
        checkMethod = 'measurement';
    } else if (lower.includes('документ') || lower.includes('акт') || lower.includes('паспорт')) {
        checkMethod = 'document';
    } else if (lower.includes('испытан') || lower.includes('проверк') || lower.includes('сработ')) {
        checkMethod = 'test';
    }

    // 2. Detect Severity (Heuristic)
    let severityHint = 'MEDIUM';
    if (lower.includes('запрещ') || lower.includes('не допускается') || lower.includes('должен быть обеспечен')) {
        severityHint = 'CRITICAL';
    } else if (lower.includes('рекомендуется') || lower.includes('допускается')) {
        severityHint = 'LOW';
    } else if (lower.includes('следует')) {
        severityHint = 'HIGH';
    }

    // 3. Auto-tagging
    const tags = [];
    if (lower.includes('кабел') || lower.includes('провод')) tags.push('Cable');
    if (lower.includes('монтаж') || lower.includes('креплен')) tags.push('Mounting');
    if (lower.includes('земл') || lower.includes('заземл')) tags.push('Grounding');
    if (lower.includes('питани')) tags.push('Power');
    if (lower.includes('шлейф')) tags.push('Loop');
    if (lower.includes('пожар')) tags.push('FireSafety');

    return { checkMethod, severityHint, tags };
}
