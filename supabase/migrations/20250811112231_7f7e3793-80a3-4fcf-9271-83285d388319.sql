-- Add days column to employees table
ALTER TABLE public.employees 
ADD COLUMN days integer DEFAULT 0;