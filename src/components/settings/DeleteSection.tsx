import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertTriangle, Trash, Lock } from 'lucide-react';
import { useBranches } from '@/hooks/useBranches';
import { useEmployees } from '@/hooks/useEmployees';
import { useDeleteBranch } from '@/hooks/useDeleteBranch';
import { useDeleteEmployee } from '@/hooks/useDeleteEmployee';
import { useToast } from '@/hooks/use-toast';
import type { Branch } from '@/hooks/useBranches';
import type { Employee } from '@/hooks/useEmployees';

const DeleteSection = () => {
  const { toast } = useToast();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<{
    type: 'branch' | 'employee';
    id: string;
    name: string;
  } | null>(null);

  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data: employees, isLoading: employeesLoading } = useEmployees(selectedBranch || undefined);
  const deleteBranchMutation = useDeleteBranch();
  const deleteEmployeeMutation = useDeleteEmployee();

  // Reset employee selection when branch changes
  useEffect(() => {
    setSelectedEmployee('');
  }, [selectedBranch]);

  const handleDeleteBranch = (branch: Branch) => {
    setPendingAction({
      type: 'branch',
      id: branch.id,
      name: branch.name
    });
    setShowPasswordModal(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setPendingAction({
      type: 'employee',
      id: employee.id,
      name: employee.name
    });
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    const correctPassword = "Santhosh@28";
    
    if (passwordInput === correctPassword) {
      setShowPasswordModal(false);
      setPasswordInput('');
      
      if (pendingAction) {
        if (pendingAction.type === 'branch') {
          deleteBranchMutation.mutate(pendingAction.id, {
            onSuccess: () => {
              setSelectedBranch('');
              setSelectedEmployee('');
            }
          });
        } else if (pendingAction.type === 'employee') {
          deleteEmployeeMutation.mutate(pendingAction.id, {
            onSuccess: () => {
              setSelectedEmployee('');
            }
          });
        }
      }
      
      setPendingAction(null);
    } else {
      toast({
        title: "Wrong Password",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      });
      setPasswordInput('');
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordInput('');
    setPendingAction(null);
  };

  const selectedBranchData = branches?.find(b => b.id === selectedBranch);
  const selectedEmployeeData = employees?.find(e => e.id === selectedEmployee);

  if (branchesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash className="h-5 w-5 text-destructive" />
            <span>Delete Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash className="h-5 w-5 text-destructive" />
            <span>Delete Data</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive">Warning</h4>
                <p className="text-sm text-destructive/80">
                  This action cannot be undone. Deleting branches or employees will permanently remove all associated data.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="branch-select">Select Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a branch to view/delete" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name} ({branch.employee_count || 0} employees)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBranch && selectedBranchData && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedBranchData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedBranchData.address} • {selectedBranchData.employee_count || 0} employees
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBranch(selectedBranchData)}
                    disabled={deleteBranchMutation.isPending}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Branch
                  </Button>
                </div>
              </div>
            )}

            {selectedBranch && (
              <div>
                <Label htmlFor="employee-select">Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Choose an employee to view/delete"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position} ({employee.employee_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedEmployee && selectedEmployeeData && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{selectedEmployeeData.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployeeData.position} • ID: {selectedEmployeeData.employee_id} • {selectedEmployeeData.email}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteEmployee(selectedEmployeeData)}
                    disabled={deleteEmployeeMutation.isPending}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    Delete Employee
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Confirmation Modal */}
      <Dialog open={showPasswordModal} onOpenChange={handlePasswordModalClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-destructive" />
              <span>Confirm Deletion</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-semibold text-destructive">Permanent Deletion</h4>
                  <p className="text-sm text-destructive/80">
                    You are about to permanently delete{' '}
                    <strong>{pendingAction?.type === 'branch' ? 'branch' : 'employee'}</strong>{' '}
                    "<strong>{pendingAction?.name}</strong>". This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="password">Enter Password to Confirm</Label>
              <Input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter your password"
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handlePasswordModalClose}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handlePasswordSubmit}
              disabled={!passwordInput || deleteBranchMutation.isPending || deleteEmployeeMutation.isPending}
            >
              {(deleteBranchMutation.isPending || deleteEmployeeMutation.isPending) ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeleteSection;