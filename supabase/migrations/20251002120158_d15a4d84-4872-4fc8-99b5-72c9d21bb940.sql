-- Create enums for activity logging
CREATE TYPE public.action_type AS ENUM ('create', 'update', 'delete', 'login', 'logout');
CREATE TYPE public.entity_type AS ENUM ('booking', 'equipment', 'project', 'user', 'usage_record', 'profile');

-- Create app_versions table
CREATE TABLE public.app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  released_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  released_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  action_type action_type NOT NULL,
  entity_type entity_type NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS on app_versions
ALTER TABLE public.app_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for app_versions
CREATE POLICY "Everyone can view versions"
  ON public.app_versions
  FOR SELECT
  USING (true);

CREATE POLICY "Only PI can manage versions"
  ON public.app_versions
  FOR ALL
  USING (has_role(auth.uid(), 'pi'::app_role));

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_logs
CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "PI, Post-Docs, Grad Students, and Managers can view all logs"
  ON public.activity_logs
  FOR SELECT
  USING (has_any_role(auth.uid(), ARRAY['pi'::app_role, 'postdoc'::app_role, 'grad_student'::app_role, 'manager'::app_role]));

CREATE POLICY "Only triggers can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  WITH CHECK (false);

-- Helper function to get current version
CREATE OR REPLACE FUNCTION public.get_current_version()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT version 
  FROM public.app_versions 
  ORDER BY released_at DESC 
  LIMIT 1;
$$;

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action_type action_type;
  v_entity_type entity_type;
  v_entity_name TEXT;
  v_changes JSONB;
BEGIN
  -- Determine action type
  IF (TG_OP = 'INSERT') THEN
    v_action_type := 'create';
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action_type := 'update';
  ELSIF (TG_OP = 'DELETE') THEN
    v_action_type := 'delete';
  END IF;

  -- Determine entity type based on table name
  CASE TG_TABLE_NAME
    WHEN 'bookings' THEN v_entity_type := 'booking';
    WHEN 'equipment' THEN v_entity_type := 'equipment';
    WHEN 'projects' THEN v_entity_type := 'project';
    WHEN 'usage_records' THEN v_entity_type := 'usage_record';
    WHEN 'profiles' THEN v_entity_type := 'profile';
    WHEN 'user_roles' THEN v_entity_type := 'user';
  END CASE;

  -- Build changes JSON for updates
  IF (TG_OP = 'UPDATE') THEN
    v_changes := jsonb_build_object(
      'before', to_jsonb(OLD),
      'after', to_jsonb(NEW)
    );
  END IF;

  -- Get entity name based on table
  IF (TG_OP = 'DELETE') THEN
    CASE TG_TABLE_NAME
      WHEN 'bookings' THEN v_entity_name := 'Booking #' || OLD.id::TEXT;
      WHEN 'equipment' THEN v_entity_name := OLD.name;
      WHEN 'projects' THEN v_entity_name := OLD.name;
      WHEN 'usage_records' THEN v_entity_name := 'Usage Record #' || OLD.id::TEXT;
      WHEN 'profiles' THEN v_entity_name := OLD.full_name;
      WHEN 'user_roles' THEN v_entity_name := 'Role Change';
    END CASE;
  ELSE
    CASE TG_TABLE_NAME
      WHEN 'bookings' THEN v_entity_name := 'Booking #' || NEW.id::TEXT;
      WHEN 'equipment' THEN v_entity_name := NEW.name;
      WHEN 'projects' THEN v_entity_name := NEW.name;
      WHEN 'usage_records' THEN v_entity_name := 'Usage Record #' || NEW.id::TEXT;
      WHEN 'profiles' THEN v_entity_name := NEW.full_name;
      WHEN 'user_roles' THEN v_entity_name := 'Role Change';
    END CASE;
  END IF;

  -- Insert activity log
  INSERT INTO public.activity_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    changes
  ) VALUES (
    COALESCE(auth.uid(), (CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END)),
    v_action_type,
    v_entity_type,
    CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
    v_entity_name,
    v_changes
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for activity logging
CREATE TRIGGER log_bookings_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_equipment_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_projects_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_usage_records_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.usage_records
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_profiles_activity
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

CREATE TRIGGER log_user_roles_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.log_activity();

-- Create indexes for performance
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity_type ON public.activity_logs(entity_type);
CREATE INDEX idx_activity_logs_action_type ON public.activity_logs(action_type);

-- Insert initial version record
INSERT INTO public.app_versions (version, changes, released_by)
VALUES (
  '1.1.0',
  '[
    {"type": "feature", "description": "Added version tracking system"},
    {"type": "feature", "description": "Added comprehensive activity logging"},
    {"type": "feature", "description": "Added booking validation for past dates and duration limits"},
    {"type": "feature", "description": "Extended time slots from 6 AM to 10 PM"},
    {"type": "feature", "description": "Added visual indicators in Analytics for Quick Add vs Scheduled bookings"}
  ]'::jsonb,
  (SELECT id FROM public.profiles WHERE email = 'duttonc@ufl.edu' LIMIT 1)
);