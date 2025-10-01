-- Add icon column to projects table
ALTER TABLE public.projects ADD COLUMN icon text;

-- Create usage_records table for quick add functionality
CREATE TABLE public.usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  samples_processed integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT positive_samples CHECK (samples_processed IS NULL OR samples_processed >= 0),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS on usage_records
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage records
CREATE POLICY "Users can view own usage records"
  ON public.usage_records
  FOR SELECT
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role));

-- Users can create their own usage records
CREATE POLICY "Users can create own usage records"
  ON public.usage_records
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own usage records
CREATE POLICY "Users can update own usage records"
  ON public.usage_records
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own usage records
CREATE POLICY "Users can delete own usage records"
  ON public.usage_records
  FOR DELETE
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'manager'::app_role));

-- Add index for better query performance
CREATE INDEX idx_usage_records_user_id ON public.usage_records(user_id);
CREATE INDEX idx_usage_records_equipment_id ON public.usage_records(equipment_id);
CREATE INDEX idx_usage_records_start_time ON public.usage_records(start_time);