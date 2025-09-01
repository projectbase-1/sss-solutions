
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, DollarSign, TrendingUp, UserPlus, Calculator, FileText, Clock, UserCheck, Target } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useAttendanceStats } from '@/hooks/useAttendance';
import { useLeaveRequests } from '@/hooks/useLeaveRequests';
import { usePayroll } from '@/hooks/usePayroll';
import { useBranches } from '@/hooks/useBranches';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { data: employees = [] } = useEmployees();
  const { data: attendanceStats } = useAttendanceStats();
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: payrollRecords = [] } = usePayroll();
  const { data: branches = [] } = useBranches();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Calculate stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  
  const leaveStats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
  };

  const payrollStats = {
    totalPayroll: payrollRecords.reduce((sum, record) => sum + record.net_pay, 0),
    processedCount: payrollRecords.filter(r => r.status === 'processed').length,
    draftCount: payrollRecords.filter(r => r.status === 'draft').length,
    totalEmployees: employees.length,
  };

  const handleAddEmployee = () => {
    navigate('/employees');
  };

  const handleProcessPayroll = () => {
    toast({
      title: "Process Payroll",
      description: "Payroll processing has been initiated.",
    });
    navigate('/payroll');
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-employee':
        navigate('/employees');
        break;
      case 'mark-attendance':
        navigate('/attendance');
        break;
      case 'process-payroll':
        navigate('/payroll');
        break;
      case 'view-reports':
        navigate('/reports');
        break;
      default:
        toast({
          title: "Feature",
          description: "This feature will be available soon.",
        });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your team today.</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={handleAddEmployee} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
          <Button onClick={handleProcessPayroll} variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Employees</p>
                <p className="text-3xl font-bold text-blue-900">{totalEmployees}</p>
                <p className="text-sm text-blue-600">{activeEmployees} active</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Present Today</p>
                <p className="text-3xl font-bold text-green-900">{attendanceStats?.present || 0}</p>
                <p className="text-sm text-green-600">{attendanceStats?.presentPercentage || 0}% attendance</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Total Branches</p>
                <p className="text-3xl font-bold text-yellow-900">{branches?.length || 0}</p>
                <p className="text-sm text-yellow-600">Active branches</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Monthly Payroll</p>
                <p className="text-3xl font-bold text-purple-900">₹{payrollStats.totalPayroll.toLocaleString()}</p>
                <p className="text-sm text-purple-600">{payrollStats.processedCount} processed</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleQuickAction('add-employee')}
            >
              <UserPlus className="h-6 w-6" />
              <span className="text-xs">Add Employee</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleQuickAction('mark-attendance')}
            >
              <Clock className="h-6 w-6" />
              <span className="text-xs">Mark Attendance</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleQuickAction('process-payroll')}
            >
              <Calculator className="h-6 w-6" />
              <span className="text-xs">Process Payroll</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2"
              onClick={() => handleQuickAction('view-reports')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs">View Reports</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            {employees.slice(0, 5).length > 0 ? (
              <div className="space-y-4">
                {employees.slice(0, 5).map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                      </div>
                    </div>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No employees found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {leaveRequests.slice(0, 5).length > 0 ? (
              <div className="space-y-4">
                {leaveRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{request.employees?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{request.leave_type} - {request.days_count} days</p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        request.status === 'approved' ? 'default' : 
                        request.status === 'pending' ? 'secondary' : 'destructive'
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No leave requests found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
