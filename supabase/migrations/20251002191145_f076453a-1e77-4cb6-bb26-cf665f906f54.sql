-- Add explicit deny policies to password_reset_tokens table
-- This makes it crystal clear that NO users can access this table
-- Only service role (edge functions) can access it

-- Deny all SELECT operations
CREATE POLICY "Deny all SELECT on password_reset_tokens"
ON public.password_reset_tokens
FOR SELECT
TO public
USING (false);

-- Deny all INSERT operations
CREATE POLICY "Deny all INSERT on password_reset_tokens"
ON public.password_reset_tokens
FOR INSERT
TO public
WITH CHECK (false);

-- Deny all UPDATE operations
CREATE POLICY "Deny all UPDATE on password_reset_tokens"
ON public.password_reset_tokens
FOR UPDATE
TO public
USING (false);

-- Deny all DELETE operations
CREATE POLICY "Deny all DELETE on password_reset_tokens"
ON public.password_reset_tokens
FOR DELETE
TO public
USING (false);