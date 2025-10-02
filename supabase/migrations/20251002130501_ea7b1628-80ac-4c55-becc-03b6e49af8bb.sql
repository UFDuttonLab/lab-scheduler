-- Drop both existing activity logging triggers on profiles table
DROP TRIGGER IF EXISTS log_profile_changes ON public.profiles;
DROP TRIGGER IF EXISTS log_profiles_activity ON public.profiles;

-- Create a single comprehensive trigger for all profile operations
CREATE TRIGGER log_profile_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_activity();