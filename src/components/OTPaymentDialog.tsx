
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePayroll, useUpdatePayroll } from '@/hooks/usePayroll';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBranches } from '@/hooks/useBranches';

interface OTPaymentDialogProps {
  employee: {
    id: string;
    name: string;
    employee_id: string;
    basic_salary: number;
    gross_salary?: number;
    branch_id?: string;
  };
}

const OTPaymentDialog = ({ employee }: OTPaymentDialogProps) => {
  const [otAmount, setOtAmount] = useState('');
  const [otHours, setOtHours] = useState('');
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const createPayroll = useCreatePayroll();
  const updatePayroll = useUpdatePayroll();
  const { toast } = useToast();
  const { data: branches = [] } = useBranches();

  const handleAddOTPayment = async () => {
    if (!otHours || parseFloat(otHours) <= 0) {
      toast({
        title: "Invalid Hours",
        description: "Please enter valid OT hours.",
        variant: "destructive",
      });
      return;
    }
    
    if (!otAmount || parseFloat(otAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid OT amount.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      
      const payPeriodStart = startOfMonth.toISOString().split('T')[0];
      const payPeriodEnd = endOfMonth.toISOString().split('T')[0];
      const monthString = `${selectedYear}-${selectedMonth}`;

      // Check if payroll record exists for this employee and period
      const { data: existingPayroll } = await supabase
        .from('payroll')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('pay_period_start', payPeriodStart)
        .eq('pay_period_end', payPeriodEnd)
        .maybeSingle();

      const otAmountNum = parseFloat(otAmount);
      const otHoursNum = parseFloat(otHours) || 0;

      // Add OT hours to attendance record for selected period
      await supabase
        .from('attendance')
        .insert([{
          employee_id: employee.id,
          date: new Date().toISOString().split('T')[0],
           month: monthString,
          status: 'present',
          notes: JSON.stringify({
            present_days: 0,
            absent_days: 0,
            late_days: 0,
            ot_hours: otHoursNum,
            custom_notes: `OT payment of ₹${otAmountNum} for ${otHoursNum} hours added via employee card`
          })
        }]);

      if (existingPayroll) {
        // Update existing payroll record with OT
        const currentOtAmount = existingPayroll.ot_amount || 0;
        const newOtAmount = currentOtAmount + otAmountNum;
        const newGrossPay = existingPayroll.gross_pay + otAmountNum;
        const newNetPay = existingPayroll.net_pay + otAmountNum;

        await updatePayroll.mutateAsync({
          id: existingPayroll.id,
          updates: {
            ot_amount: newOtAmount,
            gross_pay: newGrossPay,
            net_pay: newNetPay,
            updated_at: new Date().toISOString(),
          },
        });
      } else {
        // Create new payroll record with OT
        const grossSalary = Number(employee.gross_salary) || (Number(employee.basic_salary) * 30) || 0; // Use monthly gross salary or calculate from per-day
        const grossPay = grossSalary + otAmountNum;
        const deductions = Math.round(grossSalary * 0.1875); // Standard deductions
        const netPay = grossPay - deductions;

        await supabase
          .from('payroll')
          .insert([{
            employee_id: employee.id,
            pay_period_start: payPeriodStart,
            pay_period_end: payPeriodEnd,
            month: monthString,
            basic_salary: employee.basic_salary,
            hra: 0,
            allowances: 0,
            ot_amount: otAmountNum,
            deductions: deductions,
            gross_pay: grossPay,
            net_pay: netPay,
            status: 'draft',
          }]);
      }

      toast({
        title: "OT Payment Added",
        description: `₹${otAmountNum.toLocaleString()} OT payment added for ${employee.name}`,
      });

      setOtAmount('');
      setOtHours('');
      setSelectedMonth((new Date().getMonth() + 1).toString().padStart(2, '0'));
      setSelectedYear(new Date().getFullYear().toString());
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding OT payment:', error);
      toast({
        title: "Error",
        description: "Failed to add OT payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-orange-600 border-orange-600 hover:bg-orange-50"
        >
          <Clock className="h-4 w-4 mr-1" />
          OT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add OT Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Employee</Label>
            <p className="text-sm text-gray-900">{employee.name} ({employee.employee_id})</p>
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700">
              Month & Year
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthValue = (i + 1).toString().padStart(2, '0');
                    const monthLabel = new Date(2023, i, 1).toLocaleDateString('default', { month: 'long' });
                    return (
                      <SelectItem key={monthValue} value={monthValue}>
                        {monthLabel}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="ot-hours" className="text-sm font-medium text-gray-700">
              OT Hours
            </Label>
            <Input
              id="ot-hours"
              type="number"
              step="0.5"
              placeholder="Enter OT hours"
              value={otHours}
              onChange={(e) => {
                const hours = e.target.value;
                setOtHours(hours);
                // Auto-calculate amount using branch OT rate
                if (hours) {
                  const branch = branches.find(b => b.id === employee.branch_id);
                  const otRate = (branch as any)?.ot_rate || 60;
                  setOtAmount((parseFloat(hours) * otRate).toString());
                } else {
                  setOtAmount('');
                }
              }}
              required
            />
            <div className="text-sm text-muted-foreground mt-1">
              {(() => {
                const branch = branches.find(b => b.id === employee.branch_id);
                const otRate = (branch as any)?.ot_rate || 60;
                return `Rate: ₹${otRate} per hour`;
              })()}
            </div>
          </div>

          <div>
            <Label htmlFor="ot-amount" className="text-sm font-medium text-gray-700">
              OT Amount (₹) - Auto-calculated
            </Label>
            <Input
              id="ot-amount"
              type="number"
              step="0.01"
              placeholder="Amount will be calculated automatically"
              value={otAmount}
              onChange={(e) => setOtAmount(e.target.value)}
              readOnly={!!otHours}
            />
            <div className="text-sm text-muted-foreground mt-1">
              {otHours && (() => {
                const branch = branches.find(b => b.id === employee.branch_id);
                const otRate = (branch as any)?.ot_rate || 60;
                return `${otHours} hours × ₹${otRate} = ₹${(parseFloat(otHours || '0') * otRate).toLocaleString()}`;
              })()}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddOTPayment}
              disabled={isProcessing || !otAmount}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? 'Adding...' : 'Add OT Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OTPaymentDialog;
