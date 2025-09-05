import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Download, FileText, X, Search } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { useEmployees } from '@/hooks/useEmployees';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { usePayroll } from '@/hooks/usePayroll';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ExportDialog from '@/components/ExportDialog';
import SelectAllCheckbox from '@/components/SelectAllCheckbox';
import jsPDF from 'jspdf';
import { drawPayslipSection, PayslipData } from '@/lib/pdf/payslipLayout';
import { fetchAttendanceStats } from '@/lib/pdf/attendanceStats';

const CustomizedReports = () => {
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const { data: branches = [], isLoading: branchesLoading } = useBranches();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees(selectedBranch || undefined);

  // Reset employee selection and search when branch or payment type changes
  useEffect(() => {
    setSelectedEmployees([]);
    setSearchTerm('');
  }, [selectedBranch, selectedPaymentType]);

  // Filter employees based on search term and payment type
  const filteredEmployees = employees.filter(employee => {
    // First filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        employee.name?.toLowerCase().includes(searchLower) ||
        employee.employee_id?.toLowerCase().includes(searchLower) ||
        employee.position?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    
    // Then filter by payment type if selected
    if (selectedPaymentType && selectedPaymentType !== 'all') {
      return employee.mode_of_payment === selectedPaymentType;
    }
    
    return true;
  });

  const selectedEmployeesData = employees.filter(emp => selectedEmployees.includes(emp.id));

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const removeEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
  };

  const handleSelectAll = () => {
    const allSelected = filteredEmployees.length > 0 && 
      filteredEmployees.every(emp => selectedEmployees.includes(emp.id));
    
    if (allSelected) {
      // Deselect all filtered employees
      setSelectedEmployees(prev => 
        prev.filter(id => !filteredEmployees.some(emp => emp.id === id))
      );
    } else {
      // Select all filtered employees (add to existing selection)
      const newSelections = filteredEmployees
        .filter(emp => !selectedEmployees.includes(emp.id))
        .map(emp => emp.id);
      setSelectedEmployees(prev => [...prev, ...newSelections]);
    }
  };

  const handleExport = (month: string, format: 'excel' | 'pdf', branchId?: string) => {
    if (format === 'pdf') {
      generateEmployeesPDF(month, branchId);
    } else if (format === 'excel') {
      generateCustomizedExcel(month, branchId);
    }
  };

  const generateEmployeesPDF = async (exportMonth: string, filterBranchId?: string) => {
    // Use the employees filtered by selected branch and payment type
    let employeesToExport = selectedEmployeesData;
    
    // If branch filter is applied and it's different from current selected branch, filter employees
    if (filterBranchId && filterBranchId !== selectedBranch) {
      employeesToExport = selectedEmployeesData.filter(emp => emp.branch_id === filterBranchId);
    }
    
    // Apply payment type filter if selected
    if (selectedPaymentType && selectedPaymentType !== 'all') {
      employeesToExport = employeesToExport.filter(emp => emp.mode_of_payment === selectedPaymentType);
    }

    if (employeesToExport.length === 0) {
      const branchText = filterBranchId ? ' for selected branch' : '';
      const paymentText = selectedPaymentType && selectedPaymentType !== 'all' ? ` with ${selectedPaymentType.toLowerCase()} payment type` : '';
      toast({
        title: "Error",
        description: `Please select at least one employee${branchText}${paymentText} to generate report`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Fetch attendance stats for the selected month
      const attendanceStats = await fetchAttendanceStats(exportMonth);

      // Check if we have attendance data for the selected employees in the selected month
      const employeesWithData = employeesToExport.filter(employee => 
        attendanceStats[employee.id] && 
        (attendanceStats[employee.id].present_days > 0 || 
         attendanceStats[employee.id].absent_days > 0 || 
         attendanceStats[employee.id].late_days > 0 ||
         attendanceStats[employee.id].ot_hours > 0)
      );

      if (employeesWithData.length === 0) {
        const branchText = filterBranchId ? ' for selected branch' : '';
        const paymentText = selectedPaymentType && selectedPaymentType !== 'all' ? ` with ${selectedPaymentType.toLowerCase()} payment type` : '';
        toast({
          title: "No Data Found",
          description: `No attendance data found for selected employees${branchText}${paymentText} in ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
          variant: "destructive"
        });
        return;
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      let currentY = 15; // Start with top margin
      let employeesOnPage = 0;
      const maxEmployeesPerPage = 3;

      employeesWithData.forEach((employee, index) => {
        // Add new page if we've reached the limit
        if (employeesOnPage >= maxEmployeesPerPage) {
          doc.addPage();
          currentY = 15;
          employeesOnPage = 0;
        }

        const branch = branches.find(b => b.id === employee.branch_id);
        const stats = attendanceStats[employee.id];
        
        const payslipData: PayslipData = {
          employee: {
            id: employee.id,
            employee_id: employee.employee_id || '',
            name: employee.name || '',
            position: employee.position || '',
            join_date: employee.join_date || '',
            basic_salary: employee.basic_salary || 0,
            hra: employee.hra || 0,
            allowances: employee.allowances || 0,
            pf_number: employee.pf_number || '',
            esi_number: employee.esi_number || ''
          },
          branch: {
            name: branch?.name || 'N/A'
          },
          stats: {
            present_days: stats?.present_days || 0,
            absent_days: stats?.absent_days || 0,
            late_days: stats?.late_days || 0,
            ot_hours: stats?.ot_hours || 0
          },
          month: exportMonth
        };
        
        currentY = drawPayslipSection(doc, payslipData, currentY);
        employeesOnPage++;
      });

      // Get branch name for filename
      let branchName = '';
      if (filterBranchId) {
        const branch = branches.find(b => b.id === filterBranchId);
        branchName = branch ? `_${branch.name.replace(/\s+/g, '_')}` : '';
      }

      const paymentSuffix = selectedPaymentType && selectedPaymentType !== 'all' ? `_${selectedPaymentType}` : '';
      doc.save(`customized-employee-reports${branchName}${paymentSuffix}_${exportMonth}.pdf`);

      const branchText = filterBranchId ? ' for selected branch' : '';
      const paymentText = selectedPaymentType && selectedPaymentType !== 'all' ? ` with ${selectedPaymentType.toLowerCase()} payment type` : '';
      toast({
        title: "Success",
        description: `Employee report PDF${branchText}${paymentText} for ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} with ${employeesWithData.length} employee(s) downloaded successfully.`,
      });
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateCustomizedExcel = async (exportMonth: string, filterBranchId?: string) => {
    // Use the employees filtered by selected branch and payment type
    let employeesToExport = selectedEmployeesData;
    
    // If branch filter is applied and it's different from current selected branch, filter employees
    if (filterBranchId && filterBranchId !== selectedBranch) {
      employeesToExport = selectedEmployeesData.filter(emp => emp.branch_id === filterBranchId);
    }
    
    // Apply payment type filter if selected
    if (selectedPaymentType && selectedPaymentType !== 'all') {
      employeesToExport = employeesToExport.filter(emp => emp.mode_of_payment === selectedPaymentType);
    }

    if (employeesToExport.length === 0) {
      const branchText = filterBranchId ? ' for selected branch' : '';
      const paymentText = selectedPaymentType && selectedPaymentType !== 'all' ? ` with ${selectedPaymentType.toLowerCase()} payment type` : '';
      toast({
        title: "Error",
        description: `Please select at least one employee${branchText}${paymentText} to generate report`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Fetch payroll data for the selected month and employees
      const { data: payrollData, error } = await supabase
        .from('payroll')
        .select('*')
        .in('employee_id', employeesToExport.map(emp => emp.id))
        .eq('month', exportMonth);

      if (error) {
        console.error('Error fetching payroll data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch payroll data. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // Check if we have payroll data
      if (!payrollData || payrollData.length === 0) {
        toast({
          title: "No Data Found",
          description: `No payroll data found for selected employees in ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
          variant: "destructive"
        });
        return;
      }

      const XLSX = await import('xlsx');
      
      // Generate Excel data based on payment type
      let excelData;
      let fileName;
      
      if (selectedPaymentType === 'BANK') {
        // Bank payment format
        excelData = employeesToExport
          .filter(employee => payrollData.some(payroll => payroll.employee_id === employee.id))
          .map((employee, index) => {
            const payroll = payrollData.find(p => p.employee_id === employee.id);
            return {
              'Sl.No': index + 1,
              'EMP.NO': employee.employee_id || '',
              'ACCOUNT HOLDER NAME': employee.name || '',
              'AMOUNT': payroll?.take_home || payroll?.net_pay || 0,
              'ACCOUNT NO': employee.account_number || '',
              'IFSC CODE': employee.ifsc_code || '',
              'NAME OF THE BANK': employee.bank_name || ''
            };
          });
        
        const branchName = filterBranchId ? `_${branches.find(b => b.id === filterBranchId)?.name?.replace(/\s+/g, '_') || ''}` : '';
        fileName = `Bank_Payment_Report${branchName}_${exportMonth}.xlsx`;
      } else if (selectedPaymentType === 'CASH') {
        // Cash payment format
        excelData = employeesToExport
          .filter(employee => payrollData.some(payroll => payroll.employee_id === employee.id))
          .map((employee, index) => {
            const payroll = payrollData.find(p => p.employee_id === employee.id);
            return {
              'Sl.No': index + 1,
              'EMP.NO': employee.employee_id || '',
              'EMPLOYEE NAME': employee.name || '',
              'AMOUNT': payroll?.take_home || payroll?.net_pay || 0
            };
          });
        
        const branchName = filterBranchId ? `_${branches.find(b => b.id === filterBranchId)?.name?.replace(/\s+/g, '_') || ''}` : '';
        fileName = `Cash_Payment_Report${branchName}_${exportMonth}.xlsx`;
      } else {
        // Default format for mixed payment types
        excelData = employeesToExport
          .filter(employee => payrollData.some(payroll => payroll.employee_id === employee.id))
          .map((employee, index) => {
            const payroll = payrollData.find(p => p.employee_id === employee.id);
            return {
              'Sl.No': index + 1,
              'EMP.NO': employee.employee_id || '',
              'EMPLOYEE NAME': employee.name || '',
              'PAYMENT TYPE': employee.mode_of_payment || '',
              'AMOUNT': payroll?.take_home || payroll?.net_pay || 0,
              'ACCOUNT NO': employee.account_number || '',
              'IFSC CODE': employee.ifsc_code || '',
              'BANK NAME': employee.bank_name || ''
            };
          });
        
        const branchName = filterBranchId ? `_${branches.find(b => b.id === filterBranchId)?.name?.replace(/\s+/g, '_') || ''}` : '';
        fileName = `Customized_Payment_Report${branchName}_${exportMonth}.xlsx`;
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = Object.keys(excelData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      worksheet['!cols'] = colWidths;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Payment Report');
      
      // Download the Excel file
      XLSX.writeFile(workbook, fileName);

      const branchText = filterBranchId ? ' for selected branch' : '';
      const paymentText = selectedPaymentType && selectedPaymentType !== 'all' ? ` (${selectedPaymentType.toLowerCase()} payment type)` : '';
      toast({
        title: "Success",
        description: `Excel report${branchText}${paymentText} for ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} with ${excelData.length} employee(s) downloaded successfully.`,
      });
      
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate Excel file. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customized Reports</h1>
          <p className="text-muted-foreground">
            Select branch, payment type, and up to 3 employees to generate PDF reports
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Employee Report Generator
          </CardTitle>
          <CardDescription>
            Select a branch, payment type, and up to 3 employees to generate detailed PDF reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Branch Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Branch</label>
            <Select 
              value={selectedBranch} 
              onValueChange={setSelectedBranch}
              disabled={branchesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a branch" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Type</label>
            <Select 
              value={selectedPaymentType} 
              onValueChange={setSelectedPaymentType}
              disabled={!selectedBranch}
            >
              <SelectTrigger>
                <SelectValue placeholder="All payment types (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">All payment types</SelectItem>
                <SelectItem value="BANK">Bank Transaction</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
              </SelectContent>
            </Select>
            {selectedPaymentType && selectedPaymentType !== 'all' && (
              <p className="text-xs text-muted-foreground">
                Showing only employees with {selectedPaymentType.toLowerCase()} payment type
              </p>
            )}
          </div>

          {/* Employee Search */}
          {selectedBranch && employees.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Employees</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, employee ID, or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Select All and Employee Selection */}
          <div className="space-y-4">
            <label className="text-sm font-medium">
              Select Employees ({selectedEmployees.length})
              {(searchTerm || (selectedPaymentType && selectedPaymentType !== 'all')) && (
                <span className="text-muted-foreground ml-2">
                  - {filteredEmployees.length} result{filteredEmployees.length !== 1 ? 's' : ''} found
                  {selectedPaymentType && selectedPaymentType !== 'all' && ` (${selectedPaymentType.toLowerCase()} payment)`}
                </span>
              )}
            </label>
            
            {selectedBranch && employees.length > 0 ? (
              <div className="space-y-4">
                <SelectAllCheckbox
                  filteredEmployees={filteredEmployees}
                  selectedEmployees={selectedEmployees}
                  selectedPaymentType={selectedPaymentType}
                  branchFilter={selectedBranch}
                  onSelectAll={handleSelectAll}
                  onRemoveEmployee={removeEmployee}
                  selectedEmployeesData={selectedEmployeesData}
                />
                
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((employee) => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={employee.id}
                          checked={selectedEmployees.includes(employee.id)}
                          onCheckedChange={() => handleEmployeeToggle(employee.id)}
                        />
                        <label 
                          htmlFor={employee.id} 
                          className="text-sm cursor-pointer flex-1"
                        >
                          {employee.name} - {employee.employee_id} ({employee.position})
                          {employee.mode_of_payment && (
                            <span className="text-xs text-muted-foreground ml-2">
                              • {employee.mode_of_payment}
                            </span>
                          )}
                        </label>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                      {searchTerm && selectedPaymentType && selectedPaymentType !== 'all' 
                        ? `No employees found matching "${searchTerm}" with ${selectedPaymentType.toLowerCase()} payment type`
                        : searchTerm 
                          ? `No employees found matching "${searchTerm}"`
                          : selectedPaymentType && selectedPaymentType !== 'all'
                            ? `No employees found with ${selectedPaymentType.toLowerCase()} payment type`
                            : "No employees found"
                      }
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-3 border rounded-lg">
                {!selectedBranch 
                  ? "Select a branch first to view employees" 
                  : employeesLoading 
                    ? "Loading employees..." 
                    : "No employees found for this branch"
                }
              </div>
            )}
          </div>

          {/* Generate PDF Button */}
          <Button 
            onClick={() => setShowExportDialog(true)}
            disabled={selectedEmployees.length === 0}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Employee Report{selectedEmployees.length > 1 ? 's' : ''} PDF ({selectedEmployees.length})
          </Button>
        </CardContent>
      </Card>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        title="Export Employee Reports"
        description="Select a month to generate customized employee reports (PDF or Excel)"
        showBranchSelection={false}
      />
    </div>
  );
};

export default CustomizedReports;
