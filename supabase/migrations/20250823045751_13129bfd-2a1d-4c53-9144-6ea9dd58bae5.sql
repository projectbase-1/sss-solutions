-- Add branch_id to attendance table to track which branch employee worked at during attendance
ALTER TABLE public.attendance 
ADD COLUMN branch_id UUID REFERENCES public.branches(id);

-- Create index for better performance on branch_id queries
CREATE INDEX idx_attendance_branch_id ON public.attendance(branch_id);

-- Backfill existing attendance records with current employee branch_id
UPDATE public.attendance 
SET branch_id = employees.branch_id 
FROM public.employees 
WHERE attendance.employee_id = employees.id 
AND attendance.branch_id IS NULL;