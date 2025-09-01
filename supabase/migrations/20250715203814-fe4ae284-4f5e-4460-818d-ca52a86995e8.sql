-- Add new columns to employees table for PF, advance, notes, pan card, and document upload
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS pf numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS advance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS pan_card text,
ADD COLUMN IF NOT EXISTS document_url text;

-- Create unique constraint on pan_card to ensure no duplicates
ALTER TABLE public.employees 
ADD CONSTRAINT unique_pan_card UNIQUE (pan_card);

-- Create index for better performance on pan_card queries
CREATE INDEX IF NOT EXISTS idx_employees_pan_card ON public.employees(pan_card);