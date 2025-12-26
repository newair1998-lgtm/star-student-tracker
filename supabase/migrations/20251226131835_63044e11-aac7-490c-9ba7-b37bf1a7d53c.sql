-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('fourth', 'fifth', 'sixth')),
  attendance TEXT CHECK (attendance IN ('present', 'absent') OR attendance IS NULL),
  performance_tasks INTEGER NOT NULL DEFAULT 0 CHECK (performance_tasks >= 0 AND performance_tasks <= 10),
  participation INTEGER NOT NULL DEFAULT 0 CHECK (participation >= 0 AND participation <= 10),
  book INTEGER NOT NULL DEFAULT 0 CHECK (book >= 0 AND book <= 10),
  homework INTEGER NOT NULL DEFAULT 0 CHECK (homework >= 0 AND homework <= 10),
  exam1 INTEGER NOT NULL DEFAULT 0 CHECK (exam1 >= 0 AND exam1 <= 30),
  exam2 INTEGER NOT NULL DEFAULT 0 CHECK (exam2 >= 0 AND exam2 <= 30),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create public access policies (for simple classroom use without auth)
CREATE POLICY "Allow public read access" 
ON public.students 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON public.students 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access" 
ON public.students 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();