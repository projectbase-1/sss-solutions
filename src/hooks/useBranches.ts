
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Branch = Tables<'branches'> & {
  employee_count?: number;
  ot_rate?: number;
  driver_enabled?: boolean;
  driver_rate?: number;
};
export type BranchInsert = TablesInsert<'branches'>;
export type BranchUpdate = TablesUpdate<'branches'>;

export const useBranches = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      if (!user) return [];
      
      // Single optimized query with JOIN and aggregation
      const { data, error } = await supabase
        .from('branches')
        .select(`
          *,
          employees:employees!branch_id(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include employee count from aggregation
      const branchesWithCount = data.map((branch: any) => ({
        ...branch,
        employee_count: branch.employees?.[0]?.count || 0,
        employees: undefined // Remove the nested employees array
      }));
      
      return branchesWithCount as Branch[];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes cache for branches
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (branchData: Omit<BranchInsert, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('branches')
        .insert([{
          ...branchData,
          user_id: user.id
        }])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "Success!",
        description: "Branch created successfully.",
      });
    },
    onError: (error) => {
      console.error('Error creating branch:', error);
      toast({
        title: "Error",
        description: "Failed to create branch. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<BranchUpdate> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('branches')
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
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "Success!",
        description: "Branch updated successfully.",
      });
    },
    onError: (error) => {
      console.error('Error updating branch:', error);
      toast({
        title: "Error",
        description: "Failed to update branch. Please try again.",
        variant: "destructive",
      });
    },
  });
};
