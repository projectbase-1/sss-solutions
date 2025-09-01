
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { useToast } from '@/hooks/use-toast';
import { Download, Calendar, FileText } from 'lucide-react';
import MonthSelector from './MonthSelector';

interface GenerateReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GenerateReportsDialog: React.FC<GenerateReportsDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [reportType, setReportType] = useState<'pf' | 'esi'>('pf');

  const { data: employees = [] } = useEmployees();
  const { data: branches = [] } = useBranches();
  const { data: attendanceStats = {} } = useAllEmployeesAttendanceStats(selectedMonth);
  const { toast } = useToast();

  const generatePFReport = () => {
    // Filter employees with attendance data for the selected month
    const employeesWithData = employees.filter(emp => {
      const stats = attendanceStats[emp.id];
      return stats && (stats.present_days > 0 || stats.ot_hours > 0);
    });

    if (employeesWithData.length === 0) {
      toast({
        title: "No Data Found",
        description: `No employee data found for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        variant: "destructive"
      });
      return;
    }

    // Create PF report data with calculations
    const pfData = employeesWithData.map((employee, index) => {
      const stats = attendanceStats[employee.id];
      const presentDays = stats?.present_days || 0;
      const otHours = stats?.ot_hours || 0;
      const basicSalary = employee.basic_salary || 0;
      const daAmount = employee.da_amount || 0;
      
      // Calculate earned amounts based on present days
      const earnedBasic = Math.round(basicSalary * presentDays);
      const earnedDA = Math.round(daAmount * presentDays);
      const otAmount = Math.round(otHours * 60); // ₹60 per hour
      
      // PF calculation: Basic + DA + OT = Gross Salary
      const pfBasic = earnedBasic + earnedDA + otAmount;
      const emp12Amount = Math.min(Math.round(pfBasic * 0.12), 1800);
      const employerEPF = Math.round(pfBasic * 0.0833); // 8.33% EPF
      const employerEPS = Math.round(pfBasic * 0.0367); // 3.67% EPS

      return {
        'Emp.No': employee.employee_id || '',
        'Employee Name': employee.name || '',
        'PF NO': employee.pf_number || '',
        'Days Present': presentDays,
        'Basic+DA': pfBasic,
        'PF.Basic': pfBasic,
        'Emp.12 Amt': emp12Amount,
        'E.P.F': employerEPF,
        'E.P.S': employerEPS,
        'Total Employer': employerEPF + employerEPS
      };
    });

    // Convert to CSV
    const headers = Object.keys(pfData[0] || {});
    const csvContent = [
      headers.join(','),
      ...pfData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Download file with selected month
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pf_report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "PF Report Generated",
      description: `PF report for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })} has been downloaded successfully.`
    });

    onOpenChange(false);
  };

  const generateESIReport = () => {
    // Filter employees with attendance data for the selected month
    const employeesWithData = employees.filter(emp => {
      const stats = attendanceStats[emp.id];
      return stats && (stats.present_days > 0 || stats.ot_hours > 0);
    });

    if (employeesWithData.length === 0) {
      toast({
        title: "No Data Found",
        description: `No employee data found for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        variant: "destructive"
      });
      return;
    }

    // Create ESI report data with calculations
    const esiData = employeesWithData.map((employee, index) => {
      const stats = attendanceStats[employee.id];
      const presentDays = stats?.present_days || 0;
      const otHours = stats?.ot_hours || 0;
      const basicSalary = employee.basic_salary || 0;
      const daAmount = employee.da_amount || 0;
      
      // Calculate earned amounts based on present days
      const earnedBasic = Math.round(basicSalary * presentDays);
      const earnedDA = Math.round(daAmount * presentDays);
      const otAmount = Math.round(otHours * 60); // ₹60 per hour
      
      // Gross earnings calculation
      const grossEarnings = earnedBasic + earnedDA + otAmount;
      
      // ESI calculation: 0 if gross > ₹21,000, otherwise 0.75%
      const employeeESI = grossEarnings > 21000 ? 0 : Math.round(grossEarnings * 0.0075);
      const employerESI = grossEarnings > 21000 ? 0 : Math.round(grossEarnings * 0.0325);

      return {
        'Emp.No': employee.employee_id || '',
        'Employee Name': employee.name || '',
        'ESI NO': employee.esi_number || '',
        'Days Present': presentDays,
        'Gross Earnings': grossEarnings,
        'Employee ESI (0.75%)': employeeESI,
        'Employer ESI (3.25%)': employerESI,
        'Total ESI': employeeESI + employerESI
      };
    });

    // Convert to CSV
    const headers = Object.keys(esiData[0] || {});
    const csvContent = [
      headers.join(','),
      ...esiData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Download file with selected month
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `esi_report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "ESI Report Generated", 
      description: `ESI report for ${new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })} has been downloaded successfully.`
    });

    onOpenChange(false);
  };

  const handleExportExcel = () => {
    if (!selectedMonth) {
      toast({
        title: "Month Required",
        description: "Please select a month to generate the report.",
        variant: "destructive"
      });
      return;
    }

    if (reportType === 'pf') {
      generatePFReport();
    } else {
      generateESIReport();
    }
  };

  const handleExportPDF = () => {
    if (!selectedMonth) {
      toast({
        title: "Month Required",
        description: "Please select a month to generate the report.",
        variant: "destructive"
      });
      return;
    }

    // For now, use the same logic as Excel export but could be customized for PDF
    if (reportType === 'pf') {
      generatePFReport();
    } else {
      generateESIReport();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Reports</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="month" className="text-sm font-medium mb-2 block">Select Month</Label>
              <MonthSelector
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />
            </div>
            
            <div className="flex-1">
              <Label htmlFor="reportType" className="text-sm font-medium mb-2 block">Select Report Type</Label>
              <Select value={reportType} onValueChange={(value: 'pf' | 'esi') => setReportType(value)}>
                <SelectTrigger>
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="pf">PF Reports</SelectItem>
                  <SelectItem value="esi">ESI Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleExportExcel}
              disabled={!selectedMonth}
              className="flex-1"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!selectedMonth}
              className="flex-1 bg-gray-500 hover:bg-gray-600"
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

export default GenerateReportsDialog;
