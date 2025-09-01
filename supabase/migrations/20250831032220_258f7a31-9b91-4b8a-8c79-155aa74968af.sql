
-- Remove session_timeout column from security_settings table
ALTER TABLE public.security_settings 
DROP COLUMN IF EXISTS session_timeout;

-- Remove session_timeout column from general_settings table  
ALTER TABLE public.general_settings 
DROP COLUMN IF EXISTS session_timeout;
