-- Drop the old constraint that limits samples to 100
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_samples_processed_check;

-- Add new constraint allowing up to 300 samples
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_samples_processed_check 
CHECK (samples_processed IS NULL OR (samples_processed >= 1 AND samples_processed <= 300));

-- Update the comment to reflect the new limit
COMMENT ON COLUMN public.bookings.samples_processed IS 'Number of samples being processed in this booking (1-300)';