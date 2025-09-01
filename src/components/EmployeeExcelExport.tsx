
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useToast } from '@/hooks/use-toast';
import ExportDialog from './ExportDialog';

const EmployeeExcelExport = () => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { data: allEmployees = [] } = useEmployees();
  const { data: branches = [] } = useBranches();
  const { toast } = useToast();

  const handleExport = async (month: string, format: 'excel' | 'pdf', branchId?: string) => {
    if (format === 'excel') {
      await exportToExcel(month, branchId);
    }
  };

  const exportToExcel = async (exportMonth: string, branchId?: string) => {
    try {
      console.log('Starting Employee Excel export for month:', exportMonth);
      
      // Filter employees by branch if selected
      let filteredEmployees = allEmployees;
      if (branchId && branchId !== 'all') {
        filteredEmployees = allEmployees.filter(employee => employee.branch_id === branchId);
      }

      if (filteredEmployees.length === 0) {
        const branchText = branchId && branchId !== 'all' ? ' for selected branch' : '';
        toast({
          title: "No Data Found",
          description: `No employee data found${branchText}.`,
          variant: "destructive",
        });
        return;
      }

      // Get branch name for filename
      let branchName = '';
      if (branchId && branchId !== 'all') {
        const branch = branches.find(b => b.id === branchId);
        branchName = branch ? `_${branch.name.replace(/\s+/g, '_')}` : '';
      }

      // Sort employees by employee ID
      filteredEmployees.sort((a, b) => {
        const aEmployeeId = a.employee_id || '';
        const bEmployeeId = b.employee_id || '';
        return aEmployeeId.localeCompare(bEmployeeId, undefined, { numeric: true });
      });

      // Generate Excel file using xlsx library
      const XLSX = await import('xlsx');
      
      // Create Excel-compatible data structure with corrected salary calculations
      const excelData = filteredEmployees.map((employee, index) => {
        const branchInfo = employee.branches || {};
        let perDaySalary = employee.per_day_salary || 0;
        const basicSalary = employee.basic_salary || 0;
        
        // If per_day_salary is 0 but basic_salary exists, reverse-calculate
        if (perDaySalary === 0 && basicSalary > 0) {
          perDaySalary = Math.round(basicSalary / 0.6);
        }
        
        // Calculate Basic (60% of per day salary) and DA (40% of per day salary)
        const basicPerDay = Math.round(perDaySalary * 0.60);
        const daPerDay = Math.round(perDaySalary * 0.40);
        
        return {
          'Sl No': index + 1,
          'Employee ID': employee.employee_id || '',
          'Full Name': employee.name || '',
          "Father's Name": employee.fathers_name || '',
          'Phone': employee.phone || '',
          'Designation': employee.position || '',
          'Branch': (branchInfo as any)?.name || '',
          'Location': employee.location || '',
          'Date of Birth': employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : '',
          'Join Date': employee.join_date ? new Date(employee.join_date).toLocaleDateString() : '',
          'Aadhar Card Number': employee.aadhar_card || '',
          'A/C No': employee.account_number || '',
          'Bank Name': employee.bank_name || '',
          'IFSC Code': employee.ifsc_code || '',
          'Branch Name': employee.branch_name || '',
          'Transfer Mode': employee.transfer_mode || '',
          'Per Day Salary': perDaySalary,
          'Basic Salary (60% of Per Day)': basicPerDay,
          'DA Amount (40% of Per Day)': daPerDay,
          'Gross Salary': Number(employee.gross_salary || 0),
          'Basic Salary %': Number(employee.basic_salary_percentage || 0),
          'D.A %': Number(employee.da_percentage || 0),
          'D.A Rate': Number(employee.da_rate || 0),
          'Day Rate': Number(employee.day_rate || 0),
          'HRA': Number(employee.hra || 0),
          'Conveyance': Number(employee.conveyance || 0),
          'Rent Deduction': Number(employee.rent_deduction || 0),
          'Shoe & Uniform Allowance': Number(employee.shoe_uniform_allowance || 0),
          'PF (Provident Fund)': Number(employee.pf || 0),
          'Advance': Number(employee.advance || 0),
          'PF No.': employee.pf_number || '',
          'Mode of Payment': employee.mode_of_payment || '',
          'Department': employee.department || '',
          'Status': employee.status || 'active',
          'ESI Number': employee.esi_number || '',
          'Contract Name': employee.contract_name || '',
          'Shift Code': employee.shift_code || '',
          'PAN Card': employee.pan_card || '',
          'Other Allowances': Number(employee.other_allowances || 0),
          'OT Amount': Number(employee.ot_amount || 0),
          'Tea Allowance': Number(employee.tea_allowance || 0),
          'Overtime Eligible': employee.overtime_eligible ? 'Yes' : 'No',
          'Late Deduction Eligible': employee.late_deduction_eligible ? 'Yes' : 'No',
          'PF Eligible': employee.pf_eligible ? 'Yes' : 'No',
          'ESI Eligible': employee.esi_eligible ? 'Yes' : 'No',
          'Notes': employee.notes || ''
        };
      });

      console.log('Excel data prepared, creating workbook...');
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee Export');
      
      // Create filename with month and branch info
      const monthName = new Date(exportMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
      const fileName = `Employee_Export_Corrected_Salary${branchName}_${monthName.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download the Excel file
      XLSX.writeFile(workbook, fileName);

      const branchText = branchId && branchId !== 'all' ? ' for selected branch' : '';
      toast({
        title: "Excel Export Successful",
        description: `Employee data with corrected Basic (60%) and DA (40%) calculations${branchText} for ${monthName} has been exported to Excel.`,
      });
      
      console.log('Employee Excel export completed successfully');
    } catch (error) {
      console.error('Error generating Employee Excel file:', error);
      toast({
        title: "Export Failed",
        description: `Failed to generate Excel file: ${error.message || 'Unknown error'}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button onClick={() => setShowExportDialog(true)} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        Export
      </Button>
      
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        title="Export Employee Data"
        description="Select branch and month to export employee data with corrected Basic (60%) and DA (40%) calculations"
        showBranchSelection={true}
      />
    </>
  );
};

export default EmployeeExcelExport;
