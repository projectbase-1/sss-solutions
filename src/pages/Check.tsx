import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Eye } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { usePayroll } from '@/hooks/usePayroll';
import { useEmployees } from '@/hooks/useEmployees';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';

const Check = () => {
  const [checkBranch, setCheckBranch] = useState<string>('');

  const { data: branches = [], isLoading: branchesLoading } = useBranches();
  const { data: payrollRecords = [] } = usePayroll();
  const { data: employees = [] } = useEmployees();
  const { data: allEmployeesStats = {} } = useAllEmployeesAttendanceStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Check - Branch Financial Summary</h1>
          <p className="text-muted-foreground">
            View branch-wise allowance summaries and payroll calculations
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Financial Summary
          </CardTitle>
          <CardDescription>
            Select a branch to view detailed financial breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Branch Selection for Check */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Branch for Summary</label>
            <Select 
              value={checkBranch} 
              onValueChange={setCheckBranch}
              disabled={branchesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a branch for financial summary" />
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

          {/* Financial Summary Display */}
          {checkBranch && (() => {
            const branchPayroll = payrollRecords.filter(record => 
              record.employees?.branch_id === checkBranch
            );
            
            // Get allowances from both payroll and attendance data
            const branchEmployees = employees.filter(emp => emp.branch_id === checkBranch);
            const attendanceFood = branchEmployees.reduce((sum, emp) => {
              const stats = allEmployeesStats[emp.id];
              return sum + (stats?.food || 0);
            }, 0);
            const attendanceUniform = branchEmployees.reduce((sum, emp) => {
              const stats = allEmployeesStats[emp.id];
              return sum + (stats?.uniform || 0);
            }, 0);
            
            const totalFood = branchPayroll.reduce((sum, record) => sum + (record.food || 0), 0) + attendanceFood;
            const totalUniform = branchPayroll.reduce((sum, record) => sum + (record.uniform || 0), 0) + attendanceUniform;
            const totalPayslip = branchPayroll.reduce((sum, record) => sum + (record.net_pay || 0), 0);
            const totalLunch = branchPayroll.reduce((sum, record) => sum + (record.lunch || 0), 0);
            const totalGrossEarnings = branchPayroll.reduce((sum, record) => sum + (record.gross_earnings || record.gross_pay || 0), 0);
            const totalPF = branchPayroll.reduce((sum, record) => sum + (record.pf_12_percent || 0), 0);
            const totalESI = branchPayroll.reduce((sum, record) => sum + (record.esi_0_75_percent || 0), 0);
            const totalOT = branchPayroll.reduce((sum, record) => sum + (record.ot_amount || 0), 0);
            const totalTakeHome = branchPayroll.reduce((sum, record) => sum + (record.take_home || record.net_pay || 0), 0);
            
            const selectedBranchName = branches.find(b => b.id === checkBranch)?.name || 'Unknown Branch';
            const employeeCount = branchPayroll.length;

            return (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{selectedBranchName}</h3>
                  <p className="text-sm text-muted-foreground">Total Employees: {employeeCount}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Allowances Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Total Allowances</CardTitle>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Employee Allowances - {selectedBranchName}</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="food" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="food">Food Allowances</TabsTrigger>
                                <TabsTrigger value="uniform">Uniform Allowances</TabsTrigger>
                              </TabsList>
                              <TabsContent value="food" className="max-h-96 overflow-y-auto mt-4">
                                <div className="space-y-2">
                                  {(() => {
                                    const branchEmployees = employees.filter(emp => emp.branch_id === checkBranch);
                                    const employeesWithFood = branchEmployees.filter(emp => {
                                      const stats = allEmployeesStats[emp.id];
                                      return stats && (stats.food || 0) > 0;
                                    }).sort((a, b) => ((a as any).batch_number || '').localeCompare((b as any).batch_number || ''));
                                    
                                    return employeesWithFood.length > 0 ? 
                                      employeesWithFood.map((emp, index) => {
                                        const stats = allEmployeesStats[emp.id];
                                        return (
                                          <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                              <p className="font-medium">{emp.name}</p>
                                              <p className="text-sm text-muted-foreground">ID: {emp.employee_id}</p>
                                              <p className="text-sm text-muted-foreground">Batch: {(emp as any).batch_number || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">₹{(stats.food || 0).toLocaleString()}</p>
                                            </div>
                                          </div>
                                        );
                                      }) : (
                                        <p className="text-center text-muted-foreground py-4">No employees with food allowances found</p>
                                      );
                                  })()}
                                </div>
                              </TabsContent>
                              <TabsContent value="uniform" className="max-h-96 overflow-y-auto mt-4">
                                <div className="space-y-2">
                                  {(() => {
                                    const branchEmployees = employees.filter(emp => emp.branch_id === checkBranch);
                                    const employeesWithUniform = branchEmployees.filter(emp => {
                                      const stats = allEmployeesStats[emp.id];
                                      return stats && (stats.uniform || 0) > 0;
                                    }).sort((a, b) => ((a as any).batch_number || '').localeCompare((b as any).batch_number || ''));
                                    
                                    return employeesWithUniform.length > 0 ? 
                                      employeesWithUniform.map((emp, index) => {
                                        const stats = allEmployeesStats[emp.id];
                                        return (
                                          <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                            <div>
                                              <p className="font-medium">{emp.name}</p>
                                              <p className="text-sm text-muted-foreground">ID: {emp.employee_id}</p>
                                              <p className="text-sm text-muted-foreground">Batch: {(emp as any).batch_number || 'N/A'}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">₹{(stats.uniform || 0).toLocaleString()}</p>
                                            </div>
                                          </div>
                                        );
                                      }) : (
                                        <p className="text-center text-muted-foreground py-4">No employees with uniform allowances found</p>
                                      );
                                  })()}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Food:</span>
                        <span className="font-medium">₹{totalFood.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Uniform:</span>
                        <span className="font-medium">₹{totalUniform.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Lunch:</span>
                        <span className="font-medium">₹{totalLunch.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>₹{(totalFood + totalUniform + totalLunch).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Payroll Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Payroll Summary</CardTitle>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Employee Payroll Data - {selectedBranchName}</DialogTitle>
                            </DialogHeader>
                            <div className="max-h-96 overflow-y-auto">
                              <div className="space-y-2">
                                {branchPayroll
                                  .filter(record => (record.gross_earnings || 0) > 0 || (record.net_pay || 0) > 0)
                                  .sort((a, b) => ((a.employees as any)?.batch_number || '').localeCompare(((b.employees as any)?.batch_number || '')))
                                  .map((record, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                      <div>
                                        <p className="font-medium">{record.employees?.name}</p>
                                        <p className="text-sm text-muted-foreground">ID: {record.employees?.employee_id}</p>
                                        <p className="text-sm text-muted-foreground">Batch: {(record.employees as any)?.batch_number || 'N/A'}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-medium">₹{(record.net_pay || 0).toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">Net Pay</p>
                                      </div>
                                    </div>
                                  ))}
                                {branchPayroll.filter(record => (record.gross_earnings || 0) > 0 || (record.net_pay || 0) > 0).length === 0 && (
                                  <p className="text-center text-muted-foreground py-4">No employees with payroll data found</p>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Gross Earnings:</span>
                        <span className="font-medium">₹{totalGrossEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Net Payslip:</span>
                        <span className="font-medium">₹{totalPayslip.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Take Home:</span>
                        <span className="font-medium">₹{totalTakeHome.toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Other Calculations */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Deductions & OT</CardTitle>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Employee Deductions & OT - {selectedBranchName}</DialogTitle>
                            </DialogHeader>
                            <Tabs defaultValue="deductions" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="deductions">Deductions</TabsTrigger>
                                <TabsTrigger value="overtime">Overtime</TabsTrigger>
                              </TabsList>
                              <TabsContent value="deductions" className="max-h-96 overflow-y-auto mt-4">
                                <div className="space-y-2">
                                  {(() => {
                                    const branchEmployees = employees.filter(emp => emp.branch_id === checkBranch);
                                    const combinedData = [];
                                    
                                    // Add payroll records with deductions
                                    branchPayroll.forEach(record => {
                                      if ((record.pf_12_percent || 0) > 0 || (record.esi_0_75_percent || 0) > 0 || (record.deductions || 0) > 0) {
                                        combinedData.push({
                                          name: record.employees?.name,
                                          employee_id: record.employees?.employee_id,
                                          batch_number: (record.employees as any)?.batch_number,
                                          pf: record.pf_12_percent || 0,
                                          esi: record.esi_0_75_percent || 0,
                                          deduction: record.deductions || 0
                                        });
                                      }
                                    });
                                    
                                    // Add attendance-based deductions
                                    branchEmployees.forEach(emp => {
                                      const stats = allEmployeesStats[emp.id];
                                      if (stats && (stats.deduction || 0) > 0) {
                                        combinedData.push({
                                          name: emp.name,
                                          employee_id: emp.employee_id,
                                          batch_number: (emp as any).batch_number,
                                          deduction: stats.deduction || 0
                                        });
                                      }
                                    });
                                    
                                    return combinedData.length > 0 ? 
                                      combinedData.sort((a, b) => (a.batch_number || '').localeCompare(b.batch_number || '')).map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                          <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">ID: {item.employee_id}</p>
                                            <p className="text-sm text-muted-foreground">Batch: {item.batch_number || 'N/A'}</p>
                                          </div>
                                          <div className="text-right">
                                            <div className="space-y-1">
                                              {(item.pf || 0) > 0 && (
                                                <p className="text-sm">PF: ₹{(item.pf || 0).toLocaleString()}</p>
                                              )}
                                              {(item.esi || 0) > 0 && (
                                                <p className="text-sm">ESI: ₹{(item.esi || 0).toLocaleString()}</p>
                                              )}
                                              {(item.deduction || 0) > 0 && (
                                                <p className="text-sm">Deduction: ₹{(item.deduction || 0).toLocaleString()}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )) : (
                                        <p className="text-center text-muted-foreground py-4">No employees with deductions found</p>
                                      );
                                  })()}
                                </div>
                              </TabsContent>
                              <TabsContent value="overtime" className="max-h-96 overflow-y-auto mt-4">
                                <div className="space-y-2">
                                  {(() => {
                                    const branchEmployees = employees.filter(emp => emp.branch_id === checkBranch);
                                    const combinedData = [];
                                    
                                    // Add payroll records with OT
                                    branchPayroll.forEach(record => {
                                      if ((record.ot_amount || 0) > 0) {
                                        combinedData.push({
                                          name: record.employees?.name,
                                          employee_id: record.employees?.employee_id,
                                          batch_number: (record.employees as any)?.batch_number,
                                          ot: record.ot_amount || 0
                                        });
                                      }
                                    });
                                    
                                    // Add attendance-based OT
                                    branchEmployees.forEach(emp => {
                                      const stats = allEmployeesStats[emp.id];
                                      if (stats && (stats.ot_hours || 0) > 0) {
                                        combinedData.push({
                                          name: emp.name,
                                          employee_id: emp.employee_id,
                                          batch_number: (emp as any).batch_number,
                                          ot_hours: stats.ot_hours || 0
                                        });
                                      }
                                    });
                                    
                                    return combinedData.length > 0 ? 
                                      combinedData.sort((a, b) => (a.batch_number || '').localeCompare(b.batch_number || '')).map((item, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                          <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">ID: {item.employee_id}</p>
                                            <p className="text-sm text-muted-foreground">Batch: {item.batch_number || 'N/A'}</p>
                                          </div>
                                          <div className="text-right">
                                            <div className="space-y-1">
                                              {(item.ot || 0) > 0 && (
                                                <p className="text-sm">OT Amount: ₹{(item.ot || 0).toLocaleString()}</p>
                                              )}
                                              {(item.ot_hours || 0) > 0 && (
                                                <p className="text-sm">OT Hours: {(item.ot_hours || 0).toFixed(1)}</p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )) : (
                                        <p className="text-center text-muted-foreground py-4">No employees with overtime found</p>
                                      );
                                  })()}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">PF (12%):</span>
                        <span className="font-medium">₹{totalPF.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">ESI (0.75%):</span>
                        <span className="font-medium">₹{totalESI.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">OT Amount:</span>
                        <span className="font-medium">₹{totalOT.toLocaleString()}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total Deductions:</span>
                        <span>₹{(totalPF + totalESI).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })()}

          {!checkBranch && (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a branch to view financial summary</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Check;
