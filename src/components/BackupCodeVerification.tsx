
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield } from 'lucide-react';

interface BackupCodeVerificationProps {
  onVerified: () => void;
  onBack: () => void;
}

const BackupCodeVerification: React.FC<BackupCodeVerificationProps> = ({ onVerified, onBack }) => {
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerifyBackupCode = async () => {
    if (!backupCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a backup code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: settings, error } = await supabase
        .from('security_settings')
        .select('two_factor_backup_codes')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!settings?.two_factor_backup_codes) {
        throw new Error('No backup codes found');
      }

      const codeIndex = settings.two_factor_backup_codes.indexOf(backupCode.toUpperCase());
      
      if (codeIndex === -1) {
        toast({
          title: "Error",
          description: "Invalid backup code. Please try again.",
          variant: "destructive",
        });
        setBackupCode('');
        return;
      }

      // Remove used backup code
      const updatedCodes = settings.two_factor_backup_codes.filter((_, index) => index !== codeIndex);

      await supabase
        .from('security_settings')
        .update({ 
          two_factor_backup_codes: updatedCodes,
          two_factor_verified: true 
        })
        .eq('user_id', user.id);

      toast({
        title: "Success!",
        description: "Backup code verified. This code has been used and is no longer valid.",
      });

      onVerified();
    } catch (error) {
      console.error('Error verifying backup code:', error);
      toast({
        title: "Error",
        description: "Failed to verify backup code. Please try again.",
        variant: "destructive",
      });
      setBackupCode('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle>Use Backup Code</CardTitle>
          <CardDescription>
            Enter one of your backup codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backup-code">Backup Code</Label>
            <Input
              id="backup-code"
              type="text"
              placeholder="Enter backup code"
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              className="font-mono"
            />
          </div>

          <Button 
            onClick={handleVerifyBackupCode}
            disabled={!backupCode.trim() || loading}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify Backup Code"}
          </Button>

          <Button
            variant="outline"
            onClick={onBack}
            className="w-full flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Authenticator Code</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupCodeVerification;
