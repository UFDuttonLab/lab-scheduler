-- Update equipment type constraint to include HiPerGator
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_type_check;
ALTER TABLE public.equipment ADD CONSTRAINT equipment_type_check 
  CHECK (type IN ('robot', 'equipment', 'quantification', 'PCR', 'HiPerGator'));

-- Add resource allocation columns to bookings table
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS cpu_count integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS gpu_count integer;

-- Add check constraints to ensure valid resource allocations
ALTER TABLE public.bookings ADD CONSTRAINT cpu_count_valid 
  CHECK (cpu_count IS NULL OR (cpu_count >= 1 AND cpu_count <= 32));
ALTER TABLE public.bookings ADD CONSTRAINT gpu_count_valid 
  CHECK (gpu_count IS NULL OR (gpu_count >= 0 AND gpu_count <= 2));