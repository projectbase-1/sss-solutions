
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface ExportMonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  placeholder?: string;
}

const ExportMonthSelector: React.FC<ExportMonthSelectorProps> = ({ 
  selectedMonth, 
  onMonthChange, 
  placeholder = "Select Month" 
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 11 = December)
  
  // Generate months for current year and previous year, but only up to current month
  const generateMonths = () => {
    const months = [];
    
    // Previous year months (all 12 months)
    for (let month = 0; month < 12; month++) {
      const date = new Date(currentYear - 1, month, 1);
      const value = `${currentYear - 1}-${String(month + 1).padStart(2, '0')}`;
      const label = `${date.toLocaleString('default', { month: 'long' })} ${currentYear - 1}`;
      months.push({ value, label });
    }
    
    // Current year months (only up to current month, including current month)
    for (let month = 0; month <= currentMonth; month++) {
      const date = new Date(currentYear, month, 1);
      const value = `${currentYear}-${String(month + 1).padStart(2, '0')}`;
      const label = `${date.toLocaleString('default', { month: 'long' })} ${currentYear}`;
      months.push({ value, label });
    }
    
    return months.reverse(); // Show most recent months first
  };

  const months = generateMonths();

  return (
    <Select value={selectedMonth} onValueChange={onMonthChange}>
      <SelectTrigger className="w-48">
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {months.map(month => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ExportMonthSelector;
