-- Update RLS policies to include pi_external

-- Projects table
DROP POLICY IF EXISTS "Only PI, Post-Docs, and Grad Students can manage projects" ON projects;
CREATE POLICY "Only PI, Post-Docs, Grad Students, and External PIs can manage projects" ON projects
FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['pi'::app_role, 'postdoc'::app_role, 'grad_student'::app_role, 'manager'::app_role, 'pi_external'::app_role]));

-- Equipment table
DROP POLICY IF EXISTS "Only PI, Post-Docs, and Grad Students can manage equipment" ON equipment;
CREATE POLICY "Only PI, Post-Docs, Grad Students, and External PIs can manage equipment" ON equipment
FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['pi'::app_role, 'postdoc'::app_role, 'grad_student'::app_role, 'manager'::app_role, 'pi_external'::app_role]));

-- Equipment projects table
DROP POLICY IF EXISTS "Only PI, Post-Docs, and Grad Students can manage equipment proj" ON equipment_projects;
CREATE POLICY "Only PI, Post-Docs, Grad Students, and External PIs can manage equipment projects" ON equipment_projects
FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['pi'::app_role, 'postdoc'::app_role, 'grad_student'::app_role, 'manager'::app_role, 'pi_external'::app_role]));

-- Activity logs
DROP POLICY IF EXISTS "PI, Post-Docs, Grad Students, and Managers can view all logs" ON activity_logs;
CREATE POLICY "PI, Post-Docs, Grad Students, Managers, and External PIs can view all logs" ON activity_logs
FOR SELECT
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['pi'::app_role, 'postdoc'::app_role, 'grad_student'::app_role, 'manager'::app_role, 'pi_external'::app_role]));

-- Usage records
DROP POLICY IF EXISTS "Users can view own usage records or PI/Post-Docs/Grad Students " ON usage_records;
CREATE POLICY "Users can view own usage records or elevated roles" ON usage_records
FOR SELECT
TO authenticated
USING ((user_id = auth.uid()) OR has_any_role(auth.uid(), ARRAY['pi'::app_role, 'postdoc'::app_role, 'grad_student'::app_role, 'manager'::app_role, 'pi_external'::app_role]));