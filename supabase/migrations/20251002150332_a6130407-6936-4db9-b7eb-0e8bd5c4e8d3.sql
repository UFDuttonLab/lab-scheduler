-- Update equipment type constraint to include Sequencer
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_type_check;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_type_check 
  CHECK (type IN ('robot', 'equipment', 'quantification', 'PCR', 'HiPerGator', 'Sequencer'));