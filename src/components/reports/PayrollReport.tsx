
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface PayrollData {
  month: string;
  amount: number;
  count: number;
}

const PayrollReport = () => {
  const { toast } = useToast();
  const { data: payroll = [] } = useQuery({
    queryKey: ['payrollReport'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (
            name,
            per_day_salary,
            basic_salary,
            branch_id,
            branches (name)
          )
        `);
      if (error) throw error;
      return data;
    }
  });

  // Process data for chart - group by month with corrected calculations
  const monthlyPayroll = React.useMemo(() => {
    const monthData: Record<string, PayrollData> = {};
    
    payroll.forEach(record => {
      const date = new Date(record.pay_period_start || record.created_at);
      const month = date.toLocaleString('default', { month: 'short' });
      
      // Calculate corrected net pay using per_day_salary
      let perDaySalary = record.employees?.per_day_salary || 0;
      const basicSalary = record.employees?.basic_salary || 0;
      
      // If per_day_salary is 0 but basic_salary exists, reverse-calculate
      if (perDaySalary === 0 && basicSalary > 0) {
        perDaySalary = Math.round(basicSalary / 0.6);
      }
      
      const workedDays = record.worked_days || 0;
      const basicEarned = Math.round(perDaySalary * 0.60 * workedDays);
      const daEarned = Math.round(perDaySalary * 0.40 * workedDays);
      const otAmount = Math.round((record.ot_hours || 0) * 60);
      const grossEarnings = basicEarned + daEarned + otAmount;
      
      // Calculate deductions
      const pfAmount = Math.min(Math.round(basicEarned * 0.12), 1800);
      const esiAmount = Math.round((basicEarned + daEarned + otAmount) * 0.0075);
      const totalDeductions = pfAmount + esiAmount + (record.rent_deduction || 0) + (record.food || 0);
      const netPay = grossEarnings - totalDeductions + (record.shoe_uniform_allowance || 0);
      
      if (!monthData[month]) {
        monthData[month] = { month, amount: 0, count: 0 };
      }
      monthData[month].amount += netPay;
      monthData[month].count += 1;
    });

    return Object.values(monthData).map(month => ({
      ...month,
      amount: Math.round(month.amount)
    }));
  }, [payroll]);

  const handleExportPayroll = () => {
    try {
      const exportData = payroll.map(record => {
        let perDaySalary = record.employees?.per_day_salary || 0;
        const basicSalary = record.employees?.basic_salary || 0;
        
        // If per_day_salary is 0 but basic_salary exists, reverse-calculate
        if (perDaySalary === 0 && basicSalary > 0) {
          perDaySalary = Math.round(basicSalary / 0.6);
        }
        
        const workedDays = record.worked_days || 0;
        const basicEarned = Math.round(perDaySalary * 0.60 * workedDays);
        const daEarned = Math.round(perDaySalary * 0.40 * workedDays);
        const otAmount = Math.round((record.ot_hours || 0) * 60);
        const grossEarnings = basicEarned + daEarned + otAmount;
        
        // Calculate deductions
        const pfAmount = Math.min(Math.round(basicEarned * 0.12), 1800);
        const esiAmount = Math.round((basicEarned + daEarned + otAmount) * 0.0075);
        const totalDeductions = pfAmount + esiAmount + (record.rent_deduction || 0) + (record.food || 0);
        const netPay = grossEarnings - totalDeductions + (record.shoe_uniform_allowance || 0);

        return {
          'Month': record.month || 'N/A',
          'Employee': record.employees?.name || 'N/A',
          'Per Day Salary': perDaySalary,
          'Worked Days': workedDays,
          'Basic Earned (60%)': basicEarned,
          'DA Earned (40%)': daEarned,
          'OT Amount': otAmount,
          'Gross Earnings': grossEarnings,
          'PF Deduction': pfAmount,
          'ESI Deduction': esiAmount,
          'Other Deductions': (record.rent_deduction || 0) + (record.food || 0),
          'Total Deductions': totalDeductions,
          'Allowances': record.shoe_uniform_allowance || 0,
          'Net Pay (Corrected)': netPay,
          'Status': record.status,
          'Branch': record.employees?.branches?.name || 'N/A'
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Set column widths
      ws['!cols'] = Array(Object.keys(exportData[0] || {}).length).fill({ wch: 15 });
      
      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Report');
      
      const fileName = `payroll_report_corrected_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Export Successful",
        description: "Payroll report with corrected Basic (60%) and DA (40%) calculations has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting payroll report:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export payroll report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payroll Analytics (Corrected Calculations)</CardTitle>
        <Button onClick={handleExportPayroll} variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyPayroll}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
            <Tooltip 
              formatter={(value) => [`₹${value.toLocaleString()}`, 'Total Amount (Corrected)']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Bar dataKey="amount" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {monthlyPayroll.map((month) => (
            <div key={month.month} className="text-center">
              <div className="text-sm font-medium text-gray-600">{month.month}</div>
              <div className="text-lg font-bold text-gray-900">₹{month.amount.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{month.count} payments</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This report uses corrected salary calculations where Basic = 60% of per day salary and DA = 40% of per day salary.
            Earned amounts are calculated as Basic/DA × worked days.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PayrollReport;
