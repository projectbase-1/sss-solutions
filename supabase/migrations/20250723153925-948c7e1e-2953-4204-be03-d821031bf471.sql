-- Enable RLS on all tables
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations (since this is an internal HR system)
CREATE POLICY "Allow all operations on attendance" ON public.attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on interviews" ON public.interviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on job_applications" ON public.job_applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on job_postings" ON public.job_postings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on leave_requests" ON public.leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on payroll" ON public.payroll FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on performance_reviews" ON public.performance_reviews FOR ALL USING (true) WITH CHECK (true);