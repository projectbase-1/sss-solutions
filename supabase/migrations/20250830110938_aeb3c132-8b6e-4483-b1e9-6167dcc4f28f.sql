-- Add driver fields to branches table
ALTER TABLE public.branches 
ADD COLUMN driver_enabled boolean DEFAULT false,
ADD COLUMN driver_rate numeric DEFAULT 60;

-- Add driver field to employees table  
ALTER TABLE public.employees
ADD COLUMN is_driver boolean DEFAULT false;