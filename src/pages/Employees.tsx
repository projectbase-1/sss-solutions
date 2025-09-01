import React, { useState, useMemo, memo } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useBranches } from '@/hooks/useBranches';
import { useAllEmployeesAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, Plus, Edit, Mail, Phone, MapPin, Calendar, Eye } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import EmployeeForm from '@/components/EmployeeForm';
import EmployeeView from '@/components/EmployeeView';
import EmployeeRow from '@/components/EmployeeRow';
import EmployeeExcelExport from '@/components/EmployeeExcelExport';

const Employees = memo(() => {
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('all');
  const {
    data: employees = [],
    refetch
  } = useEmployees(selectedBranchFilter === 'all' ? undefined : selectedBranchFilter);
  const {
    data: branches = []
  } = useBranches();
  const {
    data: attendanceStats = {}
  } = useAllEmployeesAttendanceStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const handleAddSuccess = () => {
    setShowAddDialog(false);
    refetch();
  };
  const handleEditSuccess = () => {
    setShowEditDialog(false);
    setEditingEmployee(null);
    refetch();
  };
  const handleEditClick = (employee: any) => {
    setEditingEmployee(employee);
    setShowEditDialog(true);
  };
  const handleViewClick = (employee: any) => {
    setViewingEmployee(employee);
    setShowViewDialog(true);
  };
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = employee.name.toLowerCase().includes(searchLower) || 
                           employee.email.toLowerCase().includes(searchLower) || 
                           employee.employee_id.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, searchTerm, statusFilter]);
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <div className="flex gap-2">
          <EmployeeExcelExport />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 overflow-hidden">
              <DialogHeader className="px-6 py-4 border-b bg-white">
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <ScrollArea className="flex-1 h-full">
                <div className="px-6 py-4">
                  <EmployeeForm onSuccess={handleAddSuccess} />
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Search employees..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 lg:flex-shrink-0">
          <Select value={selectedBranchFilter} onValueChange={setSelectedBranchFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map(branch => <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>)}
            </SelectContent>
          </Select>


          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showFilters} onOpenChange={setShowFilters}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Advanced Filters</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Position</label>
                  <Input placeholder="Filter by position..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Input placeholder="Filter by location..." />
                </div>
                <div>
                  <label className="text-sm font-medium">Joining Date Range</label>
                  <div className="flex gap-2">
                    <Input type="date" />
                    <Input type="date" />
                  </div>
                </div>
                <Button onClick={() => setShowFilters(false)} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Attendance Summary (This Month)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Present</TableHead>
                <TableHead className="text-center">Absent</TableHead>
                <TableHead className="text-center">Late</TableHead>
                <TableHead className="text-center">OT Hours</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map(employee => (
                <EmployeeRow
                  key={employee.id}
                  employee={employee}
                  attendanceStats={attendanceStats}
                  onEditClick={handleEditClick}
                  onViewClick={handleViewClick}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b bg-white">
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 h-full">
            <div className="px-6 py-4">
              <EmployeeForm employee={editingEmployee} onSuccess={handleEditSuccess} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <EmployeeView employee={viewingEmployee} isOpen={showViewDialog} onClose={() => setShowViewDialog(false)} />
    </div>;
});

Employees.displayName = 'Employees';

export default Employees;