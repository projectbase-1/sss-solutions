
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface EnhancedGenerateReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnhancedGenerateReportsDialog: React.FC<EnhancedGenerateReportsDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [reportType, setReportType] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const { toast } = useToast();

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('branches').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: payrollData = [] } = useQuery({
    queryKey: ['payrollData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            name,
            employee_id,
            pf_number,
            esi_number,
            per_day_salary,
            branch_id,
            branches (name)
          )
        `);
      if (error) throw error;
      return data;
    },
  });

  const generateReport = () => {
    if (!reportType || !selectedMonth) {
      toast({
        title: "Missing Information",
        description: "Please select both report type and month.",
        variant: "destructive",
      });
      return;
    }

    let filteredData = payrollData.filter(record => {
      const monthMatch = record.month === selectedMonth;
      const branchMatch = selectedBranch === 'all' || record.employees?.branch_id === selectedBranch;
      return monthMatch && branchMatch;
    });

    if (filteredData.length === 0) {
      toast({
        title: "No Data Found",
        description: "No records found for the selected criteria.",
        variant: "destructive",
      });
      return;
    }

    if (reportType === 'pf') {
      generatePFReport(filteredData);
    } else if (reportType === 'esi') {
      generateESIReport(filteredData);
    }

    onOpenChange(false);
  };

  const generatePFReport = (data: any[]) => {
    try {
      const branch = branches.find(b => b.id === selectedBranch);
      const branchName = selectedBranch === 'all' ? 'All Branches' : branch?.name || 'Unknown Branch';

      const pfData = data.map((record, index) => {
        const perDaySalary = record.employees?.per_day_salary || 0;
        const workedDays = record.worked_days || 0;
        
        // Calculate Basic (60% of per day salary) and DA (40% of per day salary)
        const basicPerDay = Math.round(perDaySalary * 0.60);
        const daPerDay = Math.round(perDaySalary * 0.40);
        const basicEarned = Math.round(basicPerDay * workedDays);
        const daEarned = Math.round(daPerDay * workedDays);
        
        // PF calculation (12% of basic + DA earned, max 1800)
        const pfAmount = Math.min(Math.round((basicEarned + daEarned) * 0.12), 1800);
        const epsAmount = Math.round(pfAmount * 0.833); // EPS = 83.3% of PF (max 1250)
        const epfAmount = pfAmount - epsAmount; // EPF = remaining amount

        return {
          'S.No': index + 1,
          'Employee Code': record.employees?.employee_id || '',
          'Employee Name': record.employees?.name || '',
          'PF Number': record.employees?.pf_number || '',
          'Gross Wages': basicEarned,
          'E.P.S': Math.min(epsAmount, 1250), // Swapped: EPS in EPF column position
          'E.P.F': epfAmount, // Swapped: EPF in EPS column position
          'Total PF': pfAmount,
          'Month': selectedMonth,
          'Branch': branchName
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(pfData);

      // Set column widths
      ws['!cols'] = [
        { wch: 8 },  // S.No
        { wch: 15 }, // Employee Code
        { wch: 25 }, // Employee Name
        { wch: 15 }, // PF Number
        { wch: 12 }, // Gross Wages
        { wch: 10 }, // E.P.S (was E.P.F)
        { wch: 10 }, // E.P.F (was E.P.S)
        { wch: 10 }, // Total PF
        { wch: 12 }, // Month
        { wch: 20 }  // Branch
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'PF Report');

      const fileName = `PF_Report_${branchName.replace(/\s+/g, '_')}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "PF Report Generated",
        description: `PF report exported as ${fileName}`,
      });
    } catch (error) {
      console.error('Error generating PF report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PF report.",
        variant: "destructive",
      });
    }
  };

  const generateESIReport = (data: any[]) => {
    try {
      const branch = branches.find(b => b.id === selectedBranch);
      const branchName = selectedBranch === 'all' ? 'All Branches' : branch?.name || 'Unknown Branch';
      const isSpecialESIBranch = branch && ['UP-TN', 'UP-BAG'].includes(branch.name);

      const esiData = data.map((record, index) => {
        const perDaySalary = record.employees?.per_day_salary || 0;
        const workedDays = record.worked_days || 0;
        const otHours = record.ot_hours || 0;
        
        // Calculate Basic (60% of per day salary) and DA (40% of per day salary)
        const basicPerDay = Math.round(perDaySalary * 0.60);
        const daPerDay = Math.round(perDaySalary * 0.40);
        const basicEarned = Math.round(basicPerDay * workedDays);
        const daEarned = Math.round(daPerDay * workedDays);
        const otAmount = Math.round(otHours * 60);

        // ESI calculation - branch specific logic
        let esiWages = basicEarned + daEarned;
        if (!isSpecialESIBranch) {
          esiWages += otAmount; // Include OT for non-special branches
        }
        
        const esiAmount = Math.round(esiWages * 0.0075);

        return {
          'S.No': index + 1,
          'Employee Code': record.employees?.employee_id || '',
          'Employee Name': record.employees?.name || '',
          'ESI Number': record.employees?.esi_number || '',
          'Basic Salary': basicEarned,
          'DA': daEarned,
          'OT Amount': isSpecialESIBranch ? 0 : otAmount, // Show 0 for special branches
          'ESI Wages': esiWages,
          'ESI Amount (0.75%)': esiAmount,
          'Month': selectedMonth,
          'Branch': branchName,
          'ESI Calculation': isSpecialESIBranch ? 'Basic + DA' : 'Basic + DA + OT'
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(esiData);

      // Set column widths
      ws['!cols'] = [
        { wch: 8 },  // S.No
        { wch: 15 }, // Employee Code
        { wch: 25 }, // Employee Name
        { wch: 15 }, // ESI Number
        { wch: 12 }, // Basic Salary
        { wch: 10 }, // DA
        { wch: 12 }, // OT Amount
        { wch: 12 }, // ESI Wages
        { wch: 15 }, // ESI Amount
        { wch: 12 }, // Month
        { wch: 20 }, // Branch
        { wch: 20 }  // ESI Calculation
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'ESI Report');

      const fileName = `ESI_Report_${branchName.replace(/\s+/g, '_')}_${selectedMonth}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "ESI Report Generated",
        description: `ESI report exported as ${fileName} ${isSpecialESIBranch ? '(Special ESI calculation applied)' : ''}`,
      });
    } catch (error) {
      console.error('Error generating ESI report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate ESI report.",
        variant: "destructive",
      });
    }
  };

  const months = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Enhanced Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="reportType">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pf">PF Report (EPF/EPS Corrected)</SelectItem>
                <SelectItem value="esi">ESI Report (Branch-Specific)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="month">Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('default', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="branch">Branch</Label>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={generateReport}>
              Generate Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedGenerateReportsDialog;
