
-- Cooperation records table
CREATE TABLE public.cooperation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id)
);

ALTER TABLE public.cooperation_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cooperation records" ON public.cooperation_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cooperation records" ON public.cooperation_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cooperation records" ON public.cooperation_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cooperation records" ON public.cooperation_records FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_cooperation_records_updated_at BEFORE UPDATE ON public.cooperation_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cleanliness records table
CREATE TABLE public.cleanliness_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id)
);

ALTER TABLE public.cleanliness_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cleanliness records" ON public.cleanliness_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own cleanliness records" ON public.cleanliness_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cleanliness records" ON public.cleanliness_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cleanliness records" ON public.cleanliness_records FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_cleanliness_records_updated_at BEFORE UPDATE ON public.cleanliness_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
