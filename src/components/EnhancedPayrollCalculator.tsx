import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePayrollSettings } from '@/hooks/usePayrollSettings';
import { useCreatePayroll, useUpdatePayroll } from '@/hooks/usePayroll';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';
import { Calculator, Save } from 'lucide-react';

interface PayrollCalculatorProps {
  selectedEmployeeId?: string;
  payrollRecord?: any;
  onSuccess?: () => void;
}

const EnhancedPayrollCalculator: React.FC<PayrollCalculatorProps> = ({
  selectedEmployeeId,
  payrollRecord,
  onSuccess
}) => {
  const { toast } = useToast();
  const { data: payrollSettings } = usePayrollSettings();
  const { data: employees = [] } = useEmployees();
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();

  const [formData, setFormData] = useState({
    employee_id: selectedEmployeeId || payrollRecord?.employee_id || '',
    month: payrollRecord?.month || new Date().toISOString().slice(0, 7),
    worked_days: payrollRecord?.worked_days || 0,
    ot_hours: payrollRecord?.ot_hours || 0,
    ot_rate: payrollRecord?.ot_rate || 0,
    basic_salary: payrollRecord?.basic_salary || 0,
    da_amount: payrollRecord?.da_amount || 0,
    basic_plus_da: payrollRecord?.basic_plus_da || 0,
    day_salary: payrollRecord?.day_salary || 0,
    extra_hours_pay: payrollRecord?.extra_hours_pay || 0,
    gross_earnings: payrollRecord?.gross_earnings || 0,
    pf_12_percent: payrollRecord?.pf_12_percent || 0,
    esi_0_75_percent: payrollRecord?.esi_0_75_percent || 0,
    rent_deduction: payrollRecord?.rent_deduction || 0,
    food: payrollRecord?.food || 0,
    shoe_uniform_allowance: payrollRecord?.shoe_uniform_allowance || 0,
    uniform: payrollRecord?.uniform || 0,
    deductions: payrollRecord?.deductions || 0,
    take_home: payrollRecord?.take_home || 0,
    net_pay: payrollRecord?.net_pay || 0,
    status: payrollRecord?.status || 'draft'
  });

  const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);

  // Auto-populate employee data when selected
  useEffect(() => {
    if (selectedEmployee) {
      const basicSalary = selectedEmployee.basic_salary || 0;
      const daAmount = selectedEmployee.da_amount || 0;
      const daRate = selectedEmployee.da_rate || 0;
      const dayRate = selectedEmployee.day_rate || basicSalary / 30; // Default day rate

      setFormData(prev => ({
        ...prev,
        basic_salary: basicSalary,
        da_amount: daAmount,
        day_salary: dayRate,
        ot_rate: daRate * 1.5, // 1.5x overtime rate
        rent_deduction: selectedEmployee.rent_deduction || 0,
        shoe_uniform_allowance: selectedEmployee.shoe_uniform_allowance || 0,
      }));
    }
  }, [selectedEmployee]);

  // Auto-calculate derived values with caps
  useEffect(() => {
    const basicSalary = formData.basic_salary;
    const daAmount = formData.da_amount;
    const workedDays = formData.worked_days;
    const otHours = formData.ot_hours;
    const otRate = formData.ot_rate || 60; // Default OT rate

    // Earned Basic = Basic Salary × Present Days (no division by 26/30)
    const earnedBasic = Math.round(basicSalary * workedDays);

    // Earned DA = DA Amount × Present Days (no division by 26/30)
    const earnedDA = Math.round(daAmount * workedDays);

    // Calculate Extra Hours Pay (OT): OT Hours × OT Rate
    const extraHoursPay = Math.round(otHours * otRate);

    // Gross Salary = Monthly Salary (earned basic + earned DA + OT) - CAPPED AT 15000
    const uncappedGrossEarnings = earnedBasic + earnedDA + extraHoursPay;
    const grossEarnings = Math.min(uncappedGrossEarnings, 15000); // Cap at 15000

    // Calculate PF (12% of Basic + DA) - CAPPED AT 1800
    const pfBasic = Math.round((earnedBasic + earnedDA + extraHoursPay));
    const uncappedPf = Math.round(pfBasic * 0.12);
    const pf12Percent = Math.min(uncappedPf, 1800); // Cap PF at 1800

    // Calculate ESI (0.75% of Gross Earnings, 0 if > ₹21,000)
    const esi075Percent = grossEarnings > 21000 ? 0 : Math.round(grossEarnings * 0.0075);

    // Calculate total deductions (PF + ESI + Rent + Food + Uniform - Shoe & Uniform Allowance)
    const totalDeductions = Math.round(
      pf12Percent + 
      esi075Percent + 
      formData.rent_deduction + 
      formData.food + 
      formData.uniform - 
      formData.shoe_uniform_allowance
    );

    // Calculate Take Home: Gross Earnings - Total Deductions
    const takeHome = Math.round(grossEarnings - totalDeductions);

    setFormData(prev => ({
      ...prev,
      day_salary: basicSalary, // Per day salary = basic salary (no division)
      basic_plus_da: earnedBasic + earnedDA,
      extra_hours_pay: extraHoursPay,
      gross_earnings: grossEarnings,
      pf_12_percent: pf12Percent,
      esi_0_75_percent: esi075Percent,
      deductions: totalDeductions,
      take_home: takeHome,
      net_pay: takeHome
    }));
  }, [
    formData.basic_salary,
    formData.da_amount,
    formData.worked_days,
    formData.ot_hours,
    formData.ot_rate,
    formData.rent_deduction,
    formData.food,
    formData.uniform,
    formData.shoe_uniform_allowance
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericFields = [
      'worked_days', 'ot_hours', 'ot_rate', 'basic_salary', 'da_amount', 
      'day_salary', 'rent_deduction', 'food', 'uniform', 'shoe_uniform_allowance'
    ];
    
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employee_id) {
      toast({
        title: "Error",
        description: "Please select an employee",
        variant: "destructive"
      });
      return;
    }

    try {
      const payrollData = {
        ...formData,
        pay_period_start: `${formData.month}-01`,
        pay_period_end: `${formData.month}-${new Date(formData.month + '-01').getDate()}`,
        gross_pay: formData.gross_earnings,
        hra: 0, // Not used in this format
        allowances: formData.shoe_uniform_allowance,
        ot_amount: formData.extra_hours_pay,
      };

      if (payrollRecord?.id) {
        await updatePayroll.mutateAsync({
          id: payrollRecord.id,
          updates: payrollData
        });
      } else {
        await createPayroll.mutateAsync(payrollData);
      }

      if (onSuccess) onSuccess();
      
      toast({
        title: "Success!",
        description: `Payroll ${payrollRecord ? 'updated' : 'created'} successfully.`,
      });
    } catch (error) {
      console.error('Error saving payroll:', error);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Enhanced Payroll Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="employee_id">Employee *</Label>
              <Select value={formData.employee_id} onValueChange={(value) => handleSelectChange('employee_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month">Pay Month *</Label>
              <Input 
                id="month" 
                name="month" 
                type="month" 
                value={formData.month} 
                onChange={handleInputChange} 
                required 
              />
            </div>
          </div>

          {/* Work Details Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Work Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="worked_days">Worked Days</Label>
                  <Input 
                    id="worked_days" 
                    name="worked_days" 
                    type="number" 
                    value={formData.worked_days} 
                    onChange={handleInputChange} 
                    min="0" 
                    max="31"
                  />
                </div>
                <div>
                  <Label htmlFor="ot_hours">OT Hours</Label>
                  <Input 
                    id="ot_hours" 
                    name="ot_hours" 
                    type="number" 
                    value={formData.ot_hours} 
                    onChange={handleInputChange} 
                    min="0"
                    step="0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="day_salary">Day Salary Rate</Label>
                  <Input 
                    id="day_salary" 
                    name="day_salary" 
                    type="number" 
                    value={formData.day_salary} 
                    onChange={handleInputChange} 
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Structure Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Salary Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="basic_salary">Basic Salary</Label>
                  <Input 
                    id="basic_salary" 
                    name="basic_salary" 
                    type="number" 
                    value={formData.basic_salary} 
                    onChange={handleInputChange}
                    readOnly={!!selectedEmployee}
                    className={selectedEmployee ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="da_amount">DA Amount</Label>
                  <Input 
                    id="da_amount" 
                    name="da_amount" 
                    type="number" 
                    value={formData.da_amount} 
                    onChange={handleInputChange}
                    readOnly={!!selectedEmployee}
                    className={selectedEmployee ? 'bg-gray-50' : ''}
                  />
                </div>
                <div>
                  <Label>Per Day Salary</Label>
                  <Input 
                    value={`₹${Math.round(formData.basic_salary)}`} 
                    readOnly 
                    className="bg-green-50 font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="ot_rate">OT Rate</Label>
                  <Input 
                    id="ot_rate" 
                    name="ot_rate" 
                    type="number" 
                    value={formData.ot_rate} 
                    onChange={handleInputChange}
                    step="0.01"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Earnings & Deductions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Earnings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-green-600">
                  Earnings
                  <div className="text-sm font-normal text-yellow-600 mt-1">
                    * Gross salary capped at ₹15,000
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Earned Basic</Label>
                  <Input 
                    value={`₹${Math.round((formData.basic_salary || 0) * (formData.worked_days || 0))}`} 
                    readOnly 
                    className="bg-green-50 font-semibold"
                  />
                </div>
                <div>
                  <Label>Earned DA</Label>
                  <Input 
                    value={`₹${Math.round((formData.da_amount || 0) * (formData.worked_days || 0))}`} 
                    readOnly 
                    className="bg-green-50 font-semibold"
                  />
                </div>
                <div>
                  <Label>Extra Hours Pay (OT)</Label>
                  <Input 
                    value={`₹${Math.round(formData.extra_hours_pay)}`} 
                    readOnly 
                    className="bg-green-50 font-semibold"
                  />
                </div>
                <div>
                  <Label>Gross Earnings (Max ₹15,000)</Label>
                  <Input 
                    value={`₹${Math.round(formData.gross_earnings)}`} 
                    readOnly 
                    className="bg-green-100 font-bold text-lg"
                  />
                </div>
                <div>
                  <Label htmlFor="shoe_uniform_allowance">Shoe & Uniform Allowance</Label>
                  <Input 
                    id="shoe_uniform_allowance" 
                    name="shoe_uniform_allowance" 
                    type="number" 
                    value={formData.shoe_uniform_allowance} 
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Deductions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">
                  Deductions
                  <div className="text-sm font-normal text-yellow-600 mt-1">
                    * PF amount capped at ₹1,800
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>PF (12% - Max ₹1,800)</Label>
                  <Input 
                    value={`₹${Math.round(formData.pf_12_percent)}`} 
                    readOnly 
                    className="bg-red-50 font-semibold"
                  />
                </div>
                <div>
                  <Label>ESI (0.75%)</Label>
                  <Input 
                    value={`₹${Math.round(formData.esi_0_75_percent)}`} 
                    readOnly 
                    className="bg-red-50 font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="rent_deduction">Rent Deduction</Label>
                  <Input 
                    id="rent_deduction" 
                    name="rent_deduction" 
                    type="number" 
                    value={formData.rent_deduction} 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="food">Food Deduction</Label>
                  <Input 
                    id="food" 
                    name="food" 
                    type="number" 
                    value={formData.food} 
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="uniform">Uniform Deduction</Label>
                  <Input 
                    id="uniform" 
                    name="uniform" 
                    type="number" 
                    value={formData.uniform} 
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Final Calculation */}
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="text-xl text-blue-600">Final Calculation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Total Deductions</Label>
                  <Input 
                    value={`₹${Math.round(formData.deductions)}`} 
                    readOnly 
                    className="bg-red-100 font-bold text-lg"
                  />
                </div>
                <div>
                  <Label>Take Home Pay</Label>
                  <Input 
                    value={`₹${Math.round(formData.take_home)}`} 
                    readOnly 
                    className="bg-blue-100 font-bold text-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createPayroll.isPending || updatePayroll.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createPayroll.isPending || updatePayroll.isPending 
                ? 'Saving...' 
                : payrollRecord ? 'Update Payroll' : 'Save Payroll'
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedPayrollCalculator;
