-- Enable RLS on requirement_sets if not already enabled
ALTER TABLE requirement_sets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to published requirement sets" ON requirement_sets;
DROP POLICY IF EXISTS "Allow authenticated users to read requirement sets" ON requirement_sets;
DROP POLICY IF EXISTS "Allow admins to manage requirement sets" ON requirement_sets;

-- Create policy: Allow all users to read PUBLISHED and ACTIVE requirement sets
CREATE POLICY "Allow public read access to published requirement sets"
ON requirement_sets
FOR SELECT
USING (status IN ('PUBLISHED', 'ACTIVE'));

-- Create policy: Allow authenticated users full access (simplified for now)
CREATE POLICY "Allow authenticated users full access to requirement sets"
ON requirement_sets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
