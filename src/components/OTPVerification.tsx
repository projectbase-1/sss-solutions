
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import { authenticator } from 'otplib';

interface OTPVerificationProps {
  onVerified: () => void;
  onBackupCode: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ onVerified, onBackupCode }) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code.",
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
        .select('two_factor_secret')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (!settings?.two_factor_secret) {
        throw new Error('No 2FA secret found');
      }

      const verified = authenticator.verify({
        token: otpCode,
        secret: settings.two_factor_secret,
      });

      if (!verified) {
        toast({
          title: "Error",
          description: "Invalid verification code. Please try again.",
          variant: "destructive",
        });
        setOtpCode('');
        return;
      }

      // Update verification status
      await supabase
        .from('security_settings')
        .update({ two_factor_verified: true })
        .eq('user_id', user.id);

      toast({
        title: "Success!",
        description: "Two-factor authentication verified.",
      });

      onVerified();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive",
      });
      setOtpCode('');
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
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the 6-digit code from Microsoft Authenticator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otpCode}
              onChange={setOtpCode}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button 
            onClick={handleVerifyOTP}
            disabled={otpCode.length !== 6 || loading}
            className="w-full"
          >
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={onBackupCode}
              className="text-sm"
            >
              Use backup code instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OTPVerification;
