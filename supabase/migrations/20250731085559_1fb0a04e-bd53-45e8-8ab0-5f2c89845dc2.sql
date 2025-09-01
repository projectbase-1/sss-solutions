-- Fix function search path security issue
ALTER FUNCTION public.update_payroll_settings_updated_at() SET search_path = '';