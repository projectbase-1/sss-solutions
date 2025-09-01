import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, Download, Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MetricCard from '@/components/MetricCard';
import { useLeaveRequests, useLeaveStats, useUpdateLeaveStatus, useCreateLeaveRequest } from '@/hooks/useLeaveRequests';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/hooks/use-toast';

const Leave = () => {
  const { data: leaveRequests = [] } = useLeaveRequests();
  const { data: leaveStats } = useLeaveStats();
  const { data: employees = [] } = useEmployees();
  const { toast } = useToast();
  const updateLeaveStatus = useUpdateLeaveStatus();
  const createLeaveRequest = useCreateLeaveRequest();
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    leave_type: 'sick' as 'annual' | 'sick' | 'casual' | 'vacation' | 'personal' | 'maternity',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const filteredRequests = leaveRequests.filter(request => {
    if (statusFilter === 'all') return true;
    return request.status === statusFilter;
  });

  const handleApplyLeave = async () => {
    try {
      if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      const startDate = new Date(leaveForm.start_date);
      const endDate = new Date(leaveForm.end_date);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      
      const selectedEmployee = employees.find(emp => emp.id === leaveForm.employee_id);

      await createLeaveRequest.mutateAsync({
        employee_id: leaveForm.employee_id,
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.end_date,
        days_count: daysDiff,
        reason: leaveForm.reason,
        status: 'pending',
      });

      toast({
        title: "Leave Applied",
        description: `Leave request for ${selectedEmployee?.name} has been submitted successfully.`,
      });

      setShowApplyLeave(false);
      setLeaveForm({
        employee_id: '',
        leave_type: 'sick',
        start_date: '',
        end_date: '',
        reason: ''
      });
    } catch (error) {
      console.error('Error applying leave:', error);
      toast({
        title: "Error",
        description: "Failed to apply leave. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleApproveLeave = async (id: string) => {
    try {
      await updateLeaveStatus.mutateAsync({ id, status: 'approved' });
      toast({
        title: "Leave Approved",
        description: "Leave request has been approved successfully.",
      });
    } catch (error) {
      console.error('Error approving leave:', error);
      toast({
        title: "Error",
        description: "Failed to approve leave. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectLeave = async (id: string) => {
    try {
      await updateLeaveStatus.mutateAsync({ id, status: 'rejected' });
      toast({
        title: "Leave Rejected",
        description: "Leave request has been rejected.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error rejecting leave:', error);
      toast({
        title: "Error",
        description: "Failed to reject leave. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee ID,Employee Name,Leave Type,Start Date,End Date,Days,Reason,Status,Applied Date\n"
      + filteredRequests.map(request => {
        const employee = employees.find(emp => emp.id === request.employee_id);
        return `${employee?.employee_id || ''},${employee?.name || ''},${request.leave_type},${request.start_date},${request.end_date},${request.days_count},${request.reason || ''},${request.status},${new Date(request.created_at).toLocaleDateString()}`;
      }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leave_requests_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Leave requests data has been exported to CSV file.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
        <div className="flex space-x-4">
          <Button onClick={handleExport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={showApplyLeave} onOpenChange={setShowApplyLeave}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Apply Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply Leave</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employee">Employee</Label>
                  <Select value={leaveForm.employee_id} onValueChange={(value) => setLeaveForm({...leaveForm, employee_id: value})}>
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
                  <Label htmlFor="leave_type">Leave Type</Label>
                  <Select value={leaveForm.leave_type} onValueChange={(value: 'annual' | 'sick' | 'casual' | 'vacation' | 'personal' | 'maternity') => setLeaveForm({...leaveForm, leave_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      type="date"
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      type="date"
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    placeholder="Reason for leave..."
                  />
                </div>
                <Button onClick={handleApplyLeave} className="w-full">
                  Apply Leave
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Requests"
          value={leaveStats?.total || 0}
          icon={Calendar}
          change="+5 this month"
          changeType="increase"
          color="blue"
        />
        <MetricCard
          title="Pending"
          value={leaveStats?.pending || 0}
          icon={Clock}
          change="+2 from last week"
          changeType="increase"
          color="yellow"
        />
        <MetricCard
          title="Approved"
          value={leaveStats?.approved || 0}
          icon={CheckCircle}
          change="+8 this month"
          changeType="increase"
          color="green"
        />
        <MetricCard
          title="Rejected"
          value={leaveStats?.rejected || 0}
          icon={XCircle}
          change="Same as last month"
          changeType="neutral"
          color="red"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Leave Requests</CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const employee = employees.find(emp => emp.id === request.employee_id);
              return (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {employee?.name?.split(' ').map(n => n[0]).join('') || '??'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold">{employee?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-600 capitalize">{request.leave_type} Leave</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">{request.days_count} days</p>
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleApproveLeave(request.id)}
                          disabled={updateLeaveStatus.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRejectLeave(request.id)}
                          disabled={updateLeaveStatus.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No leave requests found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leave;
