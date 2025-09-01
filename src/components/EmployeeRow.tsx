import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TableCell, TableRow } from '@/components/ui/table';
import { Phone, MapPin, Edit, Eye } from 'lucide-react';
import OTPaymentDialog from '@/components/OTPaymentDialog';

interface EmployeeRowProps {
  employee: any;
  attendanceStats: any;
  onEditClick: (employee: any) => void;
  onViewClick: (employee: any) => void;
}

const EmployeeRow = memo(({ employee, attendanceStats, onEditClick, onViewClick }: EmployeeRowProps) => {
  const stats = attendanceStats[employee.id] || {};
  
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.avatar_url} />
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
              {employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{employee.name}</div>
            <div className="text-sm text-gray-500">{employee.email}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium">{employee.employee_id}</TableCell>
      <TableCell>{employee.position}</TableCell>
      <TableCell>
        {employee.branches && (
          <Badge variant="secondary" className="text-xs">
            {employee.branches.name}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {employee.phone && (
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3 text-gray-400" />
              <span className="text-sm">{employee.phone}</span>
            </div>
          )}
          {employee.location && (
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span className="text-sm">{employee.location}</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>{new Date(employee.join_date).toLocaleDateString()}</TableCell>
      <TableCell>
        <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
          {employee.status}
        </Badge>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm font-semibold text-green-600">
          {stats.present_days || 0}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm font-semibold text-red-600">
          {stats.absent_days || 0}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm font-semibold text-yellow-600">
          {stats.late_days || 0}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="text-sm font-semibold text-blue-600">
          {stats.ot_hours?.toFixed(1) || '0.0'}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onViewClick(employee)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEditClick(employee)}>
            <Edit className="h-4 w-4" />
          </Button>
          <OTPaymentDialog employee={{
            id: employee.id,
            name: employee.name,
            employee_id: employee.employee_id,
            basic_salary: employee.basic_salary
          }} />
        </div>
      </TableCell>
    </TableRow>
  );
});

EmployeeRow.displayName = 'EmployeeRow';

export default EmployeeRow;