-- Drop and recreate the trigger on profiles table to use updated log_activity function
DROP TRIGGER IF EXISTS log_profile_changes ON public.profiles;

CREATE TRIGGER log_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();