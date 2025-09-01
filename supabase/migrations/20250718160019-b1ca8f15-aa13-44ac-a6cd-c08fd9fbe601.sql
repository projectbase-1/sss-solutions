
-- Add ot_amount column to payroll table
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS ot_amount numeric DEFAULT 0;
