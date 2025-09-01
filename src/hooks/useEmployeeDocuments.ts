
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface EmployeeDocument {
  id: string;
  employee_id: string;
  document_name: string;
  document_type: string | null;
  file_url: string;
  uploaded_at: string | null;
  created_at: string | null;
}

export const useEmployeeDocuments = (employeeId: string) => {
  const queryClient = useQueryClient();

  const fetchDocuments = async (): Promise<EmployeeDocument[]> => {
    if (!employeeId) return [];
    
    console.log('Fetching documents for employee:', employeeId);
    
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', employeeId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    console.log('Documents fetched:', data);
    return data || [];
  };

  const query = useQuery({
    queryKey: ['employee-documents', employeeId],
    queryFn: fetchDocuments,
    enabled: !!employeeId,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    gcTime: 0,
    staleTime: 0,
  });

  const refreshDocuments = () => {
    queryClient.invalidateQueries({
      queryKey: ['employee-documents', employeeId]
    });
  };

  return {
    ...query,
    refreshDocuments
  };
};
