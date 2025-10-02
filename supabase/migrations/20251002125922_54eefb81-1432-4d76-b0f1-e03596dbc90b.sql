-- Fix log_activity function to handle profiles table correctly
CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  -- Handle profiles table differently since it uses 'id' instead of 'user_id'
  INSERT INTO public.activity_logs (
    user_id,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    changes
  ) VALUES (
    COALESCE(
      auth.uid(), 
      CASE 
        WHEN TG_TABLE_NAME = 'profiles' THEN 
          (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END)
        ELSE 
          (CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END)
      END
    ),
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
$function$;