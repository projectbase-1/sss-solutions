-- Add ot_rate to branches for per-branch OT calculations
ALTER TABLE public.branches
ADD COLUMN IF NOT EXISTS ot_rate numeric NOT NULL DEFAULT 60;

-- Optional: set a sensible default for existing rows is already handled by DEFAULT 60
-- No changes to RLS needed since selects/updates already scoped by user_id
