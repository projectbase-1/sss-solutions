import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface SelectAllCheckboxProps {
  filteredEmployees: any[];
  selectedEmployees: string[];
  selectedPaymentType: string;
  branchFilter: string;
  onSelectAll: () => void;
  onRemoveEmployee: (employeeId: string) => void;
  selectedEmployeesData: any[];
}

const SelectAllCheckbox: React.FC<SelectAllCheckboxProps> = ({
  filteredEmployees,
  selectedEmployees,
  selectedPaymentType,
  branchFilter,
  onSelectAll,
  onRemoveEmployee,
  selectedEmployeesData
}) => {
  const allSelected = filteredEmployees.length > 0 && 
    filteredEmployees.every(emp => selectedEmployees.includes(emp.id));

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="select-all"
          checked={allSelected}
          onCheckedChange={onSelectAll}
          disabled={filteredEmployees.length === 0}
        />
        <label htmlFor="select-all" className="text-sm cursor-pointer">
          Select All ({filteredEmployees.length} employees)
          {selectedPaymentType && selectedPaymentType !== 'all' && (
            <span className="text-muted-foreground ml-1">
              with {selectedPaymentType.toLowerCase()} payment
            </span>
          )}
        </label>
      </div>

      {selectedEmployees.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Selected Employees ({selectedEmployees.length}):</label>
          <div className="flex flex-wrap gap-2">
            {selectedEmployeesData.map((employee) => (
              <Badge key={employee.id} variant="secondary" className="flex items-center gap-1">
                {employee.name}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => onRemoveEmployee(employee.id)}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectAllCheckbox;