-- Update get_user_employee_ids function to use shared data
CREATE OR REPLACE FUNCTION public.get_user_employee_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(id) FROM public.employees WHERE user_id = COALESCE(
    (SELECT master_user_id FROM public.shared_datasets WHERE shared_with_user_id = user_uuid),
    user_uuid
  );
$$;

-- Update get_user_job_posting_ids function
CREATE OR REPLACE FUNCTION public.get_user_job_posting_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(id) FROM public.job_postings WHERE user_id = COALESCE(
    (SELECT master_user_id FROM public.shared_datasets WHERE shared_with_user_id = user_uuid),
    user_uuid
  );
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
  WHERE jp.user_id = COALESCE(
    (SELECT master_user_id FROM public.shared_datasets WHERE shared_with_user_id = user_uuid),
    user_uuid
  );
$$;

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

CREATE INDEX IF NOT EXISTS idx_shared_datasets_shared_with ON public.shared_datasets(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_datasets_master ON public.shared_datasets(master_user_id);