-- Create payroll_settings table
CREATE TABLE public.payroll_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  income_tax_rate NUMERIC NOT NULL DEFAULT 5.0,
  pf_rate NUMERIC NOT NULL DEFAULT 12.0,
  esi_rate NUMERIC NOT NULL DEFAULT 1.75,
  pay_frequency TEXT NOT NULL DEFAULT 'monthly',
  monthly_pay_date INTEGER NOT NULL DEFAULT 30,
  overtime_rate NUMERIC NOT NULL DEFAULT 1.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on payroll_settings" 
ON public.payroll_settings 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Insert default settings
INSERT INTO public.payroll_settings (income_tax_rate, pf_rate, esi_rate, pay_frequency, monthly_pay_date, overtime_rate)
VALUES (5.0, 12.0, 1.75, 'monthly', 30, 1.5);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_payroll_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_payroll_settings_updated_at
  BEFORE UPDATE ON public.payroll_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payroll_settings_updated_at();