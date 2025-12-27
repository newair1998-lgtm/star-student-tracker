-- Drop the old check constraint
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_grade_check;

-- Add new check constraint with all the new grade values
ALTER TABLE public.students ADD CONSTRAINT students_grade_check CHECK (
  grade IN (
    'primary_first', 'primary_second', 'primary_third', 'primary_fourth', 'primary_fifth', 'primary_sixth',
    'middle_first', 'middle_second', 'middle_third',
    'secondary_first', 'secondary_second', 'secondary_third',
    'first', 'second', 'third', 'fourth', 'fifth', 'sixth'
  )
);