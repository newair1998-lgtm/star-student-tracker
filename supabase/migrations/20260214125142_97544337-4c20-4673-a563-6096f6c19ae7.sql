
-- Behavior points table
CREATE TABLE public.behavior_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id)
);

ALTER TABLE public.behavior_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own behavior records" ON public.behavior_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own behavior records" ON public.behavior_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own behavior records" ON public.behavior_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own behavior records" ON public.behavior_records FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_behavior_records_updated_at BEFORE UPDATE ON public.behavior_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Disturbance records table
CREATE TABLE public.disturbance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, student_id)
);

ALTER TABLE public.disturbance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own disturbance records" ON public.disturbance_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own disturbance records" ON public.disturbance_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own disturbance records" ON public.disturbance_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own disturbance records" ON public.disturbance_records FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_disturbance_records_updated_at BEFORE UPDATE ON public.disturbance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Classroom groups table
CREATE TABLE public.classroom_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  section_key TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classroom_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own groups" ON public.classroom_groups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own groups" ON public.classroom_groups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own groups" ON public.classroom_groups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own groups" ON public.classroom_groups FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_classroom_groups_updated_at BEFORE UPDATE ON public.classroom_groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Group members junction table
CREATE TABLE public.classroom_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.classroom_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  UNIQUE(group_id, student_id)
);

ALTER TABLE public.classroom_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own group members" ON public.classroom_group_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.classroom_groups g WHERE g.id = group_id AND g.user_id = auth.uid())
);
CREATE POLICY "Users can insert their own group members" ON public.classroom_group_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.classroom_groups g WHERE g.id = group_id AND g.user_id = auth.uid())
);
CREATE POLICY "Users can delete their own group members" ON public.classroom_group_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.classroom_groups g WHERE g.id = group_id AND g.user_id = auth.uid())
);

-- Classroom notes table
CREATE TABLE public.classroom_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  text TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('positive', 'negative', 'general')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.classroom_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes" ON public.classroom_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notes" ON public.classroom_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.classroom_notes FOR DELETE USING (auth.uid() = user_id);
