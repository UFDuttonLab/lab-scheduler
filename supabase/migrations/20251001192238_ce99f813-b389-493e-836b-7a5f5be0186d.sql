-- Add icon, max_cpu_count, and max_gpu_count columns to equipment table
ALTER TABLE public.equipment
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS max_cpu_count integer,
ADD COLUMN IF NOT EXISTS max_gpu_count integer;

-- Set default icons for existing equipment based on type
UPDATE public.equipment
SET icon = CASE
  WHEN type = 'robot' THEN '🤖'
  WHEN type = 'PCR' THEN '🧬'
  WHEN type = 'quantification' THEN '📊'
  WHEN type = 'HiPerGator' THEN '💻'
  ELSE '🛠️'
END
WHERE icon IS NULL;

-- Set default resource limits for existing HiPerGator equipment
UPDATE public.equipment
SET max_cpu_count = 32, max_gpu_count = 4
WHERE type = 'HiPerGator' AND (max_cpu_count IS NULL OR max_gpu_count IS NULL);