-- Add booking_group_id to bookings table
ALTER TABLE public.bookings
ADD COLUMN booking_group_id UUID;

-- Add booking_group_id to usage_records table
ALTER TABLE public.usage_records
ADD COLUMN booking_group_id UUID;

-- Add index for faster queries on booking groups
CREATE INDEX idx_bookings_booking_group_id ON public.bookings(booking_group_id);
CREATE INDEX idx_usage_records_booking_group_id ON public.usage_records(booking_group_id);