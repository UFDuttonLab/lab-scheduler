-- Drop the old constraint that only allows 'robot' and 'equipment'
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_type_check;

-- Add new constraint that includes all four equipment types
ALTER TABLE public.equipment ADD CONSTRAINT equipment_type_check 
  CHECK (type IN ('robot', 'equipment', 'quantification', 'PCR'));