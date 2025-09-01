
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { useToast } from '@/hooks/use-toast';

const LeaveReport = () => {
  const { toast } = useToast();
  const { data: leaveRequests = [] } = useLeaveRequests();

  const leaveTypeData = [
    { type: 'Sick Leave', count: leaveRequests.filter(l => l.leave_type === 'sick').length, color: '#EF4444' },
    { type: 'Vacation', count: leaveRequests.filter(l => l.leave_type === 'vacation').length, color: '#3B82F6' },
    { type: 'Personal', count: leaveRequests.filter(l => l.leave_type === 'personal').length, color: '#10B981' },
    { type: 'Maternity', count: leaveRequests.filter(l => l.leave_type === 'maternity').length, color: '#F59E0B' },
  ].filter(type => type.count > 0);

  const monthlyData = [
    { month: 'Jan', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 0).length },
    { month: 'Feb', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 1).length },
    { month: 'Mar', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 2).length },
    { month: 'Apr', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 3).length },
    { month: 'May', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 4).length },
    { month: 'Jun', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 5).length },
    { month: 'Jul', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 6).length },
    { month: 'Aug', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 7).length },
    { month: 'Sep', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 8).length },
    { month: 'Oct', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 9).length },
    { month: 'Nov', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 10).length },
    { month: 'Dec', leaves: leaveRequests.filter(l => new Date(l.start_date).getMonth() === 11).length },
  ];

  const statusData = [
    { status: 'Approved', count: leaveRequests.filter(l => l.status === 'approved').length, color: '#10B981' },
    { status: 'Pending', count: leaveRequests.filter(l => l.status === 'pending').length, color: '#F59E0B' },
    { status: 'Rejected', count: leaveRequests.filter(l => l.status === 'rejected').length, color: '#EF4444' },
  ].filter(status => status.count > 0);

  const handleExportLeave = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Month,Employee,Leave Type,Start Date,End Date,Days,Status,Reason\n"
      + leaveRequests.map(record => 
        `${(record as any).month || 'N/A'},${(record as any).employees?.name || 'N/A'},${record.leave_type},${record.start_date},${record.end_date},${record.days_count},${record.status},${record.reason || 'N/A'}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `leave_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Leave report has been exported successfully.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Leave Analytics</h3>
        <Button onClick={handleExportLeave} variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests by Type</CardTitle>
          </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={leaveTypeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={150}
                paddingAngle={5}
                dataKey="count"
                label={({ type, count }) => `${type}: ${count}`}
              >
                {leaveTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, 'Requests']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={150}
                paddingAngle={5}
                dataKey="count"
                label={({ status, count }) => `${status}: ${count}`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [value, 'Requests']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Leave Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [value, 'Leave Requests']} />
              <Bar dataKey="leaves" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default LeaveReport;
