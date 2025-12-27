-- Add subject field to students table to allow multiple sections per grade
ALTER TABLE public.students 
ADD COLUMN subject TEXT NOT NULL DEFAULT 'default';

-- Create index for faster queries
CREATE INDEX idx_students_grade_subject ON public.students(grade, subject);