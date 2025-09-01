
-- Add per_day_salary column to employees table
ALTER TABLE public.employees 
ADD COLUMN per_day_salary numeric DEFAULT 0;

-- Update existing records to set per_day_salary from day_rate if it exists
UPDATE public.employees 
SET per_day_salary = COALESCE(day_rate, 0) 
WHERE per_day_salary IS NULL;
