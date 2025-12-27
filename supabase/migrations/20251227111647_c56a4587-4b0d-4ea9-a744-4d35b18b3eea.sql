-- Add user_id column to students table
ALTER TABLE public.students ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.students;
DROP POLICY IF EXISTS "Allow public insert access" ON public.students;
DROP POLICY IF EXISTS "Allow public update access" ON public.students;
DROP POLICY IF EXISTS "Allow public delete access" ON public.students;

-- Create new RLS policies that restrict access to user's own data
CREATE POLICY "Users can view their own students"
ON public.students
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own students"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own students"
ON public.students
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own students"
ON public.students
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);