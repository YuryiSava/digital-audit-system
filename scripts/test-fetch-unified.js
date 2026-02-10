
const { getProjectFullExecutionData } = require('../app/actions/audit');

// Mock createClient since we are in a script
jest.mock('@/utils/supabase/server', () => ({
    createClient: () => ({
        from: (table) => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: {}, error: null }),
                    async: async () => ({ data: [], error: null })
                })
            })
        })
    })
}));

// Actually we need a real integration test script that uses pg client
// creating a script similar to update-fire-systems.js but for reading
