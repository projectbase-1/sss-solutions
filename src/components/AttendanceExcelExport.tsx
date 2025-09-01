
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import ExportDialog from './ExportDialog';

const AttendanceExcelExport: React.FC = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const { data: attendanceData = [] } = useQuery({
    queryKey: ['attendanceExport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (
            name,
            employee_id,
            pf_number,
            esi_number,
            per_day_salary,
            day_rate,
            basic_salary,
            da_amount,
            branch_id,
            rent_deduction,
            shoe_uniform_allowance,
            branches (name)
          )
        `);
      if (error) throw error;
      return data;
    }
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employeesForExport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const handleExport = (month: string, format: 'excel' | 'pdf', branchId?: string) => {
    if (format === 'excel') {
      exportToExcel(month, branchId);
    }
    setShowExportDialog(false);
  };

  const getEmployeePerDaySalary = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return 0;
    
    // Priority: per_day_salary -> day_rate -> calculated from basic + da
    if (employee.per_day_salary && employee.per_day_salary > 0) {
      return employee.per_day_salary;
    }
    
    if (employee.day_rate && employee.day_rate > 0) {
      return employee.day_rate;
    }
    
    // Fallback: calculate from basic_salary + da_amount
    const basicSalary = employee.basic_salary || 0;
    const daAmount = employee.da_amount || 0;
    return basicSalary + daAmount;
  };

  const exportToExcel = (exportMonth: string, branchId?: string) => {
    try {
      let filteredData = attendanceData;
      
      if (exportMonth) {
        filteredData = filteredData.filter(record => 
          record.month === exportMonth || 
          (record.date && record.date.startsWith(exportMonth))
        );
      }

      if (branchId) {
        filteredData = filteredData.filter(record => 
          record.employees?.branch_id === branchId
        );
      }

      // Get branch info for ESI calculation logic
      const selectedBranch = branches.find(b => b.id === branchId);
      const isSpecialESIBranch = selectedBranch && ['UP-TN', 'UP-BAG'].includes(selectedBranch.name);

      // Enhanced format with CORRECT Basic/DA calculations for ALL employees
      const excelData = filteredData.map((record, index) => {
        // Get per_day_salary using the improved logic for ALL employees
        const perDaySalary = getEmployeePerDaySalary(record.employee_id);
        
        console.log(`Employee ${record.employees?.name}: Per Day Salary = ${perDaySalary}`);
        
        // FIXED CALCULATION: Use the formula specified by user for ALL employees
        // basic salary = perday salary * 0.60
        // da salary = perday salary * 0.40
        const basicSalary = Math.round(perDaySalary * 0.60);
        const daSalary = Math.round(perDaySalary * 0.40);
        
        // Use present_days from attendance record as worked_days
        const workedDays = record.present_days || 0;
        const otHours = record.ot_hours || 0;
        
        // FIXED CALCULATION: Use the formula specified by user for ALL employees
        // basic salary earned = basic salary * worked days
        // da earned = da * worked days
        const basicEarned = Math.round(basicSalary * workedDays);
        const daEarned = Math.round(daSalary * workedDays);
        
        const extraHours = Math.round(otHours * 60);
        const grossEarnings = basicEarned + daEarned + extraHours;
        
        // PF calculation (12% of basic + DA earned, max 1800)
        const pfAmount = Math.min(Math.round((basicEarned + daEarned) * 0.12), 1800);
        
        // ESI calculation - branch specific logic
        let esiBaseAmount = basicEarned + daEarned;
        if (!isSpecialESIBranch) {
          esiBaseAmount += extraHours; // Include OT for non-special branches
        }
        const esiAmount = Math.round(esiBaseAmount * 0.0075);
        
        // Get rent_deduction and shoe_uniform_allowance from employee record
        const rentDeduction = Math.round(record.employees?.rent_deduction || 0);
        const advance = 0;
        const food = Math.round(record.food || 0);
        const shoeUniformAllowance = Math.round(record.employees?.shoe_uniform_allowance || 0);
        
        const totalDeduction = pfAmount + esiAmount + rentDeduction + advance + food - shoeUniformAllowance;
        const takeHome = grossEarnings - totalDeduction;

        return {
          'Sl. No': index + 1,
          'EMP. No': record.employees?.employee_id || '',
          'Name of the Employee': record.employees?.name || '',
          'PF.No': record.employees?.pf_number || '',
          'ESI.No': record.employees?.esi_number || '',
          'Worked Days': workedDays,
          'OT Hrs': otHours,
          'Per Day Salary': perDaySalary,
          'Basic': basicSalary, // This is 60% of per day salary for ALL employees
          'DA': daSalary, // This is 40% of per day salary for ALL employees
          'Basic Earned': basicEarned, // Basic * worked days for ALL employees
          'DA Earned': daEarned, // DA * worked days for ALL employees
          'Extra Hours': extraHours,
          'Gross Earnings': grossEarnings,
          'PF 12%': pfAmount,
          'ESI 0.75%': esiAmount,
          'Rent': rentDeduction,
          'Advance': advance,
          'Food': food,
          'Shoe & Uniform': shoeUniformAllowance,
          'Take Home': takeHome,
          'Month': record.month || exportMonth,
          'Status': record.status || 'present',
          'Date': record.date,
          'Branch': record.employees?.branches?.name || 'N/A'
        };
      });

      if (excelData.length === 0) {
        toast({
          title: "No Data",
          description: "No attendance records found for the selected month.",
          variant: "destructive"
        });
        return;
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths for better readability
      const colWidths = [
        { wch: 5 },   // Sl No
        { wch: 10 },  // Emp No
        { wch: 25 },  // Name
        { wch: 15 },  // PF No
        { wch: 15 },  // ESI No
        { wch: 12 },  // Worked Days
        { wch: 10 },  // OT Hours
        { wch: 15 },  // Per Day Salary
        { wch: 12 },  // Basic (60% of per day)
        { wch: 10 },  // DA (40% of per day)
        { wch: 12 },  // Basic Earned
        { wch: 10 },  // DA Earned
        { wch: 12 },  // Extra Hours
        { wch: 15 },  // Gross Earnings
        { wch: 10 },  // PF
        { wch: 10 },  // ESI
        { wch: 10 },  // Rent
        { wch: 10 },  // Advance
        { wch: 10 },  // Food
        { wch: 15 },  // Shoe & Uniform
        { wch: 15 },  // Take Home
        { wch: 12 },  // Month
        { wch: 10 },  // Status
        { wch: 12 },  // Date
        { wch: 15 }   // Branch
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

      let title = `ATTENDANCE REPORT FOR THE MONTH OF ${exportMonth?.toUpperCase() || 'ALL MONTHS'}`;
      if (isSpecialESIBranch) {
        title += ` (${selectedBranch?.name} - ESI: Basic + DA only)`;
      }
      
      XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: 'A1' });
      
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }];

      const dataRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = dataRange.e.r; R >= 1; --R) {
        for (let C = dataRange.s.c; C <= dataRange.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
          const new_cell_address = XLSX.utils.encode_cell({ r: R + 2, c: C });
          if (ws[cell_address]) {
            ws[new_cell_address] = ws[cell_address];
            delete ws[cell_address];
          }
        }
      }

      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: dataRange.e.r + 2, c: dataRange.e.c }
      });

      const branchSuffix = selectedBranch ? `_${selectedBranch.name}` : '';
      const fileName = `Attendance_Report_All_Employees_Fixed${branchSuffix}_${exportMonth || 'All_Months'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Export Successful",
        description: `Attendance report exported successfully for ALL EMPLOYEES with FIXED calculations: Basic = Per Day × 60%, DA = Per Day × 40%`,
      });

    } catch (error) {
      console.error('Error exporting attendance to Excel:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export attendance report. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button 
        onClick={() => setShowExportDialog(true)}
        variant="outline" 
        className="bg-green-600 text-white hover:bg-green-700"
      >
        <Download className="h-4 w-4 mr-2" />
        Export Attendance Report
      </Button>
      
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        title="Export Attendance Report"
        description="Select month and format to export attendance report with FIXED salary calculations for ALL EMPLOYEES (Basic = 60% × Per Day, DA = 40% × Per Day)"
      />
    </>
  );
};

export default AttendanceExcelExport;
