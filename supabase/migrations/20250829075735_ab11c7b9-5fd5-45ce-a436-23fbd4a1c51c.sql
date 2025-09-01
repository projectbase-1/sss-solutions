-- Remove existing global unique constraints properly
ALTER TABLE employees DROP CONSTRAINT IF EXISTS unique_pf_number_employees;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS unique_esi_number_employees;  
ALTER TABLE employees DROP CONSTRAINT IF EXISTS unique_pan_card;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_employee_id_key;

-- Create new partial unique constraints that are branch-specific and handle nulls/errors properly

-- PF Number: unique within branch, excluding nulls and "Error" values
CREATE UNIQUE INDEX unique_pf_number_per_branch 
ON employees (branch_id, pf_number) 
WHERE pf_number IS NOT NULL 
  AND pf_number != '' 
  AND LOWER(pf_number) != 'error';

-- ESI Number: unique within branch, excluding nulls and "Error" values  
CREATE UNIQUE INDEX unique_esi_number_per_branch 
ON employees (branch_id, esi_number) 
WHERE esi_number IS NOT NULL 
  AND esi_number != '' 
  AND LOWER(esi_number) != 'error';

-- PAN Card (Aadhar): unique within branch, excluding nulls and "Error" values
CREATE UNIQUE INDEX unique_pan_card_per_branch 
ON employees (branch_id, pan_card) 
WHERE pan_card IS NOT NULL 
  AND pan_card != '' 
  AND LOWER(pan_card) != 'error';

-- Employee ID: unique within branch only (allows same employee in different branches)
CREATE UNIQUE INDEX unique_employee_id_per_branch 
ON employees (branch_id, employee_id) 
WHERE employee_id IS NOT NULL 
  AND employee_id != '';

-- Email: keep global uniqueness but exclude nulls and empty strings
CREATE UNIQUE INDEX unique_email_employees 
ON employees (email) 
WHERE email IS NOT NULL 
  AND email != '';