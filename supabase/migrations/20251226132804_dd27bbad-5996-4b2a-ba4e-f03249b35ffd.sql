-- Update the grade constraint to include new grades
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_grade_check;
ALTER TABLE public.students ADD CONSTRAINT students_grade_check 
  CHECK (grade IN ('first', 'second', 'third', 'fourth', 'fifth', 'sixth'));