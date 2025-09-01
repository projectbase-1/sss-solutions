import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DocumentUpload from './DocumentUpload';

interface EmployeeFormProps {
  employee?: any;
  onSuccess?: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    // Basic Details
    employee_id: employee?.employee_id || '',
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    position: employee?.position || '',
    location: employee?.location || '',
    fathers_name: employee?.fathers_name || '',
    date_of_birth: employee?.date_of_birth || '',
    join_date: employee?.join_date || '',
    notes: employee?.notes || '',
    aadhar_card: employee?.pan_card || '',
    document_url: employee?.document_url || '',
    branch_id: employee?.branch_id || '',
    // Bank Details
    account_number: employee?.account_number || '',
    bank_name: employee?.bank_name || '',
    ifsc_code: employee?.ifsc_code || '',
    branch_name: employee?.branch_name || '',
    transfer_mode: employee?.transfer_mode || '',
    // Salary Information - FIXED STRUCTURE
    days: employee?.days || 26,
    per_day_salary: employee?.day_rate || employee?.basic_salary || 0, // Use day_rate if available, fallback to basic_salary for existing records
    gross_salary: employee?.gross_salary || 0,
    basic_salary: employee?.basic_salary || 0, // This will now be 60% of per_day_salary
    basic_salary_percentage: employee?.basic_salary_percentage || 60,
    da_percentage: employee?.da_percentage || 40,
    da_amount: employee?.da_amount || 0, // This will now be 40% of per_day_salary
    da_rate: employee?.da_rate || 0,
    day_rate: employee?.day_rate || 0,
    hra: employee?.hra || 0,
    conveyance: employee?.conveyance || 0,
    allowances: employee?.allowances || 0,
    other_allowances: employee?.other_allowances || 0,
    ot_amount: employee?.ot_amount || 0,
    tea_allowance: employee?.tea_allowance || 0,
    rent_deduction: employee?.rent_deduction || 0,
    shoe_uniform_allowance: employee?.shoe_uniform_allowance || 0,
    pf: employee?.pf || 0,
    advance: employee?.advance || 0,
    // PF Details
    pf_number: employee?.pf_number || '',
    esi_number: employee?.esi_number || '',
    // Eligibility Master
    overtime_eligible: employee?.overtime_eligible || false,
    late_deduction_eligible: employee?.late_deduction_eligible || false,
    pf_eligible: employee?.pf_eligible || false,
    esi_eligible: employee?.esi_eligible || false,
    // Other Office Info
    shift_code: employee?.shift_code || '',
    contract_name: employee?.contract_name || '',
    mode_of_payment: employee?.mode_of_payment || '',
    row_number: employee?.row_number || null,
    is_driver: employee?.is_driver || false
  });

  // Auto-calculate basic salary and DA when per_day_salary changes
  useEffect(() => {
    if (formData.per_day_salary > 0) {
      const perDaySalary = formData.per_day_salary;
      const basicSalary = Math.round(perDaySalary * 0.6); // 60% of per day salary
      const daAmount = Math.round(perDaySalary * 0.4); // 40% of per day salary
      
      setFormData(prev => ({
        ...prev,
        basic_salary: basicSalary,
        da_amount: daAmount,
        day_rate: perDaySalary // Keep day_rate in sync
      }));
    }
  }, [formData.per_day_salary]);

  // Auto-calculate gross salary when per_day_salary or days change
  useEffect(() => {
    const perDaySalary = formData.per_day_salary || 0;
    const days = formData.days || 26;
    const grossSalary = perDaySalary * days;
    
    setFormData(prev => ({
      ...prev,
      gross_salary: grossSalary
    }));
  }, [formData.per_day_salary, formData.days]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [employeeIdStatus, setEmployeeIdStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [employeeIdMessage, setEmployeeIdMessage] = useState('');
  const {
    data: branches = []
  } = useBranches();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const {
    toast
  } = useToast();
  const isEditing = Boolean(employee);

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('Full Name is required');
    }
    if (!formData.position.trim()) {
      errors.push('Position is required');
    }
    if (!formData.join_date) {
      errors.push('Join Date is required');
    }
    if (!formData.branch_id) {
      errors.push('Branch selection is required');
    }
    if (formData.per_day_salary < 0) {
      errors.push('Per Day Salary cannot be negative');
    }
    if (formData.hra < 0) {
      errors.push('HRA cannot be negative');
    }
    if (formData.allowances < 0) {
      errors.push('Allowances cannot be negative');
    }
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    const numericFields = ['per_day_salary', 'basic_salary', 'hra', 'allowances', 'pf', 'advance', 'gross_salary', 'basic_salary_percentage', 'da_percentage', 'da_amount', 'conveyance', 'other_allowances', 'ot_amount', 'tea_allowance', 'row_number', 'days', 'da_rate', 'day_rate', 'rent_deduction', 'shoe_uniform_allowance'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numericFields.includes(name) ? (value === '' ? 0 : Number(value)) : value
    }));

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation errors when user makes selection
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        document_url: file.name
      }));
    }
  };

  const validateAadharCard = async (aadharCard: string): Promise<boolean> => {
    if (!aadharCard || aadharCard.trim() === '') return true;
    try {
      const {
        data,
        error
      } = await supabase.from('employees').select('id, branch_id').eq('pan_card', aadharCard.trim());
      if (error) {
        console.error('Error validating Aadhar card:', error);
        return true;
      }
      if (data && data.length > 0) {
        if (employee?.id) {
          return data.filter(emp => emp.id !== employee.id).length === 0;
        }
        // Allow same Aadhar in different branches
        const samebranchEmployees = data.filter(emp => emp.branch_id === formData.branch_id);
        return samebranchEmployees.length === 0;
      }
      return true;
    } catch (error) {
      console.error('Error validating Aadhar card:', error);
      return true;
    }
  };

  const validatePfNumber = async (pfNumber: string): Promise<boolean> => {
    if (!pfNumber || pfNumber.trim() === '' || pfNumber.trim().toLowerCase() === 'error') return true;
    try {
      const {
        data,
        error
      } = await supabase.from('employees').select('id, branch_id').eq('pf_number', pfNumber.trim());
      if (error) {
        console.error('Error validating PF number:', error);
        return true;
      }
      if (data && data.length > 0) {
        if (employee?.id) {
          return data.filter(emp => emp.id !== employee.id).length === 0;
        }
        // Allow same PF number in different branches
        const samebranchEmployees = data.filter(emp => emp.branch_id === formData.branch_id);
        return samebranchEmployees.length === 0;
      }
      return true;
    } catch (error) {
      console.error('Error validating PF number:', error);
      return true;
    }
  };

  const validateEsiNumber = async (esiNumber: string): Promise<boolean> => {
    if (!esiNumber || esiNumber.trim() === '' || esiNumber.trim().toLowerCase() === 'error') return true;
    try {
      const {
        data,
        error
      } = await supabase.from('employees').select('id, branch_id').eq('esi_number', esiNumber.trim());
      if (error) {
        console.error('Error validating ESI number:', error);
        return true;
      }
      if (data && data.length > 0) {
        if (employee?.id) {
          return data.filter(emp => emp.id !== employee.id).length === 0;
        }
        // Allow same ESI number in different branches
        const samebranchEmployees = data.filter(emp => emp.branch_id === formData.branch_id);
        return samebranchEmployees.length === 0;
      }
      return true;
    } catch (error) {
      console.error('Error validating ESI number:', error);
      return true;
    }
  };

  // Real-time employee ID availability check
  const checkEmployeeIdAvailability = async (employeeId: string, branchId: string) => {
    if (!employeeId.trim() || !branchId) {
      setEmployeeIdStatus('idle');
      setEmployeeIdMessage('');
      return;
    }

    setEmployeeIdStatus('checking');
    setEmployeeIdMessage('Checking availability...');

    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, employee_id, name, branches(name)')
        .eq('branch_id', branchId)
        .ilike('employee_id', employeeId.trim());

      if (error) {
        console.error('Error checking employee ID:', error);
        setEmployeeIdStatus('idle');
        setEmployeeIdMessage('');
        return;
      }

      // Filter out current employee if editing
      const existingEmployee = data?.find(emp => 
        emp.id !== employee?.id && 
        emp.employee_id?.toLowerCase() === employeeId.trim().toLowerCase()
      );

      if (existingEmployee) {
        setEmployeeIdStatus('taken');
        setEmployeeIdMessage(`ID already exists for ${existingEmployee.name} in this branch`);
      } else {
        setEmployeeIdStatus('available');
        setEmployeeIdMessage('ID available');
      }
    } catch (error) {
      console.error('Error checking employee ID:', error);
      setEmployeeIdStatus('idle');
      setEmployeeIdMessage('');
    }
  };

  // Debounced employee ID check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.employee_id && formData.branch_id) {
        checkEmployeeIdAvailability(formData.employee_id, formData.branch_id);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.employee_id, formData.branch_id, employee?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(', '),
        variant: "destructive"
      });
      return;
    }

    // Check employee ID availability before submitting
    if (formData.employee_id.trim() && employeeIdStatus === 'taken') {
      toast({
        title: "Employee ID Taken",
        description: "This employee ID is already in use. Please choose a different one.",
        variant: "destructive"
      });
      return;
    }

    // Validate unique fields
    if (formData.aadhar_card && formData.aadhar_card.trim() !== '') {
      const isAadharValid = await validateAadharCard(formData.aadhar_card);
      if (!isAadharValid) {
        toast({
          title: "Error",
          description: "Aadhar card number already exists. Please enter a different Aadhar card number.",
          variant: "destructive"
        });
        return;
      }
    }
    if (formData.pf_number && formData.pf_number.trim() !== '' && formData.pf_number.trim().toLowerCase() !== 'error') {
      const isPfValid = await validatePfNumber(formData.pf_number);
      if (!isPfValid) {
        toast({
          title: "Error",
          description: "PF number already exists. Please enter a different PF number.",
          variant: "destructive"
        });
        return;
      }
    }
    if (formData.esi_number && formData.esi_number.trim() !== '' && formData.esi_number.trim().toLowerCase() !== 'error') {
      const isEsiValid = await validateEsiNumber(formData.esi_number);
      if (!isEsiValid) {
        toast({
          title: "Error",
          description: "ESI number already exists. Please enter a different ESI number.",
          variant: "destructive"
        });
        return;
      }
    }
    try {
      const cleanFormData = {
        ...formData,
        employee_id: formData.employee_id.trim() || null,
        pan_card: formData.aadhar_card.trim() || null,
        notes: formData.notes.trim() || null,
        document_url: formData.document_url.trim() || null,
        phone: formData.phone.trim() || null,
        location: formData.location.trim() || null,
        pf_number: formData.pf_number.trim() || null,
        esi_number: formData.esi_number.trim() || null,
        account_number: formData.account_number.trim() || null,
        bank_name: formData.bank_name.trim() || null,
        ifsc_code: formData.ifsc_code.trim() || null,
        branch_name: formData.branch_name.trim() || null,
        transfer_mode: formData.transfer_mode.trim() || null,
        shift_code: formData.shift_code.trim() || null,
        contract_name: formData.contract_name.trim() || null,
        mode_of_payment: formData.mode_of_payment.trim() || null,
        row_number: formData.row_number || null,
        fathers_name: formData.fathers_name?.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        aadhar_card: formData.aadhar_card.trim() || null,
        // Store per_day_salary in day_rate field for database compatibility
        day_rate: formData.per_day_salary
      };
      if (isEditing) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          employee: cleanFormData
        });
      } else {
        await createEmployee.mutateAsync({
          ...cleanFormData,
          department: '',
          status: 'active',
          avatar_url: null,
          branch_id: formData.branch_id || null
        });
      }
      if (onSuccess) onSuccess();
      if (!isEditing) {
        // Reset form with new default values
        setFormData({
          employee_id: '',
          name: '',
          email: '',
          phone: '',
          position: '',
          location: '',
          fathers_name: '',
          date_of_birth: '',
          join_date: '',
          notes: '',
          aadhar_card: '',
          document_url: '',
          branch_id: '',
          account_number: '',
          bank_name: '',
          ifsc_code: '',
          branch_name: '',
          transfer_mode: '',
          days: 26,
          per_day_salary: 0,
          gross_salary: 0,
          basic_salary: 0,
          basic_salary_percentage: 60,
          da_percentage: 40,
          da_amount: 0,
          da_rate: 0,
          day_rate: 0,
          hra: 0,
          conveyance: 0,
          allowances: 0,
          other_allowances: 0,
          ot_amount: 0,
          tea_allowance: 0,
          rent_deduction: 0,
          shoe_uniform_allowance: 0,
          pf: 0,
          advance: 0,
          pf_number: '',
          esi_number: '',
          overtime_eligible: false,
          late_deduction_eligible: false,
          pf_eligible: false,
          esi_eligible: false,
          shift_code: '',
          contract_name: '',
          mode_of_payment: '',
          row_number: null,
          is_driver: false
        });
        setValidationErrors([]);
      }
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  return <form onSubmit={handleSubmit} className="space-y-6">
      {/* Show validation errors */}
      {validationErrors.length > 0 && <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {validationErrors.map((error, index) => <li key={index}>• {error}</li>)}
          </ul>
        </div>}

      {/* Basic Employee Details */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Employee Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input 
                id="employee_id" 
                name="employee_id" 
                value={formData.employee_id} 
                onChange={handleInputChange} 
                className={`${validationErrors.some(e => e.includes('Employee ID')) ? 'border-red-500' : ''} ${
                  employeeIdStatus === 'taken' ? 'border-red-500' : 
                  employeeIdStatus === 'available' ? 'border-green-500' : ''
                }`} 
              />
              {employeeIdMessage && (
                <p className={`text-sm mt-1 ${
                  employeeIdStatus === 'checking' ? 'text-blue-600' :
                  employeeIdStatus === 'available' ? 'text-green-600' :
                  employeeIdStatus === 'taken' ? 'text-red-600' : ''
                }`}>
                  {employeeIdStatus === 'checking' && '⏳ '}
                  {employeeIdStatus === 'available' && '✓ '}
                  {employeeIdStatus === 'taken' && '✗ '}
                  {employeeIdMessage}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className={validationErrors.some(e => e.includes('Full Name')) ? 'border-red-500' : ''} />
            </div>
            <div>
              <Label htmlFor="fathers_name">Father's Name</Label>
              <Input id="fathers_name" name="fathers_name" type="text" value={formData.fathers_name} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="position">Designation *</Label>
              <Input id="position" name="position" value={formData.position} onChange={handleInputChange} required className={validationErrors.some(e => e.includes('Position')) ? 'border-red-500' : ''} />
            </div>
            <div>
              <Label htmlFor="branch_id">Branch *</Label>
              <Select value={formData.branch_id} onValueChange={value => handleSelectChange('branch_id', value)}>
                <SelectTrigger className={validationErrors.some(e => e.includes('Branch')) ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleInputChange} />
            </div>
            {/* Driver checkbox - only show if selected branch has driver enabled */}
            {formData.branch_id && branches.find(b => b.id === formData.branch_id)?.driver_enabled && (
              <div className="md:col-span-3">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_driver"
                    checked={formData.is_driver}
                    onCheckedChange={(checked) => handleCheckboxChange('is_driver', checked as boolean)}
                  />
                  <Label htmlFor="is_driver" className="text-sm font-medium">Is Driver</Label>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input id="date_of_birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="join_date">Join Date *</Label>
              <Input id="join_date" name="join_date" type="date" value={formData.join_date} onChange={handleInputChange} required className={validationErrors.some(e => e.includes('Join Date')) ? 'border-red-500' : ''} />
            </div>
            <div>
              <Label htmlFor="aadhar_card">Aadhar Card Number</Label>
              <Input id="aadhar_card" name="aadhar_card" value={formData.aadhar_card} onChange={handleInputChange} maxLength={12} />
            </div>
          </div>
          
          <div className="mt-6">
            <DocumentUpload employeeId={employee?.id} />
          </div>
          
          <div className="mt-4">
            <Label htmlFor="notes">Notes (Narration)</Label>
            <Textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Enter any additional notes or remarks..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <CardTitle>Bank Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="account_number">A/C No</Label>
              <Input id="account_number" name="account_number" value={formData.account_number} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input id="bank_name" name="bank_name" value={formData.bank_name} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="ifsc_code">IFSC Code</Label>
              <Input id="ifsc_code" name="ifsc_code" value={formData.ifsc_code} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="branch_name">Branch Name</Label>
              <Input id="branch_name" name="branch_name" value={formData.branch_name} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="transfer_mode">Transfer Mode</Label>
              <Select value={formData.transfer_mode || 'none'} onValueChange={value => handleSelectChange('transfer_mode', value === 'none' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Transfer Mode" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  <SelectItem value="none">Select Transfer Mode</SelectItem>
                  <SelectItem value="NEFT">NEFT</SelectItem>
                  <SelectItem value="RTGS">RTGS</SelectItem>
                  <SelectItem value="IMPS">IMPS</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Salary Information - CORRECTED STRUCTURE */}
      <Card>
        <CardHeader>
          <CardTitle>Salary Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="days">Days</Label>
              <Input id="days" name="days" type="number" value={formData.days} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" min="1" max="31" />
            </div>
            <div>
              <Label htmlFor="gross_salary">Gross Salary (Per Day × Days)</Label>
              <Input 
                id="gross_salary" 
                name="gross_salary" 
                type="number" 
                value={formData.gross_salary} 
                className="bg-green-50 font-semibold [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" 
                readOnly 
              />
            </div>
            <div>
              <Label htmlFor="per_day_salary">Per Day Salary *</Label>
              <Input 
                id="per_day_salary" 
                name="per_day_salary" 
                type="number" 
                value={formData.per_day_salary} 
                onChange={handleInputChange} 
                required 
                className={`[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${validationErrors.some(e => e.includes('Per Day Salary')) ? 'border-red-500' : ''}`} 
                placeholder="Enter per day salary amount"
              />
            </div>
            <div>
              <Label htmlFor="basic_salary">Basic Salary (60% of Per Day)</Label>
              <Input 
                id="basic_salary" 
                name="basic_salary" 
                type="number" 
                value={formData.basic_salary} 
                className="bg-blue-50 font-semibold [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" 
                readOnly 
              />
            </div>
            <div>
              <Label htmlFor="basic_salary_percentage">Basic Salary %</Label>
              <Input id="basic_salary_percentage" name="basic_salary_percentage" type="number" value={formData.basic_salary_percentage} readOnly className="bg-gray-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
            <div>
              <Label htmlFor="da_percentage">D.A %</Label>
              <Input id="da_percentage" name="da_percentage" type="number" value={formData.da_percentage} readOnly className="bg-gray-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
            <div>
              <Label htmlFor="da_amount">D.A Amount (40% of Per Day)</Label>
              <Input 
                id="da_amount" 
                name="da_amount" 
                type="number" 
                value={formData.da_amount} 
                className="bg-orange-50 font-semibold [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" 
                readOnly 
              />
            </div>
            <div>
              <Label htmlFor="da_rate">D.A Rate</Label>
              <Input id="da_rate" name="da_rate" type="number" value={formData.da_rate} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
            <div>
              <Label htmlFor="day_rate">Day Rate (Mirror of Per Day Salary)</Label>
              <Input id="day_rate" name="day_rate" type="number" value={formData.day_rate} className="bg-gray-50 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" readOnly />
            </div>
            <div>
              <Label htmlFor="hra">HRA</Label>
              <Input id="hra" name="hra" type="number" value={formData.hra} onChange={handleInputChange} className={`[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield] ${validationErrors.some(e => e.includes('HRA')) ? 'border-red-500' : ''}`} />
            </div>
            <div>
              <Label htmlFor="conveyance">Conveyance</Label>
              <Input id="conveyance" name="conveyance" type="number" value={formData.conveyance} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
            <div>
              <Label htmlFor="rent_deduction">Rent Deduction</Label>
              <Input id="rent_deduction" name="rent_deduction" type="number" value={formData.rent_deduction} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
            <div>
              <Label htmlFor="shoe_uniform_allowance">Shoe & Uniform Allowance</Label>
              <Input id="shoe_uniform_allowance" name="shoe_uniform_allowance" type="number" value={formData.shoe_uniform_allowance} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
            <div>
              <Label htmlFor="pf">PF (Provident Fund)</Label>
              <Input id="pf" name="pf" type="number" value={formData.pf} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
            <div>
              <Label htmlFor="advance">Advance</Label>
              <Input id="advance" name="advance" type="number" value={formData.advance} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PF Details */}
      <Card>
        <CardHeader>
          <CardTitle>PF Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pf_number">PF No.</Label>
              <div className="flex gap-2">
                <Input 
                  id="pf_number" 
                  name="pf_number" 
                  value={formData.pf_number} 
                  onChange={handleInputChange} 
                  placeholder="Enter PF number or 'Error' if not available"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, pf_number: 'Error' }))}
                >
                  Set Error
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="esi_number">ESI No.</Label>
              <div className="flex gap-2">
                <Input 
                  id="esi_number" 
                  name="esi_number" 
                  value={formData.esi_number} 
                  onChange={handleInputChange}
                  placeholder="Enter ESI number or 'Error' if not available"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, esi_number: 'Error' }))}
                >
                  Set Error
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Office Information */}
      <Card>
        <CardHeader>
          <CardTitle>Office Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Eligibility Master */}
            <div>
              <h4 className="text-lg font-medium mb-4">Eligibility Master</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox id="overtime_eligible" checked={formData.overtime_eligible} onCheckedChange={checked => handleCheckboxChange('overtime_eligible', checked as boolean)} />
                  <Label htmlFor="overtime_eligible">Overtime</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="late_deduction_eligible" checked={formData.late_deduction_eligible} onCheckedChange={checked => handleCheckboxChange('late_deduction_eligible', checked as boolean)} />
                  <Label htmlFor="late_deduction_eligible">Late Deduction</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="pf_eligible" checked={formData.pf_eligible} onCheckedChange={checked => handleCheckboxChange('pf_eligible', checked as boolean)} />
                  <Label htmlFor="pf_eligible">PF Eligible</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="esi_eligible" checked={formData.esi_eligible} onCheckedChange={checked => handleCheckboxChange('esi_eligible', checked as boolean)} />
                  <Label htmlFor="esi_eligible">ESI Eligible</Label>
                </div>
              </div>
            </div>

            {/* Other Office Info */}
            <div>
              <h4 className="text-lg font-medium mb-4">Other Office Info</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="shift_code">Shift Code</Label>
                  <Input id="shift_code" name="shift_code" value={formData.shift_code} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="contract_name">Contract Name</Label>
                  <Input id="contract_name" name="contract_name" value={formData.contract_name} onChange={handleInputChange} />
                </div>
                <div>
                  <Label htmlFor="mode_of_payment">Mode of Payment</Label>
                  <Select value={formData.mode_of_payment} onValueChange={value => handleSelectChange('mode_of_payment', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mode of Payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK">Bank</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="row_number">Row</Label>
                  <Input id="row_number" name="row_number" type="number" value={formData.row_number || ''} onChange={handleInputChange} className="[&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createEmployee.isPending || updateEmployee.isPending}>
          {createEmployee.isPending || updateEmployee.isPending ? isEditing ? 'Updating...' : 'Creating...' : isEditing ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>;
};
export default EmployeeForm;
