
import React from 'react';
import { Clock, DollarSign, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportType {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ReportTypeSelectorProps {
  selectedReport: string;
  onReportChange: (reportId: string) => void;
}

const ReportTypeSelector = ({ selectedReport, onReportChange }: ReportTypeSelectorProps) => {
  const reportTypes: ReportType[] = [
    { id: 'attendance', name: 'Attendance Report', icon: Clock },
    { id: 'payroll', name: 'Payroll Report', icon: DollarSign },
    { id: 'leave', name: 'Leave Report', icon: Calendar },
    
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Report Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => onReportChange(report.id)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedReport === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Icon className={`h-8 w-8 ${
                    selectedReport === report.id ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  <span className={`font-medium ${
                    selectedReport === report.id ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {report.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportTypeSelector;
