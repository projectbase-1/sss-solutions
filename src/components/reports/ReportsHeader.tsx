
import React from 'react';
import { Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReportsHeader = () => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      <div className="flex space-x-4">
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default ReportsHeader;
