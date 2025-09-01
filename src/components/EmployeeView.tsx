import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Calendar, CreditCard, FileText, IndianRupee, Building, User, Clock, TrendingUp, Download, Eye } from 'lucide-react';
import { useEmployeeAttendanceStats } from '@/hooks/useEmployeeAttendance';
import { useEmployeeDocuments } from '@/hooks/useEmployeeDocuments';

interface EmployeeViewProps {
  employee: any;
  isOpen: boolean;
  onClose: () => void;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ employee, isOpen, onClose }) => {
  const { data: attendanceStats } = useEmployeeAttendanceStats(employee?.id);
  const { data: documents = [], refetch: refetchDocuments } = useEmployeeDocuments(employee?.id);

  // Refetch documents when the dialog opens
  React.useEffect(() => {
    if (isOpen && employee?.id) {
      console.log('Dialog opened, refetching documents for employee:', employee.id);
      refetchDocuments();
    }
  }, [isOpen, employee?.id, refetchDocuments]);

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={employee.avatar_url} />
              <AvatarFallback>
                {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{employee.name}</h2>
              <p className="text-muted-foreground">{employee.position}</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="personal" className="mt-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="salary">Salary</TabsTrigger>
            <TabsTrigger value="pf">PF Details</TabsTrigger>
            <TabsTrigger value="repo">Repo</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Basic Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{employee.email}</p>
                    </div>
                  </div>
                  
                  {employee.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{employee.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {employee.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{employee.location}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-medium">{new Date(employee.join_date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {employee.pan_card && (
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">PAN Card</p>
                        <p className="font-medium">{employee.pan_card}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Work Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Work Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Employee ID</p>
                    <p className="font-medium">{employee.employee_id}</p>
                  </div>
                  
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </div>

                  {employee.shift_code && (
                    <div>
                      <p className="text-sm text-muted-foreground">Shift Code</p>
                      <p className="font-medium">{employee.shift_code}</p>
                    </div>
                  )}

                  {employee.contract_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Name</p>
                      <p className="font-medium">{employee.contract_name}</p>
                    </div>
                  )}

                  {employee.mode_of_payment && (
                    <div>
                      <p className="text-sm text-muted-foreground">Payment Mode</p>
                      <p className="font-medium">{employee.mode_of_payment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            {employee.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{employee.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Employee Documents</span>
                  </div>
                  <Badge variant="secondary">{documents.length} Document{documents.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              <FileText className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate">{doc.document_name}</p>
                              {doc.document_type && (
                                <p className="text-sm text-gray-500">{doc.document_type}</p>
                              )}
                              {doc.uploaded_at && (
                                <p className="text-xs text-gray-400">
                                  Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                let documentUrl = doc.file_url;
                                if (!documentUrl.startsWith('http')) {
                                  documentUrl = `https://ohmaccfjhunxqsqluppc.supabase.co/storage/v1/object/public/employee-documents/${documentUrl}`;
                                }
                                window.open(documentUrl, '_blank');
                              }}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </button>
                            <a
                              href={
                                doc.file_url.startsWith('http') 
                                  ? doc.file_url 
                                  : `https://ohmaccfjhunxqsqluppc.supabase.co/storage/v1/object/public/employee-documents/${doc.file_url}`
                              }
                              download={doc.document_name}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
                    <p className="text-gray-500">Documents uploaded for this employee will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Bank Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.account_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Account Number</p>
                      <p className="font-medium">{employee.account_number}</p>
                    </div>
                  )}
                  {employee.bank_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bank Name</p>
                      <p className="font-medium">{employee.bank_name}</p>
                    </div>
                  )}
                  {employee.ifsc_code && (
                    <div>
                      <p className="text-sm text-muted-foreground">IFSC Code</p>
                      <p className="font-medium">{employee.ifsc_code}</p>
                    </div>
                  )}
                  {employee.branch_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Branch Name</p>
                      <p className="font-medium">{employee.branch_name}</p>
                    </div>
                  )}
                  {employee.transfer_mode && (
                    <div>
                      <p className="text-sm text-muted-foreground">Transfer Mode</p>
                      <p className="font-medium">{employee.transfer_mode}</p>
                    </div>
                  )}
                </div>
                {!employee.account_number && !employee.bank_name && (
                  <p className="text-muted-foreground">No bank details available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <IndianRupee className="h-5 w-5" />
                  <span>Salary Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Gross Salary</p>
                      <p className="font-medium">₹{employee.gross_salary?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Basic Salary</p>
                      <p className="font-medium">₹{employee.basic_salary?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">HRA</p>
                      <p className="font-medium">₹{employee.hra?.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">DA Amount</p>
                      <p className="font-medium">₹{employee.da_amount?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Conveyance</p>
                      <p className="font-medium">₹{employee.conveyance?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Other Allowances</p>
                      <p className="font-medium">₹{employee.other_allowances?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">OT Amount</p>
                      <p className="font-medium">₹{employee.ot_amount?.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tea Allowance</p>
                      <p className="font-medium">₹{employee.tea_allowance?.toLocaleString()}</p>
                    </div>
                  </div>

                  {employee.advance !== null && employee.advance !== undefined && employee.advance > 0 && (
                    <div className="flex items-center space-x-3">
                      <IndianRupee className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Advance</p>
                        <p className="font-medium">₹{employee.advance?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Eligibility</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={employee.overtime_eligible ? "default" : "secondary"}>
                        Overtime: {employee.overtime_eligible ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={employee.late_deduction_eligible ? "default" : "secondary"}>
                        Late Deduction: {employee.late_deduction_eligible ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={employee.pf_eligible ? "default" : "secondary"}>
                        PF: {employee.pf_eligible ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={employee.esi_eligible ? "default" : "secondary"}>
                        ESI: {employee.esi_eligible ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pf">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>PF & ESI Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {employee.pf_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">PF Number</p>
                      <p className="font-medium">{employee.pf_number}</p>
                    </div>
                  )}
                  {employee.esi_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">ESI Number</p>
                      <p className="font-medium">{employee.esi_number}</p>
                    </div>
                  )}
                  {employee.pf !== null && employee.pf !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">PF Amount</p>
                      <p className="font-medium">₹{employee.pf?.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {!employee.pf_number && !employee.esi_number && (
                  <p className="text-muted-foreground">No PF/ESI details available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repo">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Attendance Report (Current Month)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{attendanceStats.present_days}</div>
                      <div className="text-sm text-muted-foreground">Present Days</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{attendanceStats.absent_days}</div>
                      <div className="text-sm text-muted-foreground">Absent Days</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late_days}</div>
                      <div className="text-sm text-muted-foreground">Late Days</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{attendanceStats.ot_hours.toFixed(1)}</div>
                      <div className="text-sm text-muted-foreground">OT Hours</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading attendance data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeView;
