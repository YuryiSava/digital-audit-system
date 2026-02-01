-- Enable RLS on projects if not already enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to projects" ON projects;
DROP POLICY IF EXISTS "Allow authenticated users full access to projects" ON projects;

-- Create policy: Allow all users to read projects
CREATE POLICY "Allow public read access to projects"
ON projects
FOR SELECT
USING (true);

-- Create policy: Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access to projects"
ON projects
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
