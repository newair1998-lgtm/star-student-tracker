-- Add section_number column to students table
ALTER TABLE public.students ADD COLUMN section_number integer NOT NULL DEFAULT 1;