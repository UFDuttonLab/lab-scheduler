-- Add project_samples column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN project_samples JSONB DEFAULT NULL;

-- Add project_samples column to usage_records table
ALTER TABLE public.usage_records 
ADD COLUMN project_samples JSONB DEFAULT NULL;

COMMENT ON COLUMN public.bookings.project_samples IS 'Array of {project_id: uuid, samples: number} for multi-project tracking';
COMMENT ON COLUMN public.usage_records.project_samples IS 'Array of {project_id: uuid, samples: number} for multi-project tracking';