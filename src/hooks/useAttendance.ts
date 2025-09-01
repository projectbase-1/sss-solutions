
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  branch_id?: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'on_leave';
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  created_at: string;
  employees?: {
    name: string;
    employee_id: string;
    branch_id?: string;
  };
}

export const useAttendance = (date?: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('attendance')
        .select(`
          *, 
          employees!inner(name, employee_id, branch_id)
        `)
        .order('date', { ascending: false });

      if (date) {
        query = query.eq('date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!user,
  });
};

export const useAttendanceStats = () => {
  const { user } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  return useQuery({
    queryKey: ['attendance-stats', currentMonth],
    queryFn: async () => {
      if (!user) return {
        present: 0,
        absent: 0,
        late: 0,
        on_leave: 0,
        total: 0,
        presentPercentage: 0,
      };
      
      // Get start and end of current month (LOCAL date, no timezone shift)
      const formatLocalDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };
      const startOfMonth = `${currentMonth}-01`;
      const endOfMonth = formatLocalDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`status`)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (error) throw error;

      const stats = {
        present: data.filter(record => record.status === 'present').length,
        absent: data.filter(record => record.status === 'absent').length,
        late: data.filter(record => record.status === 'late').length,
        on_leave: data.filter(record => record.status === 'on_leave').length,
        total: data.length,
        presentPercentage: data.length > 0 ? Math.round((data.filter(record => record.status === 'present').length / data.length) * 100) : 0,
      };

      return stats;
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes cache for attendance stats
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (attendance: Omit<AttendanceRecord, 'id' | 'created_at' | 'employees'>) => {
      if (!user) throw new Error('User not authenticated');
      
      // Get employee's current branch_id if not provided
      if (!attendance.branch_id) {
        const { data: employee } = await supabase
          .from('employees')
          .select('branch_id')
          .eq('id', attendance.employee_id)
          .single();
        
        if (employee?.branch_id) {
          attendance.branch_id = employee.branch_id;
        }
      }
      
      const { data, error } = await supabase
        .from('attendance')
        .insert([attendance])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-stats'] });
      toast({
        title: "Success!",
        description: "Attendance record created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating attendance:', error);
      toast({
        title: "Error",
        description: "Failed to create attendance record. Please try again.",
        variant: "destructive",
      });
    },
  });
};
