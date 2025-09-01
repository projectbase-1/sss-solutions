
-- Add new columns to the payroll table to match the Excel format
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS pf_number text,
ADD COLUMN IF NOT EXISTS esi_number text,
ADD COLUMN IF NOT EXISTS worked_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS man_days_details jsonb,
ADD COLUMN IF NOT EXISTS salary_components jsonb,
ADD COLUMN IF NOT EXISTS gross_earnings numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS pf_12_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS esi_0_75_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS food numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS uniform numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS lunch numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS take_home numeric DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_pf_number ON public.payroll(pf_number);
CREATE INDEX IF NOT EXISTS idx_payroll_esi_number ON public.payroll(esi_number);

-- Update the employees table to include PF and ESI numbers
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS pf_number text,
ADD COLUMN IF NOT EXISTS esi_number text;

-- Create unique constraints to ensure no duplicate PF/ESI numbers
ALTER TABLE public.employees 
ADD CONSTRAINT unique_pf_number_employees UNIQUE (pf_number),
ADD CONSTRAINT unique_esi_number_employees UNIQUE (esi_number);

-- Create indexes for better performance on employees table
CREATE INDEX IF NOT EXISTS idx_employees_pf_number ON public.employees(pf_number);
CREATE INDEX IF NOT EXISTS idx_employees_esi_number ON public.employees(esi_number);
