
import { parseNormFile } from '../app/actions/parsing';
import { supabase } from '../lib/supabaseClient';
import fs from 'fs';
import path from 'path';

async function testParsing() {
    console.log('--- Starting Parsing Test ---');

    // 1. Create Dummy File
    const dummyPath = path.join(process.cwd(), 'public', 'uploads', 'norms');
    if (!fs.existsSync(dummyPath)) {
        fs.mkdirSync(dummyPath, { recursive: true });
    }
    const fileName = 'test-doc.pdf';
    const filePath = path.join(dummyPath, fileName);

    // Create a textual "PDF" that might just contain text we want to extract
    // pdf-parse might fail if it doesn't see %PDF
    // But let's try to make it slightly believable or at least see the error
    fs.writeFileSync(filePath, '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/MediaBox [0 0 595 842]\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/Contents 5 0 R\n/Parent 2 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT /F1 12 Tf 100 700 Td (5.1. Test Requirement Clause) Tj ET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000284 00000 n \n0000000372 00000 n \ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n466\n%%EOF');

    console.log('Dummy PDF created at:', filePath);

    // 2. Create DB Records
    const normId = `TEST-${Date.now()}`;
    const fileId = `FILE-${Date.now()}`;
    const recordId = crypto.randomUUID();

    const { data: norm, error: normError } = await supabase
        .from('norm_sources')
        .insert({
            id: recordId,
            normSourceId: normId,
            jurisdiction: 'KZ',
            docType: 'TEST',
            code: 'TEST-CODE-01',
            title: 'Test Document',
            status: 'DRAFT',
            updatedAt: new Date().toISOString()
        })
        .select()
        .single();

    if (normError) {
        console.error('Norm Create Error:', normError);
        return;
    }

    const { error: fileError } = await supabase
        .from('norm_files')
        .insert({
            id: crypto.randomUUID(),
            normSourceId: recordId, // Foreign Key
            fileName: fileName,
            fileType: 'pdf',
            fileSize: 123,
            fileHash: 'test',
            storageUrl: `/uploads/norms/${fileName}`, // Relative path as expected
            uploadedAt: new Date().toISOString()
        });

    if (fileError) {
        console.error('File Create Error:', fileError);
        return;
    }

    console.log('DB Records created. Running parsing action...');

    // 3. Run Parsing
    const result = await parseNormFile(recordId);
    console.log('Parsing Result:', result);

    // 4. Verify Requirements
    if (result.success) {
        const { data: reqs } = await supabase
            .from('requirements')
            .select('*')
            .eq('normSourceId', recordId);

        console.log('Requirements found in DB:', reqs?.length);
        console.log(reqs);
    }

    console.log('--- Test Complete ---');
}

testParsing();
