
-- Create daily follow-up records table
CREATE TABLE public.daily_followup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance JSONB NOT NULL DEFAULT '["none","none","none","none"]'::jsonb,
  homework JSONB NOT NULL DEFAULT '["none","none","none","none"]'::jsonb,
  participation JSONB NOT NULL DEFAULT '["none","none","none","none"]'::jsonb,
  performance_tasks TEXT NOT NULL DEFAULT 'none',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id, record_date)
);

-- Enable RLS
ALTER TABLE public.daily_followup ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own followup" ON public.daily_followup FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own followup" ON public.daily_followup FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own followup" ON public.daily_followup FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own followup" ON public.daily_followup FOR DELETE USING (auth.uid() = user_id);
