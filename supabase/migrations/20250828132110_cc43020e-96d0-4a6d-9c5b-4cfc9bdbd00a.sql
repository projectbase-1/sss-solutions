-- Remove user-based RLS policies and make all data globally accessible to authenticated users

-- Drop existing RLS policies for employees
DROP POLICY IF EXISTS "Users can view their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON public.employees;

-- Create new global RLS policies for employees
CREATE POLICY "Authenticated users can view all employees" ON public.employees
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert employees" ON public.employees
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all employees" ON public.employees
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all employees" ON public.employees
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for branches
DROP POLICY IF EXISTS "Users can view their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can insert their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can update their own branches" ON public.branches;
DROP POLICY IF EXISTS "Users can delete their own branches" ON public.branches;

-- Create new global RLS policies for branches
CREATE POLICY "Authenticated users can view all branches" ON public.branches
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert branches" ON public.branches
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all branches" ON public.branches
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all branches" ON public.branches
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for attendance
DROP POLICY IF EXISTS "Users can view attendance for their employees" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert attendance for their employees" ON public.attendance;
DROP POLICY IF EXISTS "Users can update attendance for their employees" ON public.attendance;
DROP POLICY IF EXISTS "Users can delete attendance for their employees" ON public.attendance;

-- Create new global RLS policies for attendance
CREATE POLICY "Authenticated users can view all attendance" ON public.attendance
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert attendance" ON public.attendance
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all attendance" ON public.attendance
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all attendance" ON public.attendance
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for payroll
DROP POLICY IF EXISTS "Users can view payroll for their employees" ON public.payroll;
DROP POLICY IF EXISTS "Users can insert payroll for their employees" ON public.payroll;
DROP POLICY IF EXISTS "Users can update payroll for their employees" ON public.payroll;
DROP POLICY IF EXISTS "Users can delete payroll for their employees" ON public.payroll;

-- Create new global RLS policies for payroll
CREATE POLICY "Authenticated users can view all payroll" ON public.payroll
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payroll" ON public.payroll
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all payroll" ON public.payroll
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all payroll" ON public.payroll
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for leave_requests
DROP POLICY IF EXISTS "Users can view leave requests for their employees" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can insert leave requests for their employees" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update leave requests for their employees" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can delete leave requests for their employees" ON public.leave_requests;

-- Create new global RLS policies for leave_requests
CREATE POLICY "Authenticated users can view all leave requests" ON public.leave_requests
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert leave requests" ON public.leave_requests
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all leave requests" ON public.leave_requests
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all leave requests" ON public.leave_requests
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for performance_reviews
DROP POLICY IF EXISTS "Users can view performance reviews for their employees" ON public.performance_reviews;
DROP POLICY IF EXISTS "Users can insert performance reviews for their employees" ON public.performance_reviews;
DROP POLICY IF EXISTS "Users can update performance reviews for their employees" ON public.performance_reviews;
DROP POLICY IF EXISTS "Users can delete performance reviews for their employees" ON public.performance_reviews;

-- Create new global RLS policies for performance_reviews
CREATE POLICY "Authenticated users can view all performance reviews" ON public.performance_reviews
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert performance reviews" ON public.performance_reviews
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all performance reviews" ON public.performance_reviews
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all performance reviews" ON public.performance_reviews
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for goals
DROP POLICY IF EXISTS "Users can view goals for their employees" ON public.goals;
DROP POLICY IF EXISTS "Users can insert goals for their employees" ON public.goals;
DROP POLICY IF EXISTS "Users can update goals for their employees" ON public.goals;
DROP POLICY IF EXISTS "Users can delete goals for their employees" ON public.goals;

-- Create new global RLS policies for goals
CREATE POLICY "Authenticated users can view all goals" ON public.goals
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert goals" ON public.goals
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all goals" ON public.goals
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all goals" ON public.goals
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for job_postings
DROP POLICY IF EXISTS "Users can view their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can insert their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can update their own job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Users can delete their own job postings" ON public.job_postings;

