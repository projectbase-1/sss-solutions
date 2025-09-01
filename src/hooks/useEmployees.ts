import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string | null;
  position: string;
  department: string;
  location: string | null;
  join_date: string;
  status: string;
  avatar_url: string | null;
  basic_salary: number;
  hra: number;
  allowances: number;
  pf: number | null;
  advance: number | null;
  notes: string | null;
  pan_card: string | null;
  document_url: string | null;
  pf_number: string | null;
  fathers_name: string | null;
  date_of_birth: string | null;
  aadhar_card: string | null;
  esi_number: string | null;
  created_at: string;
  updated_at: string;
  branch_id?: string | null;
  user_id: string | null;
  // Bank Details
  account_number: string | null;
  bank_name: string | null;
  ifsc_code: string | null;
  branch_name: string | null;
  transfer_mode: string | null;
  // Salary Information
  gross_salary: number;
  basic_salary_percentage: number;
  da_percentage: number;
  da_amount: number;
  da_rate: number;
  day_rate: number;
  per_day_salary: number;
  conveyance: number;
  other_allowances: number;
  ot_amount: number;
  tea_allowance: number;
  rent_deduction: number;
  shoe_uniform_allowance: number;
  // Eligibility Master
  overtime_eligible: boolean;
  late_deduction_eligible: boolean;
  pf_eligible: boolean;
  esi_eligible: boolean;
  // Other Office Info
  shift_code: string | null;
  contract_name: string | null;
  mode_of_payment: string | null;
  row_number: number | null;
  is_driver: boolean;
  // Branch relationship
  branches?: {
    name: string;
    ot_rate?: number;
    departments?: any[];
  } | null;
}

export const useEmployees = (branchId?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['employees', branchId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('employees')
        .select(`
          *,
          branches (
            name,
            ot_rate
          )
        `)
        .order('employee_id', { ascending: true });
      
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Employee[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Creating employee with data:', employee);
      
      // Validate required fields
      if (!employee.employee_id || !employee.name || !employee.position || !employee.join_date) {
        throw new Error('Please fill in all required fields (Employee ID, Name, Position, Join Date)');
      }
      
      if (!employee.branch_id) {
        throw new Error('Please select a branch');
      }
      
      // Check for duplicate employee ID within the same branch (case-insensitive)
      const { data: existingEmployee } = await supabase
        .from('employees')
        .select('id, branch_id, name, branches(name)')
        .eq('branch_id', employee.branch_id)
        .ilike('employee_id', employee.employee_id.trim())
        .maybeSingle();
      
      if (existingEmployee) {
        const branchName = existingEmployee.branches?.name || 'this branch';
        throw new Error(`Employee ID "${employee.employee_id}" already exists for ${existingEmployee.name} in ${branchName}. Please use a different Employee ID.`);
      }
      
      const { data, error } = await supabase
        .from('employees')
        .insert([{
          ...employee,
          user_id: user.id,
          employee_id: employee.employee_id.trim(),
          name: employee.name.trim(),
          email: employee.email?.trim() || '',
          phone: employee.phone?.trim() || null,
          position: employee.position.trim(),
          department: employee.department || '',
          location: employee.location?.trim() || null,
          notes: employee.notes?.trim() || null,
          pan_card: employee.pan_card?.trim() || null,
          document_url: employee.document_url?.trim() || null,
          pf_number: employee.pf_number?.trim() || null,
          esi_number: employee.esi_number?.trim() || null,
          account_number: employee.account_number?.trim() || null,
          bank_name: employee.bank_name?.trim() || null,
          ifsc_code: employee.ifsc_code?.trim() || null,
          branch_name: employee.branch_name?.trim() || null,
          transfer_mode: employee.transfer_mode?.trim() || null,
          shift_code: employee.shift_code?.trim() || null,
          contract_name: employee.contract_name?.trim() || null,
          mode_of_payment: employee.mode_of_payment?.trim() || null,
          per_day_salary: employee.per_day_salary || 0,
          status: 'active',
          avatar_url: null
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating employee:', error);
        if (error.code === '23505') {
          throw new Error('Employee ID already exists in this branch. Please use a different Employee ID.');
        }
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Employee created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Success!",
        description: "Employee created successfully.",
      });
    },
    onError: (error: Error) => {
      console.error('Error creating employee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create employee. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, employee }: { id: string; employee: Partial<Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'user_id'>> }) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('Updating employee:', id, employee);
      const { data, error } = await supabase
        .from('employees')
        .update({
          ...employee,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }
      console.log('Employee updated:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast({
        title: "Success!",
        description: "Employee updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "Failed to update employee. Please try again.",
        variant: "destructive",
      });
    },
  });
};
