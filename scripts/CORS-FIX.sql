-- RUN THIS IN SUPABASE SQL EDITOR TO ALLOW VERCEL DOMAIN TO ACCESS STORAGE

-- 1. Enable CORS for norm-docs bucket
-- Replace '*' with your actual domain (e.g., 'https://your-app.vercel.app') for better security
-- but '*' will work for all domains if you are in development phase.

insert into storage.buckets (id, name, public)
values ('norm-docs', 'norm-docs', true)
on conflict (id) do update set public = true;

-- Note: In Supabase dashboard, go to Storage -> Policies
-- And ensure that 'Authenticated' or 'Anon' users have 'SELECT' and 'INSERT' permissions 
-- for the 'norm-docs' bucket if you want them to be able to upload.

-- For a 'bulletproof' approach, you can run this to allow anyone to upload/read (CAUTION: SECURITY)
-- CREATE POLICY "Public Access" ON storage.objects FOR ALL USING ( bucket_id = 'norm-docs' );
