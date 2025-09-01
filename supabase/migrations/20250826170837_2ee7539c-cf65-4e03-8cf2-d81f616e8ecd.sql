-- Create shared datasets table to track which user's data should be shared
CREATE TABLE public.shared_datasets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_user_id uuid NOT NULL,
  shared_with_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(shared_with_user_id)
);

-- Enable RLS on shared_datasets
ALTER TABLE public.shared_datasets ENABLE ROW LEVEL SECURITY;

-- RLS policies for shared_datasets
CREATE POLICY "Users can view their shared dataset info" 
ON public.shared_datasets 
FOR SELECT 
USING (auth.uid() = shared_with_user_id OR auth.uid() = master_user_id);

-- Insert the master dataset (test@g.in user) - we'll need to get the actual UUID
-- For now, we'll create a function to handle this
CREATE OR REPLACE FUNCTION public.get_master_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT id FROM auth.users WHERE email = 'test@g.in' LIMIT 1;
$$;

-- Function to get the effective user ID (either user's own ID or master user ID if they're sharing)
CREATE OR REPLACE FUNCTION public.get_effective_user_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT master_user_id FROM public.shared_datasets WHERE shared_with_user_id = user_uuid),
    user_uuid
  );
$$;

-- Update get_user_employee_ids function to use shared data
CREATE OR REPLACE FUNCTION public.get_user_employee_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(id) FROM public.employees WHERE user_id = public.get_effective_user_id(user_uuid);
$$;

-- Update get_user_job_posting_ids function
CREATE OR REPLACE FUNCTION public.get_user_job_posting_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(id) FROM public.job_postings WHERE user_id = public.get_effective_user_id(user_uuid);
$$;

-- Update get_user_job_application_ids function
CREATE OR REPLACE FUNCTION public.get_user_job_application_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(ja.id) 
  FROM public.job_applications ja
  JOIN public.job_postings jp ON ja.job_posting_id = jp.id
  WHERE jp.user_id = public.get_effective_user_id(user_uuid);
$$;

-- Update RLS policies for user-specific tables to use effective user ID

-- Update employees policies
DROP POLICY IF EXISTS "Users can view their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON public.employees;

CREATE POLICY "Users can view their own employees" 
ON public.employees 
FOR SELECT 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can insert their own employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can update their own employees" 
ON public.employees 
FOR UPDATE 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can delete their own employees" 
ON public.employees 
FOR DELETE 
USING (user_id = public.get_effective_user_id(auth.uid()));

-- Update branches policies
DROP POLICY IF EXISTS "Users can view their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can insert their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can update their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can delete their own branches" ON public.branches;

CREATE POLICY "Users can view their own branches" 
ON public.branches 
FOR SELECT 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can insert their own branches" 
ON public.branches 
FOR INSERT 
WITH CHECK (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can update their own branches" 
ON public.branches 
FOR UPDATE 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can delete their own branches" 
ON public.branches 
FOR DELETE 
USING (user_id = public.get_effective_user_id(auth.uid()));

-- Update job_postings policies
DROP POLICY IF EXISTS "Users can view their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can insert their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can update their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can delete their own job postings" ON public.job_postings;

CREATE POLICY "Users can view their own job postings" 
ON public.job_postings 
FOR SELECT 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can insert their own job postings" 
ON public.job_postings 
FOR INSERT 
WITH CHECK (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can update their own job postings" 
ON public.job_postings 
FOR UPDATE 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can delete their own job postings" 
ON public.job_postings 
FOR DELETE 
USING (user_id = public.get_effective_user_id(auth.uid()));

-- Update settings tables policies
DROP POLICY IF EXISTS "Users can view their own general settings" ON public.general_settings;
DROP POLICY IF EXISTS "Users can insert their own general settings" ON public.general_settings;
DROP POLICY IF EXISTS "Users can update their own general settings" ON public.general_settings;

CREATE POLICY "Users can view their own general settings" 
ON public.general_settings 
FOR SELECT 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can insert their own general settings" 
ON public.general_settings 
FOR INSERT 
WITH CHECK (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can update their own general settings" 
ON public.general_settings 
FOR UPDATE 
USING (user_id = public.get_effective_user_id(auth.uid()));

-- Update payroll_settings policies
DROP POLICY IF EXISTS "Users can view their own payroll settings" ON public.payroll_settings;
DROP POLICY IF EXISTS "Users can insert their own payroll settings" ON public.payroll_settings;
DROP POLICY IF EXISTS "Users can update their own payroll settings" ON public.payroll_settings;

CREATE POLICY "Users can view their own payroll settings" 
ON public.payroll_settings 
FOR SELECT 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can insert their own payroll settings" 
ON public.payroll_settings 
FOR INSERT 
WITH CHECK (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can update their own payroll settings" 
ON public.payroll_settings 
FOR UPDATE 
USING (user_id = public.get_effective_user_id(auth.uid()));

-- Update notification_settings policies
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;

CREATE POLICY "Users can view their own notification settings" 
ON public.notification_settings 
FOR SELECT 
USING (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can insert their own notification settings" 
ON public.notification_settings 
FOR INSERT 
WITH CHECK (user_id = public.get_effective_user_id(auth.uid()));

CREATE POLICY "Users can update their own notification settings" 
ON public.notification_settings 
FOR UPDATE 
USING (user_id = public.get_effective_user_id(auth.uid()));

-- Create indexes for better performance with large datasets
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_month ON public.attendance(month);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON public.payroll(pay_period_start, pay_period_end);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id ON public.performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_date ON public.performance_reviews(review_date);

-- Function to automatically add new users to shared dataset
CREATE OR REPLACE FUNCTION public.handle_new_user_shared_dataset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  master_user_uuid uuid;
BEGIN
  -- Get the master user ID (test@g.in)
  SELECT id INTO master_user_uuid FROM auth.users WHERE email = 'test@g.in' LIMIT 1;
  
  -- If master user exists and this is not the master user, add to shared dataset
  IF master_user_uuid IS NOT NULL AND NEW.id != master_user_uuid THEN
    INSERT INTO public.shared_datasets (master_user_id, shared_with_user_id)
    VALUES (master_user_uuid, NEW.id)
    ON CONFLICT (shared_with_user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic shared dataset setup
DROP TRIGGER IF EXISTS on_auth_user_created_shared_dataset ON auth.users;
CREATE TRIGGER on_auth_user_created_shared_dataset
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_shared_dataset();

-- Add existing users to shared dataset (except master user)
INSERT INTO public.shared_datasets (master_user_id, shared_with_user_id)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'test@g.in' LIMIT 1) as master_user_id,
  id as shared_with_user_id
FROM auth.users 
WHERE email != 'test@g.in'
ON CONFLICT (shared_with_user_id) DO NOTHING;