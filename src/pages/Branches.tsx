
import React, { useState } from 'react';
import { Building2, Plus, Edit, MapPin, Phone, Mail, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBranches, useCreateBranch, useUpdateBranch, type Branch } from '@/hooks/useBranches';

interface BranchFormProps {
  formData: {
    name: string;
    address: string;
    phone: string;
    email: string;
    manager: string;
    status: 'active' | 'inactive';
    ot_rate: number;
    driver_enabled: boolean;
    driver_rate: number;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  isEditing: boolean;
}

const BranchForm = React.memo(({ formData, onInputChange, onSubmit, isEditing }: BranchFormProps) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="name">Branch Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
          required
          autoComplete="off"
        />
      </div>
      <div>
        <Label htmlFor="manager">Branch Manager</Label>
        <Input
          id="manager"
          name="manager"
          value={formData.manager}
          onChange={onInputChange}
          required
          autoComplete="off"
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          required
          autoComplete="off"
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={onInputChange}
          required
          autoComplete="off"
        />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={onInputChange}
          placeholder="Enter complete branch address..."
          rows={3}
          required
        />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={onInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div>
        <Label htmlFor="ot_rate">OT Rate (per hour)</Label>
        <Input
          id="ot_rate"
          name="ot_rate"
          type="number"
          step="0.01"
          value={formData.ot_rate}
          onChange={onInputChange}
          placeholder="Enter OT rate per hour..."
          required
        />
      </div>
      <div className="md:col-span-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="driver_enabled"
            name="driver_enabled"
            checked={formData.driver_enabled}
            onChange={onInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <Label htmlFor="driver_enabled" className="text-sm">Add Driver</Label>
        </div>
        {formData.driver_enabled && (
          <div className="mt-3">
            <Label htmlFor="driver_rate">Driver Rate (per hour)</Label>
            <Input
              id="driver_rate"
              name="driver_rate"
              type="number"
              step="0.01"
              value={formData.driver_rate}
              onChange={onInputChange}
              placeholder="Enter driver rate per hour..."
              required={formData.driver_enabled}
            />
          </div>
        )}
      </div>
    </div>
    <div className="flex justify-end space-x-3 pt-4">
      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
        {isEditing ? 'Update Branch' : 'Create Branch'}
      </Button>
    </div>
  </form>
));

const Branches = () => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  const { data: branches = [], isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    status: 'active' as 'active' | 'inactive',
    ot_rate: 60,
    driver_enabled: false,
    driver_rate: 60
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              (name === 'ot_rate' || name === 'driver_rate') ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBranch) {
      await updateBranch.mutateAsync({
        id: editingBranch.id,
        updates: formData
      });
      setShowEditDialog(false);
      setEditingBranch(null);
    } else {
      await createBranch.mutateAsync(formData);
      setShowAddDialog(false);
    }

    // Reset form
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      status: 'active',
      ot_rate: 60,
      driver_enabled: false,
      driver_rate: 60
    });
  };

  const handleEditClick = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      status: branch.status as 'active' | 'inactive',
      ot_rate: branch.ot_rate || 60,
      driver_enabled: branch.driver_enabled || false,
      driver_rate: branch.driver_rate || 60
    });
    setShowEditDialog(true);
  };

  if (isLoading) {
    return <div className="p-4">Loading branches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Branch</DialogTitle>
            </DialogHeader>
            <BranchForm
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <Card key={branch.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{branch.name}</h3>
                  <p className="text-sm text-gray-600">{branch.manager}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditClick(branch)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <span className="text-sm">{branch.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{branch.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{branch.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{branch.employee_count || 0} employees</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    branch.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {branch.status}
                  </span>
                  <div className="text-sm text-gray-600">
                    OT Rate: ₹{branch.ot_rate || 60}/hr
                    {branch.driver_enabled && (
                      <span className="block">Driver Rate: ₹{branch.driver_rate || 60}/hr</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
          </DialogHeader>
          <BranchForm
            formData={formData}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Branches;
