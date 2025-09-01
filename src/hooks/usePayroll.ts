
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PayrollRecord {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  month?: string;
  basic_salary: number;
  da_amount?: number | null;
  basic_plus_da?: number | null;
  day_salary?: number | null;
  hra: number;
  allowances: number;
  ot_hours?: number | null;
  ot_rate?: number | null;
  ot_amount?: number;
  extra_hours_pay?: number | null;
  deductions: number;
  gross_pay: number;
  net_pay: number;
  status: 'draft' | 'processed' | 'paid';
  processed_at?: string;
  pf_number?: string | null;
  esi_number?: string | null;
  worked_days?: number | null;
  man_days_details?: any;
  salary_components?: any;
  gross_earnings?: number | null;
  pf_12_percent?: number | null;
  esi_0_75_percent?: number | null;
  food?: number | null;
  uniform?: number | null;
  lunch?: number | null;
  rent_deduction?: number | null;
  shoe_uniform_allowance?: number | null;
  take_home?: number | null;
  created_at: string;
  updated_at: string;
  employees?: {
    name: string;
    employee_id: string;
    pf_number?: string | null;
    esi_number?: string | null;
    branch_id?: string | null;
    da_rate?: number | null;
    day_rate?: number | null;
    rent_deduction?: number | null;
    shoe_uniform_allowance?: number | null;
  };
}

export const usePayroll = () => {
  return useQuery({
    queryKey: ['payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select('*, employees(name, employee_id, pf_number, esi_number, branch_id)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PayrollRecord[];
    },
  });
};

export const usePayrollStats = () => {
  return useQuery({
    queryKey: ['payroll-stats'],
    queryFn: async () => {
      console.log('Fetching payroll stats...');
      const { data, error } = await supabase
        .from('payroll')
        .select('net_pay, status');
      
      if (error) {
        console.error('Error fetching payroll stats:', error);
        throw error;
      }

      const stats = {
        totalPayroll: data.reduce((sum, record) => sum + (record.net_pay || 0), 0),
        processedCount: data.filter(record => record.status === 'processed' || record.status === 'paid').length,
        pendingCount: data.filter(record => record.status === 'draft').length,
        totalEmployees: data.length,
      };

      console.log('Payroll stats:', stats);
      return stats;
    },
  });
};

export const useCreatePayroll = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (payrollData: Omit<PayrollRecord, 'id' | 'created_at' | 'updated_at' | 'employees'>) => {
      const { data, error } = await supabase
        .from('payroll')
        .insert([payrollData])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
      toast({
        title: "Success!",
        description: "Payroll record created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to create payroll record. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePayroll = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<PayrollRecord> }) => {
      const { data, error } = await supabase
        .from('payroll')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
      toast({
        title: "Success!",
        description: "Payroll record updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating payroll:', error);
      toast({
        title: "Error",
        description: "Failed to update payroll record. Please try again.",
        variant: "destructive",
      });
    },
  });
};
