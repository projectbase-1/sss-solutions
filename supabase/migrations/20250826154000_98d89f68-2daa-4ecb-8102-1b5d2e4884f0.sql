-- Add missing fields to employees table
ALTER TABLE public.employees 
ADD COLUMN fathers_name TEXT,
ADD COLUMN date_of_birth DATE;