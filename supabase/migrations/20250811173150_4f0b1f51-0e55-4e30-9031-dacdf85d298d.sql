-- Add food and deduction columns to attendance table
ALTER TABLE public.attendance 
ADD COLUMN food INTEGER DEFAULT 0,
ADD COLUMN deduction INTEGER DEFAULT 0,
ADD COLUMN uniform INTEGER DEFAULT 0,
ADD COLUMN ot_hours NUMERIC DEFAULT 0,
ADD COLUMN present_days INTEGER DEFAULT 0,
ADD COLUMN absent_days INTEGER DEFAULT 0,
ADD COLUMN late_days INTEGER DEFAULT 0;