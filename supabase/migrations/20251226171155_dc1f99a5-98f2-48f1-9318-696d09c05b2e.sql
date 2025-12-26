-- Drop the old check constraint and add a new one that allows up to 20
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_performance_tasks_check;
ALTER TABLE public.students ADD CONSTRAINT students_performance_tasks_check CHECK (performance_tasks >= 0 AND performance_tasks <= 20);