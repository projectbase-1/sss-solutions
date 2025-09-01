-- Add month field to payroll table
ALTER TABLE payroll ADD COLUMN month TEXT;

-- Add month field to attendance table  
ALTER TABLE attendance ADD COLUMN month TEXT;

-- Add month field to performance_reviews table
ALTER TABLE performance_reviews ADD COLUMN month TEXT;

-- Update existing records to set month based on pay_period_start/date
UPDATE payroll SET month = TO_CHAR(pay_period_start, 'YYYY-MM') WHERE month IS NULL;
UPDATE attendance SET month = TO_CHAR(date, 'YYYY-MM') WHERE month IS NULL;
UPDATE performance_reviews SET month = TO_CHAR(review_date, 'YYYY-MM') WHERE month IS NULL;