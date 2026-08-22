-- Reverses 20260822140000_recruiting_use_scheduler_projects.sql.
--
-- PARTIAL BY NATURE. Recreating recruiting_projects is easy; knowing which scheduler
-- descriptions were blank before the migration filled them in is not, because that
-- information was overwritten. This script recreates the table and repoints the positions
-- at it, and leaves public.projects.description alone - clear those by hand if you want
-- the scheduler back exactly as it was.

CREATE TABLE IF NOT EXISTS public.recruiting_projects (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL UNIQUE,
  blurb                text NOT NULL CHECK (length(btrim(blurb)) BETWEEN 10 AND 400),
  active               boolean NOT NULL DEFAULT true,
  scheduler_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at ON public.recruiting_projects;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recruiting_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- One recruiting project per scheduler project that currently has a listing.
INSERT INTO public.recruiting_projects (name, blurb, scheduler_project_id)
SELECT DISTINCT pr.name,
       coalesce(nullif(btrim(pr.description), ''), 'Description to be written.'),
       pr.id
  FROM public.recruiting_positions p
  JOIN public.projects pr ON pr.id = p.project_id
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.recruiting_positions DROP CONSTRAINT IF EXISTS recruiting_positions_project_id_fkey;

UPDATE public.recruiting_positions p
   SET project_id = rp.id
  FROM public.recruiting_projects rp
 WHERE rp.scheduler_project_id = p.project_id;

ALTER TABLE public.recruiting_positions
  ADD CONSTRAINT recruiting_positions_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.recruiting_projects(id) ON DELETE RESTRICT;

ALTER TABLE public.recruiting_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visitors can view active projects" ON public.recruiting_projects;
CREATE POLICY "Visitors can view active projects"
  ON public.recruiting_projects FOR SELECT TO anon USING (active = true);

DROP POLICY IF EXISTS "Lab members can view all recruiting projects" ON public.recruiting_projects;
CREATE POLICY "Lab members can view all recruiting projects"
  ON public.recruiting_projects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "PI can manage recruiting projects" ON public.recruiting_projects;
CREATE POLICY "PI can manage recruiting projects"
  ON public.recruiting_projects FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'pi'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'pi'::app_role));

REVOKE ALL ON TABLE public.recruiting_projects FROM anon, authenticated;
GRANT SELECT ON public.recruiting_projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recruiting_projects TO authenticated;

DROP VIEW IF EXISTS public.recruiting_open_positions;
