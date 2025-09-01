-- Add critical indexes for performance optimization

-- Index for employees table (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch_id ON public.employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);

-- Index for attendance table (heavy joins and filtering)
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_month ON public.attendance(month);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance(employee_id, date);

-- Index for payroll table (frequent queries)
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON public.payroll(month);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_month ON public.payroll(employee_id, month);

-- Index for employee_documents (file operations)
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON public.employee_documents(employee_id);

-- Index for performance_reviews
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id ON public.performance_reviews(employee_id);

-- Index for leave_requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);

-- Index for goals
CREATE INDEX IF NOT EXISTS idx_goals_employee_id ON public.goals(employee_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_employees_user_status ON public.employees(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_month_status ON public.attendance(employee_id, month, status);

-- Index for branches
CREATE INDEX IF NOT EXISTS idx_branches_user_id ON public.branches(user_id);