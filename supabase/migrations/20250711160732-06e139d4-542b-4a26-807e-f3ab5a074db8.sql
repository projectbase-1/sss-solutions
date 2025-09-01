-- Enable RLS policies for employees table to allow basic CRUD operations
-- Since this is an HR management system, we'll allow all operations for now

-- Policy to allow anyone to view employees
CREATE POLICY "Allow select on employees" 
ON public.employees 
FOR SELECT 
USING (true);

-- Policy to allow anyone to insert employees
CREATE POLICY "Allow insert on employees" 
ON public.employees 
FOR INSERT 
WITH CHECK (true);

-- Policy to allow anyone to update employees
CREATE POLICY "Allow update on employees" 
ON public.employees 
FOR UPDATE 
USING (true);

-- Policy to allow anyone to delete employees
CREATE POLICY "Allow delete on employees" 
ON public.employees 
FOR DELETE 
USING (true);

-- Also add similar policies for attendance table since it references employees
CREATE POLICY "Allow select on attendance" 
ON public.attendance 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert on attendance" 
ON public.attendance 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update on attendance" 
ON public.attendance 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete on attendance" 
ON public.attendance 
FOR DELETE 
USING (true);

-- Add policies for payroll table
CREATE POLICY "Allow select on payroll" 
ON public.payroll 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert on payroll" 
ON public.payroll 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update on payroll" 
ON public.payroll 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete on payroll" 
ON public.payroll 
FOR DELETE 
USING (true);

-- Add policies for goals table
CREATE POLICY "Allow select on goals" 
ON public.goals 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert on goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update on goals" 
ON public.goals 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete on goals" 
ON public.goals 
FOR DELETE 
USING (true);

-- Add policies for performance_reviews table
CREATE POLICY "Allow select on performance_reviews" 
ON public.performance_reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert on performance_reviews" 
ON public.performance_reviews 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update on performance_reviews" 
ON public.performance_reviews 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete on performance_reviews" 
ON public.performance_reviews 
FOR DELETE 
USING (true);

-- Add policies for job_postings table
CREATE POLICY "Allow select on job_postings" 
ON public.job_postings 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert on job_postings" 
ON public.job_postings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update on job_postings" 
ON public.job_postings 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete on job_postings" 
ON public.job_postings 
FOR DELETE 
USING (true);

-- Add policies for job_applications table
CREATE POLICY "Allow select on job_applications" 
ON public.job_applications 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert on job_applications" 
ON public.job_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update on job_applications" 
ON public.job_applications 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete on job_applications" 
ON public.job_applications 
FOR DELETE 
USING (true);

-- Add policies for interviews table
CREATE POLICY "Allow select on interviews" 
ON public.interviews 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert on interviews" 
ON public.interviews 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update on interviews" 
ON public.interviews 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow delete on interviews" 
ON public.interviews 
FOR DELETE 
USING (true);