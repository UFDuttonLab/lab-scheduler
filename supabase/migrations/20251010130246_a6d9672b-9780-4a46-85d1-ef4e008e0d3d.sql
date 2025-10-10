-- Add pi_external to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'pi_external';