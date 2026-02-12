
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jrmsepdnvhftvbgknsvv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybXNlcGRudmhmdHZiZ2tuc3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTI0NzksImV4cCI6MjA4NjMyODQ3OX0.46TV1gM0IX9tVOVwAEEFfB2LPYJxU9bSXPkOqw-8Hss';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
    console.log('Testing upload to "covers" bucket...');

    const fileName = `test-upload-${Date.now()}.txt`;
    const fileContent = 'Hello, this is a test upload.';

    // 1. Upload
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('covers')
        .upload(fileName, new Blob([fileContent], { type: 'text/plain' }));

    if (uploadError) {
        console.error('Upload failed:', uploadError);
        return;
    }

    console.log('Upload successful:', uploadData);

    // 2. Get Public URL
    const { data: urlData } = supabase.storage
        .from('covers')
        .getPublicUrl(fileName);

    console.log('Public URL:', urlData.publicUrl);

    // 3. Fetch the URL to see if it works
    try {
        const response = await fetch(urlData.publicUrl);
        console.log('Fetch status:', response.status);
        if (response.ok) {
            const text = await response.text();
            console.log('Content:', text);
        } else {
            console.error('Failed to fetch content from public URL');
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
    
    // 4. List files
    const { data: listData, error: listError } = await supabase.storage
        .from('covers')
        .list();
        
    if (listError) {
        console.error('List failed:', listError);
    } else {
        console.log('Files in bucket root:', listData.map(f => f.name));
    }
}

testUpload();
