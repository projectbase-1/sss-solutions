import React, { useState } from 'react';
import { Calendar, Clock, Users, UserCheck, Download, Plus, FileText, Settings, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MetricCard from '@/components/MetricCard';
import MonthSelector from '@/components/MonthSelector';
import ExportDialog from '@/components/ExportDialog';
import { useAttendance, useAttendanceStats } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAllEmployeesAttendanceStats, useEmployeeAttendanceStats } from '@/hooks/useEmployeeAttendance';
import jsPDF from 'jspdf';
import { drawPayslipSection, PayslipData, verifyPDFPageSize, A4_DIMENSIONS } from '@/lib/pdf/payslipLayout';
import { fetchAttendanceStats } from '@/lib/pdf/attendanceStats';
import { useQueryClient } from '@tanstack/react-query';

const Attendance = () => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [branchFilter, setBranchFilter] = useState('all');
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAllowanceDialog, setShowAllowanceDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [allowanceForm, setAllowanceForm] = useState({
    food: 0,
    deduction: 0
  });
  const [editForm, setEditForm] = useState({
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    ot_hours: 0,
    food: 0,
    uniform: 0
  });
  const [attendanceForm, setAttendanceForm] = useState({
    branch_id: 'all',
    employee_id: '',
    present_days: 0,
    absent_days: 0,
    late_days: 0,
    ot_hours: 0,
    food: 0,
    uniform: 0,
    notes: ''
  });

  const {
    data: attendanceStats,
    refetch: refetchStats
  } = useAttendanceStats();
  const {
    data: employees = []
  } = useEmployees();
  const {
    data: branches = []
  } = useBranches();
  const {
    data: allEmployeesStats = {},
    refetch: refetchAllEmployeesStats
  } = useAllEmployeesAttendanceStats(selectedMonth);
  const {
    toast
  } = useToast();

  // Get selected employee's attendance stats for the dialog
  const selectedEmployeeStats = useEmployeeAttendanceStats(attendanceForm.employee_id, selectedMonth);

  // Filter employees by branch for the dialog
  const dialogFilteredEmployees = employees.filter(employee => {
    if (attendanceForm.branch_id === 'all') return true;
    return employee.branch_id === attendanceForm.branch_id;
  });

  // Filter employees by branch for the total attendance view
  const filteredEmployees = employees.filter(employee => {
    if (branchFilter === 'all') return true;
    return employee.branch_id === branchFilter;
  });

  // Calculate dynamic totals based on filtered employees and their stats for selected month
  const calculateTotals = () => {
    const filteredStats = filteredEmployees.reduce((acc, employee) => {
      const stats = allEmployeesStats[employee.id];
      if (stats) {
        acc.presentDays += stats.present_days || 0;
        acc.absentDays += stats.absent_days || 0;
        acc.lateDays += stats.late_days || 0;
        acc.otHours += stats.ot_hours || 0;
        acc.food += stats.food || 0;
        acc.uniform += stats.uniform || 0;
      }
      return acc;
    }, {
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      otHours: 0,
      food: 0,
      uniform: 0
    });

    return {
      totalEmployees: filteredEmployees.length,
      totalManDays: filteredStats.presentDays,
      ...filteredStats
    };
  };

  const totals = calculateTotals();

  const handleAllowance = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    const stats = allEmployeesStats[employeeId];
    setSelectedEmployeeId(employeeId);
    setAllowanceForm({
      food: stats?.food || 0,
      deduction: 0 // Default value since it's not in the stats type
    });
    setShowAllowanceDialog(true);
  };

  const handleEdit = (employeeId: string) => {
    const stats = allEmployeesStats[employeeId];
    setSelectedEmployeeId(employeeId);
    setEditForm({
      present_days: stats?.present_days || 0,
      absent_days: stats?.absent_days || 0,
      late_days: stats?.late_days || 0,
      ot_hours: stats?.ot_hours || 0,
      food: stats?.food || 0,
      uniform: stats?.uniform || 0
    });
    setShowEditDialog(true);
  };

  const handleMarkAttendance = async () => {
    const selectedEmployee = employees.find(emp => emp.id === attendanceForm.employee_id);
    try {
      console.log('=== MARKING ATTENDANCE START ===');
      console.log('Selected employee:', selectedEmployee?.name);
      console.log('Form data:', attendanceForm);
      console.log('Selected month:', selectedMonth);

      // First, check if record exists
      const { data: existingRecord } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', attendanceForm.employee_id)
        .eq('date', today)
        .single();

      console.log('=== EXISTING RECORD ===');
      console.log('Found existing record:', existingRecord);

      // Convert form values to proper types
      const presentDays = Number(attendanceForm.present_days) || 0;
      const absentDays = Number(attendanceForm.absent_days) || 0;
      const lateDays = Number(attendanceForm.late_days) || 0;
      const otHours = Number(attendanceForm.ot_hours) || 0;
      const food = Number(attendanceForm.food) || 0;
      const uniform = Number(attendanceForm.uniform) || 0;

      console.log('=== CONVERTED VALUES ===');
      console.log('Present days:', presentDays);
      console.log('Absent days:', absentDays);
      console.log('Late days:', lateDays);
      console.log('OT hours:', otHours);
      console.log('Food:', food);
      console.log('Uniform:', uniform);

      // Create the record with all required fields
      const attendanceRecord = {
        employee_id: attendanceForm.employee_id,
        date: today,
        status: 'present',
        present_days: presentDays,
        absent_days: absentDays,
        late_days: lateDays,
        ot_hours: otHours,
        food: food,
        uniform: uniform,
        deduction: 0,
        month: selectedMonth,
        branch_id: null,
        check_in_time: null,
        check_out_time: null,
        notes: JSON.stringify({
          present_days: presentDays,
          absent_days: absentDays,
          late_days: lateDays,
          ot_hours: otHours,
          food: food,
          uniform: uniform,
          custom_notes: attendanceForm.notes || '',
          updated_at: new Date().toISOString(),
          month: selectedMonth
        })
      };

      console.log('=== FINAL RECORD TO UPSERT ===');
      console.log('Record:', attendanceRecord);

      // Use a more explicit approach - delete then insert if exists
      if (existingRecord) {
        console.log('=== DELETING EXISTING RECORD ===');
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('employee_id', attendanceForm.employee_id)
          .eq('date', today);

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw deleteError;
        }
      }

      // Now insert the new record
      console.log('=== INSERTING NEW RECORD ===');
      const { data, error } = await supabase
        .from('attendance')
        .insert([attendanceRecord])
        .select('*');

      if (error) {
        console.error('=== SUPABASE INSERT ERROR ===');
        console.error('Error details:', error);
        throw error;
      }

      console.log('=== SUCCESS ===');
      console.log('Successfully inserted attendance:', data);

      // Verify the data was stored correctly
      const { data: verifyData, error: verifyError } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', attendanceForm.employee_id)
        .eq('date', today)
        .single();

      if (!verifyError && verifyData) {
        console.log('=== VERIFICATION ===');
        console.log('Data stored in database:', verifyData);
        console.log('Present days stored:', verifyData.present_days);
        console.log('Absent days stored:', verifyData.absent_days);
        console.log('OT hours stored:', verifyData.ot_hours);
        console.log('Food stored:', verifyData.food);
        console.log('Uniform stored:', verifyData.uniform);
      }

      toast({
        title: "Attendance Updated Successfully",
        description: `${selectedEmployee?.name}'s attendance stats have been updated: Present: ${attendanceRecord.present_days}, Absent: ${attendanceRecord.absent_days}, OT: ${attendanceRecord.ot_hours}h`,
      });

      // Reset form
      setShowMarkAttendance(false);
      setAttendanceForm({
        branch_id: 'all',
        employee_id: '',
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        ot_hours: 0,
        food: 0,
        uniform: 0,
        notes: ''
      });

      // Force immediate refresh of ALL data using query invalidation
      console.log('=== INVALIDATING QUERIES ===');
      await queryClient.invalidateQueries({ 
        queryKey: ['attendance-stats'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['all-employees-attendance-stats'] 
      });
      await queryClient.invalidateQueries({ 
        queryKey: ['employee-attendance-stats'] 
      });
      
      // Also refetch the current queries to ensure immediate UI update
      await Promise.all([
        refetchStats(),
        refetchAllEmployeesStats()
      ]);
      
      // Force a second refresh after a short delay to ensure UI updates
      setTimeout(async () => {
        console.log('=== SECONDARY REFRESH ===');
        await refetchAllEmployeesStats();
      }, 1000);
      
    } catch (error) {
      console.error('=== ATTENDANCE UPDATE ERROR ===');
      console.error('Error details:', error);
      toast({
        title: "Error Updating Attendance",
        description: `Failed to update ${selectedEmployee?.name}'s attendance. Error: ${error?.message || 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const handleUpdateEdit = async () => {
    try {
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);
      console.log('=== UPDATING EDIT START ===');
      console.log('Selected employee:', selectedEmployee?.name);
      console.log('Edit form data:', editForm);

      // Store values directly in database columns with proper data types
      const attendanceRecord = {
        employee_id: selectedEmployeeId,
        date: today,
        status: 'present',
        // Store numeric values directly in columns
        present_days: Number(editForm.present_days) || 0,
        absent_days: Number(editForm.absent_days) || 0,
        late_days: Number(editForm.late_days) || 0,
        ot_hours: Number(editForm.ot_hours) || 0,
        food: Number(editForm.food) || 0,
        uniform: Number(editForm.uniform) || 0,
        deduction: 0,
        month: selectedMonth,
        // Store in notes as backup
        notes: JSON.stringify({
          present_days: Number(editForm.present_days) || 0,
          absent_days: Number(editForm.absent_days) || 0,
          late_days: Number(editForm.late_days) || 0,
          ot_hours: Number(editForm.ot_hours) || 0,
          food: Number(editForm.food) || 0,
          uniform: Number(editForm.uniform) || 0,
          month: selectedMonth,
          updated_at: new Date().toISOString()
        })
      };

      console.log('Upserting edit record:', attendanceRecord);

      const { data, error } = await supabase
        .from('attendance')
        .upsert([attendanceRecord], {
          onConflict: 'employee_id,date',
          ignoreDuplicates: false
        })
        .select('*');

      if (error) {
        console.error('Supabase edit error:', error);
        throw error;
      }

      console.log('Successfully updated attendance (edit):', data);

      toast({
        title: "Attendance Updated",
        description: `${selectedEmployee?.name}'s attendance has been updated successfully.`
      });

      setShowEditDialog(false);
      setEditForm({
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        ot_hours: 0,
        food: 0,
        uniform: 0
      });
      setSelectedEmployeeId('');
      
      // Force immediate refresh
      await Promise.all([
        refetchStats(),
        refetchAllEmployeesStats()
      ]);
      
      setTimeout(async () => {
        await refetchAllEmployeesStats();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating attendance (edit):', error);
      toast({
        title: "Error",
        description: `Failed to update attendance: ${error.message || 'Unknown error'}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleUpdateAllowance = async () => {
    try {
      const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

      // Use upsert to either insert or update the attendance record
      const { data, error } = await supabase
        .from('attendance')
        .upsert([{
          employee_id: selectedEmployeeId,
          date: today,
          status: 'present',
          food: allowanceForm.food,
          deduction: allowanceForm.deduction,
          month: selectedMonth
        }], {
          onConflict: 'employee_id,date'
        });

      if (error) throw error;

      toast({
        title: "Allowance Updated",
        description: `${selectedEmployee?.name}'s allowance has been updated successfully.`
      });

      setShowAllowanceDialog(false);
      setAllowanceForm({ food: 0, deduction: 0 });
      setSelectedEmployeeId('');
      
      // Force immediate refresh
      setTimeout(async () => {
        await refetchAllEmployeesStats();
      }, 100);
    } catch (error) {
      console.error('Error updating allowance:', error);
      toast({
        title: "Error",
        description: "Failed to update allowance. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExport = (month: string, format: 'excel' | 'pdf', branchId?: string) => {
    if (format === 'excel') {
      handleExcelExport(month, branchId);
    } else {
      handlePDFExport(month, branchId);
    }
  };

  const handleExcelExport = (exportMonth: string, branchId?: string) => {
    // Filter employees by branch if specified
    let employeesToExport = employees;
    if (branchId && branchId !== 'all') {
      employeesToExport = employees.filter(employee => employee.branch_id === branchId);
    }

    // Check if we have attendance data for the selected month and branch
    const employeesWithData = employeesToExport.filter(employee => allEmployeesStats[employee.id]);

    if (employeesWithData.length === 0) {
      const branchText = branchId ? ' for selected branch' : '';
      toast({
        title: "No Data Found",
        description: `No attendance data found${branchText} for ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        variant: "destructive"
      });
      return;
    }

    // Get branch name for filename
    let branchName = '';
    if (branchId) {
      const branch = branches.find(b => b.id === branchId);
      branchName = branch ? `_${branch.name.replace(/\s+/g, '_')}` : '';
    }

    // Create Excel-compatible data structure with CORRECTED basic salary calculation
    const excelData = employeesWithData.map((employee, index) => {
      const stats = allEmployeesStats[employee.id];
      const branch = branches.find(b => b.id === employee.branch_id);
      const presentDays = stats?.present_days || 0;
      
      // FIXED: Use the actual basic_salary from employee record directly
      // This is the value that was set in the Add Employee form
      const actualBasicSalary = employee.basic_salary || 0;
      const actualDAAmount = employee.da_amount || 0;
      
      // For per-day calculation, if per_day_salary exists, use it
      // Otherwise calculate from basic_salary (assuming it's already per-day)
      const perDaySalary = employee.per_day_salary || actualBasicSalary;
      
      // Calculate earned amounts using the actual basic salary value
      const earnedBasic = Math.round(actualBasicSalary * presentDays);
      const earnedDA = Math.round(actualDAAmount * presentDays);
      
      // Use driver rate if employee is a driver, otherwise use OT rate
      const employee_obj = employees.find(emp => emp.id === employee.id);
      const rate = employee_obj?.is_driver ? (branch?.driver_rate || 60) : (branch?.ot_rate || 60);
      const otAmount = Math.round((stats?.ot_hours || 0) * rate);
      const grossEarnings = earnedBasic + earnedDA + otAmount;
      
      // Calculate deductions with ESI rule
      const pfAmount = Math.min(Math.round((earnedBasic + earnedDA + otAmount) * 0.12), 1800);
      const esiAmount = grossEarnings > 21000 ? 0 : Math.round(grossEarnings * 0.0075);
      const totalDeductions = pfAmount + esiAmount + (stats?.food || 0) + (stats?.uniform || 0);
      const takeHome = grossEarnings - totalDeductions;
      
      return {
        'Sl. No': index + 1,
        'EMP. No': employee.employee_id || '',
        'Name of the Employee': employee.name || '',
        'PF.No': employee.pf_number || '',
        'ESI.No': employee.esi_number || '',
        'Worked Days': presentDays,
        'OT Hrs': (stats?.ot_hours || 0).toFixed(1),
        'Per Day Salary': perDaySalary,
        'Basic': actualBasicSalary, // This now shows the actual basic salary from Add Employee form
        'DA': actualDAAmount, // This shows the actual DA amount from Add Employee form
        'Basic (Earned)': earnedBasic,
        'DA (Earned)': earnedDA,
        'Extra Hours': otAmount,
        'Gross Earnings': grossEarnings,
        'PF 12%': pfAmount,
        'ESI 0.75 %': esiAmount,
        'Rent': employee.rent_deduction || 0,
        'Advance': employee.advance || 0,
        'Food': stats?.food || 0,
        'Shoe & Uniform': employee.shoe_uniform_allowance || 0,
        'Total Deduction': totalDeductions,
        'Take Home': takeHome
      };
    });

    // Convert to CSV format for Excel compatibility
    const headers = Object.keys(excelData[0] || {});
    const csvContent = [
      headers.join(','),
      ...excelData.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-excel${branchName}_${exportMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const branchText = branchId ? ' for selected branch' : '';
    toast({
      title: "Excel Export Successful",
      description: `Attendance data${branchText} for ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} has been exported with corrected Basic and DA values from employee records.`
    });
  };

  const handlePDFExport = async (exportMonth: string, branchId?: string) => {
    // Filter employees by branch if specified
    let employeesToExport = employees;
    if (branchId && branchId !== 'all') {
      employeesToExport = employees.filter(employee => employee.branch_id === branchId);
    }
    try {
      // Fetch attendance stats for the selected month
      const attendanceStats = await fetchAttendanceStats(exportMonth);
      const employeesWithData = employeesToExport.filter(employee => attendanceStats[employee.id] && (attendanceStats[employee.id].present_days > 0 || attendanceStats[employee.id].absent_days > 0 || attendanceStats[employee.id].late_days > 0 || attendanceStats[employee.id].ot_hours > 0));
      if (employeesWithData.length === 0) {
        const branchText = branchId ? ' for selected branch' : '';
        toast({
          title: "No Data Found",
          description: `No attendance data found${branchText} for ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
          variant: "destructive"
        });
        return;
      }

      // Create PDF with explicit A4 dimensions (297mm × 210mm in landscape)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210] // Explicit A4 dimensions in landscape (width, height)
      });

      // Verify PDF page size immediately after creation
      const verification = verifyPDFPageSize(doc);
      console.log('PDF Creation Verification:', verification);
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
      if (branchId) {
        const branch = branches.find(b => b.id === branchId);
        branchName = branch ? `_${branch.name.replace(/\s+/g, '_')}` : '';
      }

      // Final verification before saving
      const finalVerification = verifyPDFPageSize(doc);
      console.log('Final PDF Verification before save:', finalVerification);
      doc.save(`attendance-payslip${branchName}_${exportMonth}.pdf`);
      const branchText = branchId ? ' for selected branch' : '';
      toast({
        title: "PDF Export Successful",
        description: `A4 format payslip PDF${branchText} for ${new Date(exportMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} has been downloaded successfully.`
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
        <div className="flex space-x-4">
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Dialog open={showMarkAttendance} onOpenChange={setShowMarkAttendance}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Mark Attendance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Select 
                    value={attendanceForm.branch_id} 
                    onValueChange={(value) => {
                      setAttendanceForm({ 
                        ...attendanceForm, 
                        branch_id: value,
                        employee_id: '' // Reset employee when branch changes
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
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

                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select value={attendanceForm.employee_id} onValueChange={(value) => setAttendanceForm({ ...attendanceForm, employee_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {dialogFilteredEmployees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employee_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {attendanceForm.employee_id && selectedEmployeeStats.data && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Current Month Stats:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span>Present: {selectedEmployeeStats.data.present_days}</span>
                      <span>Absent: {selectedEmployeeStats.data.absent_days}</span>
                      <span>Late: {selectedEmployeeStats.data.late_days}</span>
                      <span>OT Hours: {selectedEmployeeStats.data.ot_hours}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="presentDays">Present Days</Label>
                    <Input 
                      id="presentDays"
                      type="number" 
                      value={attendanceForm.present_days} 
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, present_days: parseInt(e.target.value) || 0 })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="absentDays">Absent Days</Label>
                    <Input 
                      id="absentDays"
                      type="number" 
                      value={attendanceForm.absent_days} 
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, absent_days: parseInt(e.target.value) || 0 })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="lateDays">Late Days</Label>
                    <Input 
                      id="lateDays"
                      type="number" 
                      value={attendanceForm.late_days} 
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, late_days: parseInt(e.target.value) || 0 })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="otHours">{
                      attendanceForm.employee_id && employees.find(emp => emp.id === attendanceForm.employee_id)?.is_driver 
                        ? 'Driver OT Hours' 
                        : 'OT Hours'
                    }</Label>
                    <Input 
                      id="otHours"
                      type="number" 
                      step="0.5" 
                      value={attendanceForm.ot_hours} 
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, ot_hours: parseFloat(e.target.value) || 0 })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="food">Food</Label>
                    <Input 
                      id="food"
                      type="number" 
                      value={attendanceForm.food} 
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, food: parseInt(e.target.value) || 0 })} 
                      placeholder="0" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="uniform">Uniform</Label>
                    <Input 
                      id="uniform"
                      type="number" 
                      value={attendanceForm.uniform} 
                      onChange={(e) => setAttendanceForm({ ...attendanceForm, uniform: parseInt(e.target.value) || 0 })} 
                      placeholder="0" 
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea 
                    id="notes"
                    value={attendanceForm.notes} 
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} 
                    placeholder="Additional notes..." 
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowMarkAttendance(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleMarkAttendance} disabled={!attendanceForm.employee_id}>
                    Mark Attendance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Monthly Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Present"
          value={attendanceStats?.present || 0}
          icon={UserCheck}
          color="green"
        />
        <MetricCard
          title="Late"
          value={attendanceStats?.late || 0}
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Absent"
          value={attendanceStats?.absent || 0}
          icon={Users}
          color="red"
        />
        <MetricCard
          title="On Leave"
          value={attendanceStats?.on_leave || 0}
          icon={Calendar}
          color="blue"
        />
      </div>

      {/* Employee Attendance Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle>Employee Attendance Summary</CardTitle>
            <MonthSelector 
              selectedMonth={selectedMonth} 
              onMonthChange={setSelectedMonth} 
            />
          </div>
          <div className="flex items-center space-x-2">
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by branch" />
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-green-100">
                  <th className="border border-gray-300 p-2 text-left font-semibold">Total</th>
                  <th className="border border-gray-300 p-2 text-left font-semibold">Employee</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Present Days</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Absent Days</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Late Days</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">{
                    filteredEmployees.some(emp => emp.is_driver) ? 'OT/Driver Hours' : 'OT Hours'
                  }</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Food</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Uniform</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Actions</th>
                </tr>
                <tr className="bg-blue-50">
                  <td className="border border-gray-300 p-2 font-semibold">
                    Total Employees: {totals.totalEmployees}
                  </td>
                  <td className="border border-gray-300 p-2 font-semibold">
                    Total Man Days: {totals.totalManDays}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {totals.presentDays}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {totals.absentDays}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {totals.lateDays}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    {totals.otHours.toFixed(1)}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    ₹{totals.food}
                  </td>
                  <td className="border border-gray-300 p-2 text-center font-semibold">
                    ₹{totals.uniform}
                  </td>
                  <td className="border border-gray-300 p-2"></td>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const stats = allEmployeesStats[employee.id];
                  const branch = branches.find(b => b.id === employee.branch_id);
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2"></td>
                      <td className="border border-gray-300 p-2">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">
                            {employee.employee_id} • {branch?.name || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {stats?.present_days || 0}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {stats?.absent_days || 0}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {stats?.late_days || 0}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {stats?.ot_hours?.toFixed(1) || '0.0'}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          ₹{stats?.food || 0}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          ₹{stats?.uniform || 0}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <div className="flex justify-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(employee.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAllowance(employee.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        title="Export Attendance Data"
        description="Choose the month, format, and branch for your attendance report."
      />

      {/* Allowance Dialog */}
      <Dialog open={showAllowanceDialog} onOpenChange={setShowAllowanceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Allowance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="allowanceFood">Food Allowance</Label>
              <Input 
                id="allowanceFood"
                type="number" 
                value={allowanceForm.food} 
                onChange={(e) => setAllowanceForm({ ...allowanceForm, food: parseInt(e.target.value) || 0 })} 
                placeholder="0" 
              />
            </div>
            <div>
              <Label htmlFor="allowanceDeduction">Deduction</Label>
              <Input 
                id="allowanceDeduction"
                type="number" 
                value={allowanceForm.deduction} 
                onChange={(e) => setAllowanceForm({ ...allowanceForm, deduction: parseInt(e.target.value) || 0 })} 
                placeholder="0" 
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAllowanceDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAllowance}>
                Update Allowance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPresentDays">Present Days</Label>
                <Input 
                  id="editPresentDays"
                  type="number" 
                  value={editForm.present_days} 
                  onChange={(e) => setEditForm({ ...editForm, present_days: parseInt(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
              <div>
                <Label htmlFor="editAbsentDays">Absent Days</Label>
                <Input 
                  id="editAbsentDays"
                  type="number" 
                  value={editForm.absent_days} 
                  onChange={(e) => setEditForm({ ...editForm, absent_days: parseInt(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
              <div>
                <Label htmlFor="editLateDays">Late Days</Label>
                <Input 
                  id="editLateDays"
                  type="number" 
                  value={editForm.late_days} 
                  onChange={(e) => setEditForm({ ...editForm, late_days: parseInt(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
              <div>
                <Label htmlFor="editOtHours">{
                  selectedEmployeeId && employees.find(emp => emp.id === selectedEmployeeId)?.is_driver 
                    ? 'Driver OT Hours' 
                    : 'OT Hours'
                }</Label>
                <Input 
                  id="editOtHours"
                  type="number" 
                  step="0.5" 
                  value={editForm.ot_hours} 
                  onChange={(e) => setEditForm({ ...editForm, ot_hours: parseFloat(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
              <div>
                <Label htmlFor="editFood">Food</Label>
                <Input 
                  id="editFood"
                  type="number" 
                  value={editForm.food} 
                  onChange={(e) => setEditForm({ ...editForm, food: parseInt(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
              <div>
                <Label htmlFor="editUniform">Uniform</Label>
                <Input 
                  id="editUniform"
                  type="number" 
                  value={editForm.uniform} 
                  onChange={(e) => setEditForm({ ...editForm, uniform: parseInt(e.target.value) || 0 })} 
                  placeholder="0" 
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateEdit}>
                Update Attendance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Attendance;
