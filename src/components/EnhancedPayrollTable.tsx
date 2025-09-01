
import React from 'react';
import { usePayroll } from '@/hooks/usePayroll';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import PayrollExcelExport from './PayrollExcelExport';

const EnhancedPayrollTable = () => {
  const { data: payrollRecords = [], isLoading } = usePayroll();
  const { data: attendanceStats = {} } = useAllEmployeesAttendanceStats();

  // Sort payroll records by employee ID
  const sortedPayrollRecords = payrollRecords.sort((a, b) => {
    const aEmployeeId = a.employees?.employee_id || '';
    const bEmployeeId = b.employees?.employee_id || '';
    return aEmployeeId.localeCompare(bEmployeeId, undefined, { numeric: true });
  });

  if (isLoading) {
    return <div className="p-4">Loading payroll data...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Enhanced Payroll Records</CardTitle>
        <PayrollExcelExport />
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-500 text-white">
                <TableHead className="text-white">Sl. No</TableHead>
                <TableHead className="text-white">EMP. No</TableHead>
                <TableHead className="text-white">Name of the Employee</TableHead>
                <TableHead className="text-white">PF.No</TableHead>
                <TableHead className="text-white">ESI.No</TableHead>
                <TableHead colSpan={2} className="text-center border-r text-white">Man Days Details</TableHead>
                <TableHead colSpan={2} className="text-center border-r text-white">Salary Components</TableHead>
                <TableHead colSpan={2} className="text-center border-r text-white">Earned Salary</TableHead>
                <TableHead colSpan={7} className="text-center border-r text-white">Service details</TableHead>
                <TableHead className="text-white">Status</TableHead>
              </TableRow>
              <TableRow className="bg-green-500 text-white">
                <TableHead className="text-white"></TableHead>
                <TableHead className="text-white"></TableHead>
                <TableHead className="text-white"></TableHead>
                <TableHead className="text-white"></TableHead>
                <TableHead className="text-white"></TableHead>
                <TableHead className="text-white">Worked Days</TableHead>
                <TableHead className="text-white">OT Hrs</TableHead>
                <TableHead className="text-white">Per Day Salary</TableHead>
                <TableHead className="text-white">Basic</TableHead>
                <TableHead className="text-white">DA</TableHead>
                <TableHead className="text-white">Basic</TableHead>
                <TableHead className="text-white">DA</TableHead>
                <TableHead className="text-white">Extra Hours</TableHead>
                <TableHead className="text-white">Gross Earnings</TableHead>
                <TableHead className="text-white">PF 12%</TableHead>
                <TableHead className="text-white">ESI 0.75%</TableHead>
                <TableHead className="text-white">Rent</TableHead>
                <TableHead className="text-white">Advance</TableHead>
                <TableHead className="text-white">Food</TableHead>
                <TableHead className="text-white">Shoe & Uniform</TableHead>
                <TableHead className="text-white">Total Deduction</TableHead>
                <TableHead className="text-white">Take Home</TableHead>
                <TableHead className="text-white"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayrollRecords.map((record, index) => {
                const attendanceData = attendanceStats[record.employee_id];
                const attendanceOtHours = attendanceData?.ot_hours || 0;
                const totalOtHours = attendanceOtHours + (record.ot_hours || 0);
                
                // Use the new formula: Earned Basic = Basic Salary × Present Days
                const basicSalary = record.basic_salary || 0;
                const daAmount = record.da_amount || 0;
                const workedDays = record.worked_days || 0;
                const earnedBasic = Math.round(basicSalary * workedDays);
                const earnedDA = Math.round(daAmount * workedDays);
                
                // Calculate extra hours pay (OT)
                const extraHoursPay = Math.round(totalOtHours * 60); // Assuming 60 per hour rate
                
                // Calculate gross earnings (with 15000 cap)
                const uncappedGrossEarnings = earnedBasic + earnedDA + extraHoursPay;
                const grossEarnings = Math.min(uncappedGrossEarnings, 15000); // Cap at 15000
                
                // Calculate deductions
                const pfAmount = Math.min(Math.round(earnedBasic * 0.12), 1800); // Cap PF at 1800
                const esiAmount = Math.round(grossEarnings * 0.0075);
                const rentDeduction = Math.round(record.rent_deduction || 0);
                const advance = 0; // Will be added later from employee data
                const foodDeduction = Math.round(record.food || 0);
                const shoeUniformAllowance = Math.round(record.shoe_uniform_allowance || 0);
                
                // Calculate total deduction
                const totalDeduction = Math.round(pfAmount + esiAmount + rentDeduction + advance + foodDeduction - shoeUniformAllowance);
                
                // Calculate take home
                const takeHome = Math.round(grossEarnings - totalDeduction);
                
                return (
                  <TableRow key={record.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{record.employees?.employee_id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{record.employees?.name}</div>
                    </TableCell>
                    <TableCell>{record.pf_number || record.employees?.pf_number || '-'}</TableCell>
                    <TableCell>{record.esi_number || record.employees?.esi_number || '-'}</TableCell>
                    <TableCell>{workedDays}</TableCell>
                    <TableCell>{totalOtHours.toFixed(1)}</TableCell>
                    <TableCell>₹{basicSalary}</TableCell>
                    <TableCell>₹{basicSalary}</TableCell>
                    <TableCell>₹{daAmount}</TableCell>
                    <TableCell>₹{earnedBasic}</TableCell>
                    <TableCell>₹{earnedDA}</TableCell>
                    <TableCell>₹{extraHoursPay}</TableCell>
                    <TableCell>₹{grossEarnings}</TableCell>
                    <TableCell>₹{pfAmount}</TableCell>
                    <TableCell>₹{esiAmount}</TableCell>
                    <TableCell>₹{rentDeduction}</TableCell>
                    <TableCell>₹{advance}</TableCell>
                    <TableCell>₹{foodDeduction}</TableCell>
                    <TableCell>₹{shoeUniformAllowance}</TableCell>
                    <TableCell>₹{totalDeduction}</TableCell>
                    <TableCell>₹{takeHome}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'paid' ? 'default' : record.status === 'processed' ? 'secondary' : 'outline'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedPayrollTable;
