
-- Add stars column to behavior_records (array of 10: 0=empty, 1=green, 2=red)
ALTER TABLE public.behavior_records ADD COLUMN stars JSONB NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0]'::jsonb;

-- Add stars column to disturbance_records
ALTER TABLE public.disturbance_records ADD COLUMN stars JSONB NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0]'::jsonb;

-- Add stars column to cooperation_records
ALTER TABLE public.cooperation_records ADD COLUMN stars JSONB NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0]'::jsonb;

-- Add stars column to cleanliness_records
ALTER TABLE public.cleanliness_records ADD COLUMN stars JSONB NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0]'::jsonb;
