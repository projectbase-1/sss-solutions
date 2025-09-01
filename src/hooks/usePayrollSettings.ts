import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PayrollSettings {
  id: string;
  income_tax_rate: number;
  pf_rate: number;
  esi_rate: number;
  pay_frequency: string;
  monthly_pay_date: number;
  overtime_rate: number;
  created_at: string;
  updated_at: string;
}

export const usePayrollSettings = () => {
  return useQuery({
    queryKey: ['payroll-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_settings')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data as PayrollSettings | null;
    },
  });
};

export const useCreatePayrollSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Omit<PayrollSettings, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('payroll_settings')
        .insert([{
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-settings'] });
      toast({
        title: "Success!",
        description: "Payroll settings created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating payroll settings:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll settings. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePayrollSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (settings: Partial<PayrollSettings> & { id?: string }) => {
      if (!settings.id) {
        throw new Error('Settings ID is required for update');
      }
      
      const { data, error } = await supabase
        .from('payroll_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-settings'] });
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
      toast({
        title: "Success!",
        description: "Payroll settings updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating payroll settings:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll settings. Please try again.",
        variant: "destructive",
      });
    },
  });
};