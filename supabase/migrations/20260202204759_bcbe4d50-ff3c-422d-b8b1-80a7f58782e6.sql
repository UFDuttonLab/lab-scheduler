-- Drop existing policies
DROP POLICY IF EXISTS "Only PI, Post-Docs, Grad Students, and External PIs can manage " ON public.equipment;
DROP POLICY IF EXISTS "Only PI, Post-Docs, Grad Students, and External PIs can manage " ON public.equipment_projects;

-- Create updated policies including undergrad_student
CREATE POLICY "Elevated roles can manage equipment" ON public.equipment
FOR ALL TO authenticated
USING (has_any_role(auth.uid(), ARRAY[
  'pi'::app_role, 
  'postdoc'::app_role, 
  'grad_student'::app_role, 
  'manager'::app_role, 
  'pi_external'::app_role,
  'undergrad_student'::app_role
]));

CREATE POLICY "Elevated roles can manage equipment projects" ON public.equipment_projects
FOR ALL TO authenticated
USING (has_any_role(auth.uid(), ARRAY[
  'pi'::app_role, 
  'postdoc'::app_role, 
  'grad_student'::app_role, 
  'manager'::app_role, 
  'pi_external'::app_role,
  'undergrad_student'::app_role
]));