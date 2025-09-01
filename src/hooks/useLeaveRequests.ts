import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'casual' | 'vacation' | 'personal' | 'maternity';
  start_date: string;
  end_date: string;
  days_count: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  employees?: {
    name: string;
    employee_id: string;
  };
}

export const useLeaveRequests = () => {
  return useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*, employees!leave_requests_employee_id_fkey(name, employee_id)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeaveRequest[];
    },
  });
};

export const useLeaveStats = () => {
  return useQuery({
    queryKey: ['leave-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('leave_type, status, days_count');
      
      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(req => req.status === 'pending').length,
        approved: data.filter(req => req.status === 'approved').length,
        rejected: data.filter(req => req.status === 'rejected').length,
        annual: data.filter(req => req.leave_type === 'annual').length,
        sick: data.filter(req => req.leave_type === 'sick').length,
        casual: data.filter(req => req.leave_type === 'casual').length,
      };

      console.log('Leave stats:', stats);
      return stats;
    },
  });
};

export const useCreateLeaveRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (leaveRequest: Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'employees'>) => {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert([leaveRequest])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-stats'] });
      toast({
        title: "Success!",
        description: "Leave request submitted successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating leave request:', error);
      toast({
        title: "Error",
        description: "Failed to submit leave request. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateLeaveStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, status, approved_by }: { id: string; status: 'approved' | 'rejected'; approved_by?: string }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        if (approved_by) {
          updateData.approved_by = approved_by;
        }
      }
      
      const { data, error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-stats'] });
      toast({
        title: "Success!",
        description: `Leave request ${variables.status} successfully.`,
      });
    },
    onError: (error) => {
      console.error('Error updating leave request:', error);
      toast({
        title: "Error",
        description: "Failed to update leave request. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateLeaveRequest = useUpdateLeaveStatus;
