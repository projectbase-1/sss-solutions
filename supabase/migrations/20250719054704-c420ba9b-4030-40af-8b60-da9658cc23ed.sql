
-- Add branch_id to employees table to link employees to branches
ALTER TABLE public.employees 
ADD COLUMN branch_id uuid REFERENCES public.branches(id);

-- Create employee_documents table for multiple document uploads
CREATE TABLE public.employee_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text,
  file_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add departments field to branches table (as JSON array for flexibility)
ALTER TABLE public.branches 
ADD COLUMN departments jsonb DEFAULT '[]'::jsonb;

-- Update existing branches with default departments
UPDATE public.branches 
SET departments = '["Engineering", "Operations", "Marketing", "Sales", "HR", "Finance"]'::jsonb 
WHERE departments IS NULL OR departments = '[]'::jsonb;

-- Enable RLS on employee_documents table
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for employee_documents (allow all operations for now)
CREATE POLICY "Allow all operations on employee_documents" 
ON public.employee_documents 
FOR ALL 
USING (true) 
WITH CHECK (true);
