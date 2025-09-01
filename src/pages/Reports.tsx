
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ReportsMetrics from '@/components/reports/ReportsMetrics';
import ReportTypeSelector from '@/components/reports/ReportTypeSelector';
import AttendanceReport from '@/components/reports/AttendanceReport';
import PayrollReport from '@/components/reports/PayrollReport';
import LeaveReport from '@/components/reports/LeaveReport';
import ExportDialog from '@/components/ExportDialog';

import { useToast } from '@/hooks/use-toast';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('attendance');
  const [showFilters, setShowFilters] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [dateRange, setDateRange] = useState('last_month');
  
  const { toast } = useToast();

  // Fetch real data for reports
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          employees (name)
        `);
      if (error) throw error;
      return data;
    }
  });

  const { data: payroll = [] } = useQuery({
    queryKey: ['payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employees (name)
        `);
      if (error) throw error;
      return data;
    }
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employees!leave_requests_employee_id_fkey (name)
        `);
      if (error) throw error;
      return data;
    }
  });

  const handleExport = (month: string, format: 'excel' | 'pdf') => {
    let filteredData: any[] = [];
    let headers: string[] = [];
    let filename = "";
    let reportTitle = "";
    
    switch (selectedReport) {
      case 'attendance':
        filteredData = attendance.filter(record => {
          const recordDate = new Date(record.date);
          const recordMonth = recordDate.toISOString().slice(0, 7);
          return recordMonth === month;
        });
        headers = ["Month", "Employee", "Date", "Status", "Check In", "Check Out"];
        filename = "attendance_report";
        reportTitle = "Attendance Report";
        break;
        
      case 'payroll':
        filteredData = payroll.filter(record => {
          if (record.month) {
            return record.month === month;
          }
          const payPeriodDate = new Date(record.pay_period_start);
          const recordMonth = payPeriodDate.toISOString().slice(0, 7);
          return recordMonth === month;
        });
        headers = ["Month", "Employee", "Basic Salary", "HRA", "Allowances", "Gross Pay", "Deductions", "Net Pay", "Status"];
        filename = "payroll_report";
        reportTitle = "Payroll Report";
        break;
        
      case 'leave':
        filteredData = leaveRequests.filter(record => {
          const startDate = new Date(record.start_date);
          const recordMonth = startDate.toISOString().slice(0, 7);
          return recordMonth === month;
        });
        headers = ["Month", "Employee", "Leave Type", "Start Date", "End Date", "Days", "Status", "Reason"];
        filename = "leave_report";
        reportTitle = "Leave Report";
        break;
        
      default:
        toast({
          title: "Error",
          description: "Invalid report type selected.",
          variant: "destructive",
        });
        return;
    }
    
    if (filteredData.length === 0) {
      toast({
        title: "No Data Found",
        description: `No ${selectedReport} data found for ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}.`,
        variant: "destructive",
      });
      return;
    }

    if (format === 'excel') {
      const XLSX = (window as any).XLSX;
      if (!XLSX) {
        // Dynamically import XLSX
        import('xlsx').then((XLSXModule) => {
          const workbook = XLSXModule.utils.book_new();
          
          let worksheetData: any[][] = [];
          worksheetData.push(headers);
          
          filteredData.forEach(record => {
            let row: any[] = [];
            switch (selectedReport) {
              case 'attendance':
                row = [
                  new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' }),
                  record.employees?.name || 'N/A',
                  record.date,
                  record.status,
                  record.check_in_time || 'N/A',
                  record.check_out_time || 'N/A'
                ];
                break;
              case 'payroll':
                row = [
                  new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' }),
                  record.employees?.name || 'N/A',
                  record.basic_salary,
                  record.hra,
                  record.allowances,
                  record.gross_pay,
                  record.deductions,
                  record.net_pay,
                  record.status
                ];
                break;
              case 'leave':
                row = [
                  new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' }),
                  record.employees?.name || 'N/A',
                  record.leave_type,
                  record.start_date,
                  record.end_date,
                  record.days_count,
                  record.status,
                  record.reason || 'N/A'
                ];
                break;
            }
            worksheetData.push(row);
          });
          
          const worksheet = XLSXModule.utils.aoa_to_sheet(worksheetData);
          XLSXModule.utils.book_append_sheet(workbook, worksheet, reportTitle);
          XLSXModule.writeFile(workbook, `${filename}_${month}.xlsx`);
          
          toast({
            title: "Export Successful",
            description: `${reportTitle} for ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })} has been exported successfully.`,
          });
        });
      }
    } else if (format === 'pdf') {
      const jsPDF = (window as any).jsPDF;
      if (!jsPDF) {
        // Dynamically import jsPDF
        import('jspdf').then(async (jsPDFModule) => {
          const doc = new jsPDFModule.default();
          
          // Add title
          doc.setFontSize(16);
          doc.text(reportTitle, 20, 20);
          doc.setFontSize(12);
          doc.text(`Month: ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 20, 30);
          
          // Add table headers
          let yPosition = 50;
          doc.setFontSize(10);
          
          // Calculate column width
          const pageWidth = doc.internal.pageSize.width;
          const colWidth = (pageWidth - 40) / headers.length;
          
          // Headers
          headers.forEach((header, index) => {
            doc.text(header, 20 + (index * colWidth), yPosition);
          });
          yPosition += 10;
          
          // Data rows
          filteredData.forEach(record => {
            let row: any[] = [];
            switch (selectedReport) {
              case 'attendance':
                row = [
                  new Date(month).toLocaleString('default', { month: 'short' }),
                  record.employees?.name || 'N/A',
                  record.date,
                  record.status,
                  record.check_in_time || 'N/A',
                  record.check_out_time || 'N/A'
                ];
                break;
              case 'payroll':
                row = [
                  new Date(month).toLocaleString('default', { month: 'short' }),
                  record.employees?.name || 'N/A',
                  record.basic_salary,
                  record.hra,
                  record.allowances,
                  record.gross_pay,
                  record.deductions,
                  record.net_pay,
                  record.status
                ];
                break;
              case 'leave':
                row = [
                  new Date(month).toLocaleString('default', { month: 'short' }),
                  record.employees?.name || 'N/A',
                  record.leave_type,
                  record.start_date,
                  record.end_date,
                  record.days_count,
                  record.status,
                  record.reason || 'N/A'
                ];
                break;
            }
            
            row.forEach((cell, index) => {
              const cellText = String(cell).substring(0, 15); // Truncate long text
              doc.text(cellText, 20 + (index * colWidth), yPosition);
            });
            yPosition += 8;
            
            // Add new page if needed
            if (yPosition > 280) {
              doc.addPage();
              yPosition = 20;
            }
          });
          
          doc.save(`${filename}_${month}.pdf`);
          
          toast({
            title: "Export Successful",
            description: `${reportTitle} for ${new Date(month).toLocaleString('default', { month: 'long', year: 'numeric' })} has been exported successfully.`,
          });
        });
      }
    }
  };

  const applyFilters = () => {
    setShowFilters(false);
    toast({
      title: "Filters Applied",
      description: `Showing ${selectedReport} data for ${dateRange}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-4">
          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report Filters</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_week">Last Week</SelectItem>
                      <SelectItem value="last_month">Last Month</SelectItem>
                      <SelectItem value="last_quarter">Last Quarter</SelectItem>
                      <SelectItem value="last_year">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={applyFilters} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowExportDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <ReportsMetrics />
      <ReportTypeSelector 
        selectedReport={selectedReport} 
        onReportChange={setSelectedReport} 
      />

      <Tabs value={selectedReport} onValueChange={setSelectedReport} className="space-y-4">
        <TabsContent value="attendance" className="space-y-4">
          <AttendanceReport />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <PayrollReport />
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <LeaveReport />
        </TabsContent>
      </Tabs>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
        title="Export Reports"
        description="Select month and format to export report data"
      />
    </div>
  );
};

export default Reports;
