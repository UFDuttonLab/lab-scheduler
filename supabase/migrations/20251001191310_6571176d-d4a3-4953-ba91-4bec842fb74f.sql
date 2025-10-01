-- Add samples_processed and collaborators columns to bookings table
ALTER TABLE public.bookings
ADD COLUMN samples_processed integer CHECK (samples_processed >= 1 AND samples_processed <= 100),
ADD COLUMN collaborators jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.bookings.samples_processed IS 'Number of samples being processed in this booking (1-100)';
COMMENT ON COLUMN public.bookings.collaborators IS 'Array of user IDs who are collaborating on this booking';