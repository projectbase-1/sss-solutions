import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

interface DocumentUploadProps {
  employeeId?: string;
  onDocumentsChange?: (documents: Document[]) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ employeeId, onDocumentsChange }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    type: '',
    file: null as File | null
  });
  const { toast } = useToast();

  // Fetch existing documents when employeeId is available
  useEffect(() => {
    if (employeeId) {
      fetchDocuments();
    }
  }, [employeeId]);

  const fetchDocuments = async () => {
    if (!employeeId) return;
    
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', employeeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setDocuments(data || []);
      onDocumentsChange?.(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleAddDocument = async () => {
    if (!newDocument.name.trim() || !newDocument.file) {
      toast({
        title: "Error",
        description: "Please provide document name and select a file.",
        variant: "destructive"
      });
      return;
    }

    if (!employeeId) {
      // If no employeeId, add to local state (for new employees)
      const tempDocument: Document = {
        id: `temp-${Date.now()}`,
        document_name: newDocument.name,
        document_type: newDocument.type || 'Other',
        file_url: newDocument.file.name,
        uploaded_at: new Date().toISOString()
      };
      
      const updatedDocuments = [...documents, tempDocument];
      setDocuments(updatedDocuments);
      onDocumentsChange?.(updatedDocuments);
      
      setNewDocument({ name: '', type: '', file: null });
      setShowAddDialog(false);
      
      toast({
        title: "Success",
        description: "Document added successfully."
      });
      return;
    }

    try {
      // Upload file to Supabase storage
      const fileExt = newDocument.file.name.split('.').pop();
      const fileName = `${employeeId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, newDocument.file);

      if (uploadError) throw uploadError;

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(fileName);

      // Save document record to database with the full public URL
      const { data, error } = await supabase
        .from('employee_documents')
        .insert([{
          employee_id: employeeId,
          document_name: newDocument.name,
          document_type: newDocument.type || 'Other',
          file_url: publicUrl
        }])
        .select()
        .single();

      if (error) throw error;

      const updatedDocuments = [...documents, data];
      setDocuments(updatedDocuments);
      onDocumentsChange?.(updatedDocuments);
      
      setNewDocument({ name: '', type: '', file: null });
      setShowAddDialog(false);
      
      toast({
        title: "Success",
        description: "Document uploaded successfully."
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (documentId.startsWith('temp-')) {
      // Remove from local state for temporary documents
      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsChange?.(updatedDocuments);
      return;
    }

    try {
      // Get the document to find the file path
      const documentToDelete = documents.find(doc => doc.id === documentId);
      
      if (documentToDelete) {
        // Extract file path from URL and delete from storage
        const urlParts = documentToDelete.file_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const employeeFolder = urlParts[urlParts.length - 2];
        const filePath = `${employeeFolder}/${fileName}`;
        
        await supabase.storage
          .from('employee-documents')
          .remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('employee_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      const updatedDocuments = documents.filter(doc => doc.id !== documentId);
      setDocuments(updatedDocuments);
      onDocumentsChange?.(updatedDocuments);
      
      toast({
        title: "Success",
        description: "Document deleted successfully."
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Document Upload</CardTitle>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="doc_name">Document Name *</Label>
                <Input
                  id="doc_name"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Passport, Aadhar Card, Resume"
                />
              </div>
              <div>
                <Label htmlFor="doc_type">Document Type</Label>
                <Input
                  id="doc_type"
                  value={newDocument.type}
                  onChange={(e) => setNewDocument(prev => ({ ...prev, type: e.target.value }))}
                  placeholder="e.g., Identity Proof, Educational"
                />
              </div>
              <div>
                <Label htmlFor="doc_file">Select File *</Label>
                <Input
                  id="doc_file"
                  type="file"
                  onChange={(e) => setNewDocument(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDocument}>
                  Add Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No documents uploaded yet.</p>
          ) : (
            documents.map((document) => (
              <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{document.document_name}</p>
                    <p className="text-xs text-gray-500">
                      {document.document_type} • {new Date(document.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteDocument(document.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;