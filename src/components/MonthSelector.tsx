
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ selectedMonth, onMonthChange }) => {
  // Start from August 2025
  const startDate = new Date(2025, 7, 1); // August is month 7 (0-based)
  const currentDate = new Date();
  
  // Generate months starting from August 2025
  const generateMonths = () => {
    const months = [];
    let date = new Date(startDate);
    
    // Continue until current date or add a reasonable number of months
    while (date <= currentDate || months.length < 60) { // Limit to 60 months (5 years)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      months.push({ value, label });
      
      // Move to next month
      date.setMonth(date.getMonth() + 1);
      
      // If we've reached current date, break
      if (date > currentDate) break;
    }
    
    return months;
  };

  const months = generateMonths();

  return (
    <Select value={selectedMonth} onValueChange={onMonthChange}>
      <SelectTrigger className="w-48">
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select Month" />
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

export default MonthSelector;
