import React, { useState } from 'react';
import { DollarSign, Download, FileText, Calculator, Settings, Users, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import MetricCard from '@/components/MetricCard';
import { usePayrollStats, useCreatePayroll } from '@/hooks/usePayroll';
import { usePayrollSettings, useUpdatePayrollSettings } from '@/hooks/usePayrollSettings';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import EnhancedPayrollTable from '@/components/EnhancedPayrollTable';
import GenerateReportsDialog from '@/components/GenerateReportsDialog';

const Payroll = () => {
  const { data: payrollStats } = usePayrollStats();
  const { data: employees = [] } = useEmployees();
  const { data: branches = [] } = useBranches();
  const { data: payrollSettings } = usePayrollSettings();
  const updatePayrollSettings = useUpdatePayrollSettings();
  const createPayroll = useCreatePayroll();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGenerateReports, setShowGenerateReports] = useState(false);

  const handleExportAll = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee ID,Employee Name,Basic Salary,HRA,Allowances,Gross Pay,Deductions,Net Pay\n"
      + employees.map(employee => {
        const grossPay = employee.gross_salary || 0; // Use monthly gross salary
        const deductions = Math.round(grossPay * 0.1875);
        const netPay = grossPay - deductions;
        return `${employee.employee_id},${employee.name},${employee.basic_salary},${employee.hra},${employee.allowances},${grossPay},${deductions},${netPay}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "payroll_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Payroll data has been exported to CSV file.",
    });
  };

  const generateReports = () => {
    // Create a comprehensive payroll report
    const reportData = employees.map(employee => {
      const grossPay = employee.gross_salary || 0; // Use monthly gross salary
      const pfDeduction = Math.min(Math.round(grossPay * 0.12), 1800);
      const esiDeduction = Math.round(grossPay * 0.0175);
      const taxDeduction = Math.round(grossPay * 0.05);
      const totalDeductions = pfDeduction + esiDeduction + taxDeduction;
      const netPay = grossPay - totalDeductions;

      return {
        employee_id: employee.employee_id,
        name: employee.name,
        
        basic_salary: employee.basic_salary,
        hra: employee.hra,
        allowances: employee.allowances,
        gross_pay: grossPay,
        pf_deduction: pfDeduction,
        esi_deduction: esiDeduction,
        tax_deduction: taxDeduction,
        total_deductions: totalDeductions,
        net_pay: netPay
      };
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee ID,Name,Basic Salary,HRA,Allowances,Gross Pay,PF Deduction,ESI Deduction,Tax Deduction,Total Deductions,Net Pay\n"
      + reportData.map(row => 
        `${row.employee_id},${row.name},${row.basic_salary},${row.hra},${row.allowances},${row.gross_pay},${row.pf_deduction},${row.esi_deduction},${row.tax_deduction},${row.total_deductions},${row.net_pay}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Report Generated",
      description: "Comprehensive payroll report has been generated and downloaded.",
    });
  };

  const calculateTax = () => {
    // Calculate tax breakdown for all employees
    const taxCalculations = employees.map(employee => {
      const annualSalary = employee.basic_salary * 12;
      const taxableIncome = annualSalary - 250000; // Standard deduction
      let incomeTax = 0;

      if (taxableIncome > 0) {
        if (taxableIncome <= 250000) {
          incomeTax = 0;
        } else if (taxableIncome <= 500000) {
          incomeTax = (taxableIncome - 250000) * 0.05;
        } else if (taxableIncome <= 1000000) {
          incomeTax = 12500 + (taxableIncome - 500000) * 0.20;
        } else {
          incomeTax = 112500 + (taxableIncome - 1000000) * 0.30;
        }
      }

      return {
        employee_id: employee.employee_id,
        name: employee.name,
        annual_salary: annualSalary,
        taxable_income: Math.max(0, taxableIncome),
        annual_tax: incomeTax,
        monthly_tax: Math.round(incomeTax / 12)
      };
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee ID,Name,Annual Salary,Taxable Income,Annual Tax,Monthly Tax\n"
      + taxCalculations.map(row => 
        `${row.employee_id},${row.name},${row.annual_salary},${row.taxable_income},${row.annual_tax},${row.monthly_tax}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tax-calculations-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Tax Calculations Complete",
      description: "Tax calculations have been completed and downloaded.",
    });
  };

  const openPayrollSettings = () => {
    toast({
      title: "Payroll Settings",
      description: "Switch to the Payroll Settings tab to configure tax rates and schedules.",
    });
    // Auto-switch to settings tab
    const settingsTab = document.querySelector('[data-value="settings"]') as HTMLElement;
    if (settingsTab) {
      settingsTab.click();
    }
  };

  const processPayrollForAllEmployees = async () => {
    if (employees.length === 0) {
      toast({
        title: "No Employees",
        description: "No employees found to process payroll for.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    console.log('Starting payroll processing for', employees.length, 'employees');
    
    try {
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let successCount = 0;
      let errorCount = 0;

          // Process payroll for each employee
          for (const employee of employees) {
            try {
              console.log('Processing payroll for employee:', employee.name);
              
              const basicSalary = Number(employee.basic_salary) || 0; // Basic salary amount
              const hra = Number(employee.hra) || 0;
              const allowances = Number(employee.allowances) || 0;
              const grossSalary = Number(employee.gross_salary) || 0; // Monthly gross salary
              
              // Get OT hours from attendance for this employee
              const { data: attendanceData } = await supabase
                .from('attendance')
                .select('notes')
                .eq('employee_id', employee.id)
                .gte('date', startOfMonth.toISOString().split('T')[0])
                .lte('date', endOfMonth.toISOString().split('T')[0]);
              
              let totalOtHours = 0;
              attendanceData?.forEach(record => {
                try {
                  if (record.notes) {
                    const parsedNotes = JSON.parse(record.notes);
                    totalOtHours += parsedNotes.ot_hours || 0;
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              });
              
              const otAmount = totalOtHours * 60; // ₹60 per hour
              const grossPay = grossSalary + otAmount; // Use monthly gross salary
          
          // Calculate deductions using dynamic settings
          const pfRate = (payrollSettings?.pf_rate || 12) / 100;
          const esiRate = (payrollSettings?.esi_rate || 1.75) / 100;
          const taxRate = (payrollSettings?.income_tax_rate || 5) / 100;
          
          const pfDeduction = Math.round(grossSalary * pfRate);
          const esiDeduction = Math.round(grossSalary * esiRate);
          const taxDeduction = Math.round(grossSalary * taxRate);
          const totalDeductions = pfDeduction + esiDeduction + taxDeduction;
          
          const netPay = grossPay - totalDeductions;

          console.log(`Employee ${employee.name}: Gross=${grossPay}, Deductions=${totalDeductions}, Net=${netPay}`);

          // Check if payroll record already exists for this employee and period
          const payPeriodStart = startOfMonth.toISOString().split('T')[0];
          const payPeriodEnd = endOfMonth.toISOString().split('T')[0];
          
          const { data: existingPayroll } = await supabase
            .from('payroll')
            .select('id')
            .eq('employee_id', employee.id)
            .eq('pay_period_start', payPeriodStart)
            .eq('pay_period_end', payPeriodEnd)
            .maybeSingle();

          if (existingPayroll) {
            // Update existing payroll record
            await supabase
              .from('payroll')
              .update({
                basic_salary: basicSalary,
                hra: hra,
                allowances: allowances,
                ot_amount: otAmount,
                deductions: totalDeductions,
                gross_pay: grossPay,
                net_pay: netPay,
                status: 'processed',
                processed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingPayroll.id);
          } else {
              // Create new payroll record
              await createPayroll.mutateAsync({
                employee_id: employee.id,
                pay_period_start: payPeriodStart,
                pay_period_end: payPeriodEnd,
                basic_salary: basicSalary,
                hra: hra,
                allowances: allowances,
                ot_amount: otAmount,
                deductions: totalDeductions,
                gross_pay: grossPay,
                net_pay: netPay,
                status: 'processed',
                processed_at: new Date().toISOString(),
              });
          }
          
          successCount++;
          console.log(`Successfully processed payroll for ${employee.name}`);
        } catch (error) {
          console.error(`Error processing payroll for ${employee.name}:`, error);
          errorCount++;
        }
      }

      // Force refresh of payroll stats
      await queryClient.invalidateQueries({ queryKey: ['payroll'] });
      await queryClient.invalidateQueries({ queryKey: ['payroll-stats'] });
      
      // Wait a bit for the queries to refresh
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['payroll-stats'] });
      }, 500);

      if (successCount > 0) {
        toast({
          title: "Payroll Processing Complete!",
          description: `Successfully processed payroll for ${successCount} employees${errorCount > 0 ? `. ${errorCount} failed.` : '.'}`,
        });
      } else {
        toast({
          title: "Processing Failed",
          description: "Failed to process payroll for any employees. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
      toast({
        title: "Error",
        description: "Failed to process payroll. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePayslipPDF = (employee) => {
    const grossPay = employee.gross_salary || (employee.basic_salary * 30) || 0; // Use monthly gross salary
    
    // Use dynamic settings for calculations
    const pfRate = (payrollSettings?.pf_rate || 12) / 100;
    const esiRate = (payrollSettings?.esi_rate || 1.75) / 100;
    const taxRate = (payrollSettings?.income_tax_rate || 5) / 100;
    
    const pfDeduction = Math.round(grossPay * pfRate);
    const esiDeduction = Math.round(grossPay * esiRate);
    const taxDeduction = Math.round(grossPay * taxRate);
    const totalDeductions = pfDeduction + esiDeduction + taxDeduction;
    const netPay = grossPay - totalDeductions;

    // Find branch name
    const branch = branches.find(b => b.id === employee.branch_id);
    const branchName = branch?.name || 'N/A';

    // Create PDF using jsPDF with portrait orientation
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Company Header
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('SSS SOLUTIONS', 105, 20, { align: 'center' });
    doc.setFontSize(14);
    doc.text('PAYSLIP', 105, 30, { align: 'center' });
    
    // Branch name in bold below PAYSLIP
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(branchName, 105, 38, { align: 'center' });
    
    // Header line
    doc.line(20, 42, 190, 42);

    // Employee Information Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Emp No: ${employee.employee_id}`, 20, 52);
    doc.text(`Employee Name: ${employee.name}`, 20, 59);
    doc.text(`Designation: ${employee.position}`, 20, 66);
    doc.text(`Date of Join: ${new Date(employee.join_date).toLocaleDateString()}`, 20, 73);
    doc.text(`Branch: ${branchName}`, 20, 80);
    doc.text(`OT Hrs: 12.0 hrs`, 20, 87);

    // Earnings Section
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Earnings', 20, 102);
    doc.text('Deductions', 105, 102);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Earnings items
    let yPos = 112;
    doc.text('Basic + DA', 20, yPos);
    doc.text(employee.basic_salary.toFixed(2), 70, yPos);
    
    yPos += 7;
    doc.text('HRA', 20, yPos);
    doc.text(employee.hra.toFixed(2), 70, yPos);
    
    yPos += 7;
    doc.text('Conveyance', 20, yPos);
    doc.text('0.00', 70, yPos);
    
    yPos += 7;
    doc.text('Other Allowance', 20, yPos);
    doc.text(employee.allowances.toFixed(2), 70, yPos);
    
    yPos += 7;
    doc.text('Overtime Amount', 20, yPos);
    doc.text('720.00', 70, yPos);

    // Deductions items
    yPos = 112;
    doc.text('PF', 105, yPos);
    doc.text(pfDeduction.toFixed(2), 155, yPos);
    
    yPos += 7;
    doc.text('ESI', 105, yPos);
    doc.text(esiDeduction.toFixed(2), 155, yPos);
    
    yPos += 7;
    doc.text('Advance', 105, yPos);
    doc.text('0.00', 155, yPos);
    
    yPos += 7;
    doc.text('Food Allowance', 105, yPos);
    doc.text('0.00', 155, yPos);
    
    yPos += 7;
    doc.text('Other', 105, yPos);
    doc.text('0.00', 155, yPos);

    // Totals
    yPos = 157;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Earnings ${grossPay.toFixed(2)}`, 20, yPos);
    doc.text(`Total Deductions ${totalDeductions.toFixed(2)}`, 105, yPos);

    // Net Pay Box
    yPos = 172;
    doc.rect(20, yPos - 5, 170, 12);
    doc.setFontSize(12);
    doc.text(`NET PAY: ${netPay.toFixed(2)}`, 105, yPos + 2, { align: 'center' });

    // Footer Information
    yPos = 192;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Generated:', 20, yPos);
    doc.text(new Date().toLocaleDateString(), 60, yPos);
    doc.text('PF Number:', 20, yPos + 7);
    doc.text(employee.pf_number || '123sehsd243y', 60, yPos + 7);
    doc.text('ESI Number:', 20, yPos + 14);
    doc.text(employee.esi_number || '1234578462', 60, yPos + 14);

    // Save the PDF
    doc.save(`payslip-${employee.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Payslip Generated",
      description: `PDF payslip for ${employee.name} has been downloaded.`,
    });
  };

  const quickActions = [
    { 
      title: 'Process Payroll', 
      icon: Calculator, 
      action: processPayrollForAllEmployees,
      disabled: isProcessing
    },
    { title: 'Generate Reports', icon: FileText, action: () => setShowGenerateReports(true) },
    { title: 'Tax Calculation', icon: TrendingUp, action: calculateTax },
    { title: 'Payroll Settings', icon: Settings, action: openPayrollSettings }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
        <Button onClick={handleExportAll} className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export All
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Payroll Overview</TabsTrigger>
          <TabsTrigger value="employee">Employee Payroll</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced Table</TabsTrigger>
          <TabsTrigger value="settings" data-value="settings">Payroll Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Payroll"
              value={`₹${(payrollStats?.totalPayroll || 0).toLocaleString()}`}
              icon={DollarSign}
              color="green"
            />
            <MetricCard
              title="Employees Paid"
              value={payrollStats?.processedCount || 0}
              icon={Users}
              color="blue"
            />
            <MetricCard
              title="Pending Payments"
              value={payrollStats?.pendingCount || 0}
              icon={FileText}
              color="yellow"
            />
            <MetricCard
              title="Avg Salary"
              value={`₹${Math.round((payrollStats?.totalPayroll || 0) / Math.max(payrollStats?.totalEmployees || 1, 1)).toLocaleString()}`}
              icon={Calculator}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payroll Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Basic Salary</span>
                      <span className="font-bold">₹{(payrollStats?.totalPayroll * 0.6 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">HRA</span>
                      <span className="font-bold">₹{(payrollStats?.totalPayroll * 0.2 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Allowances</span>
                      <span className="font-bold">₹{(payrollStats?.totalPayroll * 0.15 || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">Deductions</span>
                      <span className="font-bold text-red-600">-₹{(payrollStats?.totalPayroll * 0.05 || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={action.action}
                      disabled={action.disabled}
                    >
                      <action.icon className="h-4 w-4 mr-2" />
                      {action.title}
                      {action.disabled && isProcessing && " (Processing...)"}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employee" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{employee.name}</h3>
                        
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">₹{(employee.gross_salary || (employee.basic_salary * 30) || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Gross Pay</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => generatePayslipPDF(employee)}
                      >
                        Download Payslip
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedPayrollTable />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="income_tax">Income Tax Rate (%)</Label>
                  <Input 
                    id="income_tax" 
                    type="number" 
                    value={payrollSettings?.income_tax_rate || 5} 
                    onChange={(e) => {
                      if (payrollSettings) {
                        updatePayrollSettings.mutate({
                          ...payrollSettings,
                          income_tax_rate: parseFloat(e.target.value) || 5
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="pf_rate">PF Rate (%)</Label>
                  <Input 
                    id="pf_rate" 
                    type="number" 
                    value={payrollSettings?.pf_rate || 12} 
                    onChange={(e) => {
                      if (payrollSettings) {
                        updatePayrollSettings.mutate({
                          ...payrollSettings,
                          pf_rate: parseFloat(e.target.value) || 12
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="esi_rate">ESI Rate (%)</Label>
                  <Input 
                    id="esi_rate" 
                    type="number" 
                    step="0.01" 
                    value={payrollSettings?.esi_rate || 1.75} 
                    onChange={(e) => {
                      if (payrollSettings) {
                        updatePayrollSettings.mutate({
                          ...payrollSettings,
                          esi_rate: parseFloat(e.target.value) || 1.75
                        });
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payroll Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pay_frequency">Pay Frequency</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={payrollSettings?.pay_frequency || 'monthly'}
                    onChange={(e) => {
                      if (payrollSettings) {
                        updatePayrollSettings.mutate({
                          ...payrollSettings,
                          pay_frequency: e.target.value
                        });
                      }
                    }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="pay_date">Monthly Pay Date</Label>
                  <Input 
                    id="pay_date" 
                    type="number" 
                    min="1" 
                    max="31" 
                    value={payrollSettings?.monthly_pay_date || 30}
                    onChange={(e) => {
                      if (payrollSettings) {
                        updatePayrollSettings.mutate({
                          ...payrollSettings,
                          monthly_pay_date: parseInt(e.target.value) || 30
                        });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="overtime_rate">Overtime Rate (multiplier)</Label>
                  <Input 
                    id="overtime_rate" 
                    type="number" 
                    step="0.1" 
                    value={payrollSettings?.overtime_rate || 1.5}
                    onChange={(e) => {
                      if (payrollSettings) {
                        updatePayrollSettings.mutate({
                          ...payrollSettings,
                          overtime_rate: parseFloat(e.target.value) || 1.5
                        });
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <GenerateReportsDialog 
        open={showGenerateReports}
        onOpenChange={setShowGenerateReports}
      />
    </div>
  );
};

export default Payroll;
