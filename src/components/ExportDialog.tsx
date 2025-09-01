
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Building2, Download } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import MonthSelector from './MonthSelector';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (month: string, format: 'excel' | 'pdf', branchId?: string) => void;
  title: string;
  description: string;
  showBranchSelection?: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  onExport,
  title,
  description,
  showBranchSelection = true
}) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const { data: branches = [] } = useBranches();

  const handleExport = (format: 'excel' | 'pdf') => {
    if (!selectedMonth) return;
    
    const branchId = selectedBranch === 'all' ? undefined : selectedBranch;
    onExport(selectedMonth, format, branchId);
    onOpenChange(false);
    setSelectedMonth('');
    setSelectedBranch('all');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Month</label>
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </div>

            {showBranchSelection && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select Branch</label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger>
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches
                      .filter(branch => branch.id && branch.id.trim() !== '')
                      .map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name || 'Unnamed Branch'}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => handleExport('excel')}
              disabled={!selectedMonth}
              className="flex-1"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={!selectedMonth}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