-- Create new global RLS policies for job_postings
CREATE POLICY "Authenticated users can view all job postings" ON public.job_postings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert job postings" ON public.job_postings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all job postings" ON public.job_postings
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all job postings" ON public.job_postings
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for job_applications
DROP POLICY IF EXISTS "Users can view applications for their job postings" ON public.job_applications;
DROP POLICY IF EXISTS "Users can insert applications for their job postings" ON public.job_applications;
DROP POLICY IF EXISTS "Users can update applications for their job postings" ON public.job_applications;
DROP POLICY IF EXISTS "Users can delete applications for their job postings" ON public.job_applications;

-- Create new global RLS policies for job_applications
CREATE POLICY "Authenticated users can view all job applications" ON public.job_applications
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert job applications" ON public.job_applications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all job applications" ON public.job_applications
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all job applications" ON public.job_applications
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for interviews
DROP POLICY IF EXISTS "Users can view interviews for their job applications" ON public.interviews;
DROP POLICY IF EXISTS "Users can insert interviews for their job applications" ON public.interviews;
DROP POLICY IF EXISTS "Users can update interviews for their job applications" ON public.interviews;
DROP POLICY IF EXISTS "Users can delete interviews for their job applications" ON public.interviews;

-- Create new global RLS policies for interviews
CREATE POLICY "Authenticated users can view all interviews" ON public.interviews
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert interviews" ON public.interviews
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all interviews" ON public.interviews
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all interviews" ON public.interviews
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for employee_documents
DROP POLICY IF EXISTS "Users can view documents for their employees" ON public.employee_documents;
DROP POLICY IF EXISTS "Users can insert documents for their employees" ON public.employee_documents;
DROP POLICY IF EXISTS "Users can update documents for their employees" ON public.employee_documents;
DROP POLICY IF EXISTS "Users can delete documents for their employees" ON public.employee_documents;

-- Create new global RLS policies for employee_documents
CREATE POLICY "Authenticated users can view all employee documents" ON public.employee_documents
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert employee documents" ON public.employee_documents
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all employee documents" ON public.employee_documents
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete all employee documents" ON public.employee_documents
FOR DELETE TO authenticated USING (true);

-- Drop existing RLS policies for settings tables and make them global
DROP POLICY IF EXISTS "Users can view their own general settings" ON public.general_settings;
DROP POLICY IF EXISTS "Users can insert their own general settings" ON public.general_settings;
DROP POLICY IF EXISTS "Users can update their own general settings" ON public.general_settings;

-- Create new global RLS policies for general_settings
CREATE POLICY "Authenticated users can view all general settings" ON public.general_settings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert general settings" ON public.general_settings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all general settings" ON public.general_settings
FOR UPDATE TO authenticated USING (true);

-- Drop existing RLS policies for payroll_settings
DROP POLICY IF EXISTS "Users can view their own payroll settings" ON public.payroll_settings;
DROP POLICY IF EXISTS "Users can insert their own payroll settings" ON public.payroll_settings;  
DROP POLICY IF EXISTS "Users can update their own payroll settings" ON public.payroll_settings;

-- Create new global RLS policies for payroll_settings
CREATE POLICY "Authenticated users can view all payroll settings" ON public.payroll_settings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert payroll settings" ON public.payroll_settings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all payroll settings" ON public.payroll_settings
FOR UPDATE TO authenticated USING (true);

-- Drop existing RLS policies for notification_settings
DROP POLICY IF EXISTS "Users can view their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can insert their own notification settings" ON public.notification_settings;
DROP POLICY IF EXISTS "Users can update their own notification settings" ON public.notification_settings;

-- Create new global RLS policies for notification_settings
CREATE POLICY "Authenticated users can view all notification settings" ON public.notification_settings
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert notification settings" ON public.notification_settings
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update all notification settings" ON public.notification_settings
FOR UPDATE TO authenticated USING (true);