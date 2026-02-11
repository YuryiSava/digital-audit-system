
const { getTagsForSystems } = require('../lib/system-tags');

// Mock data
const mockRequirements = [
    { id: 'req_fire', tags: ['FIRE_SAFETY', 'GENERAL'], systemId: null, desc: 'Fire Safety Req' },
    { id: 'req_sec', tags: ['SECURITY'], systemId: null, desc: 'Security Req' },
    { id: 'req_aps', tags: [], systemId: 'APS', desc: 'Specific APS Req' },
    { id: 'req_cctv', tags: [], systemId: 'CCTV', desc: 'Specific CCTV Req' },
    { id: 'req_common', tags: ['COMMON'], systemId: null, desc: 'Common Req' }
];

const testCases = [
    {
        name: 'Scope: APS Only',
        scope: ['APS'],
        expectedIds: ['req_fire', 'req_aps', 'req_common']
    },
    {
        name: 'Scope: CCTV Only',
        scope: ['CCTV'],
        expectedIds: ['req_sec', 'req_cctv', 'req_common'] // CCTV has SECURITY and COMMON tags
    },
    {
        name: 'Scope: APS + CCTV',
        scope: ['APS', 'CCTV'],
        expectedIds: ['req_fire', 'req_sec', 'req_common', 'req_aps', 'req_cctv']
    }
];

function runTests() {
    console.log('🧪 Starting Logic Verification for System-Centric Planning...\n');
    let passed = 0;
    let failed = 0;

    testCases.forEach(test => {
        console.log(`[TEST] ${test.name}`);

        // 1. Get Tags
        const scopeTags = getTagsForSystems(test.scope);
        console.log(`   - Scope Tags: [${scopeTags.join(', ')}]`);

        // 2. Filter Logic (Copy from freezeProjectBaseline)
        const filtered = mockRequirements.filter(req => {
            const hasMatchingTag = req.tags && req.tags.some(tag => scopeTags.includes(tag));
            const hasMatchingSystem = test.scope.includes(req.systemId);
            return hasMatchingTag || hasMatchingSystem;
        });

        const resultIds = filtered.map(r => r.id);
        console.log(`   - Result: [${resultIds.join(', ')}]`);

        // 3. Verify
        const missing = test.expectedIds.filter(id => !resultIds.includes(id));
        const extra = resultIds.filter(id => !test.expectedIds.includes(id));

        if (missing.length === 0 && extra.length === 0) {
            console.log('   ✅ PASS');
            passed++;
        } else {
            console.log('   ❌ FAIL');
            if (missing.length) console.log(`      Missing: ${missing.join(', ')}`);
            if (extra.length) console.log(`      Extra: ${extra.join(', ')}`);
            failed++;
        }
        console.log('');
    });

    console.log(`Total: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
}

runTests();
