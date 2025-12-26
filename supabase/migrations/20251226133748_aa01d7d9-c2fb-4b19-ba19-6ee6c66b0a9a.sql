-- Change attendance column from TEXT to JSONB array to store 5 attendance values
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_attendance_check;
ALTER TABLE public.students ALTER COLUMN attendance TYPE JSONB USING '[]'::jsonb;
ALTER TABLE public.students ALTER COLUMN attendance SET DEFAULT '[null, null, null, null, null]'::jsonb;