
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DynamicOTLabelProps {
  branchId?: string;
  className?: string;
}

const DynamicOTLabel: React.FC<DynamicOTLabelProps> = ({ branchId, className = "" }) => {
  const { data: branch } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      if (!branchId) return null;
      const { data, error } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!branchId
  });

  const isSpecialBranch = branch && ['UP-TN', 'UP-BAG'].includes(branch.name);
  const label = isSpecialBranch ? 'GWR' : 'OT HOURS';

  return <span className={className}>{label}</span>;
};

export default DynamicOTLabel;
