
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import OTPVerification from '@/components/OTPVerification';
import BackupCodeVerification from '@/components/BackupCodeVerification';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

// Browser-compatible base32 decoder
const base32Decode = (encoded: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = [];
  
  for (let i = 0; i < encoded.length; i++) {
    const char = encoded[i].toUpperCase();
    const index = alphabet.indexOf(char);
    
    if (index === -1) continue;
    
    value = (value << 5) | index;
    bits += 5;
    
    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  
  return new Uint8Array(output);
};

// Browser-compatible HMAC-SHA1 implementation
const hmacSha1 = async (key: Uint8Array, message: Uint8Array): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
};

// Browser-compatible TOTP verification function
const verifyTOTP = async (token: string, secret: string): Promise<boolean> => {
  try {
    if (!token || token.length !== 6 || !secret) {
      return false;
    }

    const time = Math.floor(Date.now() / 1000 / 30); // 30-second window
    
    // Check current time window and adjacent windows for clock skew tolerance
    for (let i = -1; i <= 1; i++) {
      const timeStep = time + i;
      const timeBuffer = new ArrayBuffer(8);
      const timeView = new DataView(timeBuffer);
      timeView.setUint32(4, timeStep, false); // Big-endian
      
      const key = base32Decode(secret);
      const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));
      
      const offset = hmac[hmac.length - 1] & 0xf;
      const code = (
        ((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)
      ) % 1000000;
      
      const expectedToken = code.toString().padStart(6, '0');
      
      if (token === expectedToken) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
};

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsOTP, setNeedsOTP] = useState(false);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string; userId: string; totpSecret: string } | null>(null);
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const checkTwoFactorStatus = async (userId: string) => {
    try {
      const { data: settings, error } = await supabase
        .from('security_settings')
        .select('two_factor_enabled, two_factor_verified, totp_secret, two_factor_secret')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return {
        enabled: settings?.two_factor_enabled || false,
        verified: settings?.two_factor_verified || false,
        secret: settings?.totp_secret || settings?.two_factor_secret || null
      };
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return { enabled: false, verified: false, secret: null };
    }
  };

  const verifyCredentials = async (email: string, password: string) => {
    try {
      // Use a temporary session to verify credentials without fully signing in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Check if 2FA is enabled for this user
      const twoFactorStatus = await checkTwoFactorStatus(data.user.id);
      
      if (twoFactorStatus.enabled && twoFactorStatus.secret) {
        // Sign out immediately since we only wanted to verify credentials
        await supabase.auth.signOut();
        
        return { 
          success: true, 
          requires2FA: true, 
          userId: data.user.id,
          totpSecret: twoFactorStatus.secret
        };
      } else {
        // No 2FA required, user is already signed in and can proceed
        return { success: true, requires2FA: false };
      }
    } catch (error) {
      console.error('Error verifying credentials:', error);
      return { success: false, error: 'Authentication failed' };
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Verify email and password
      const credentialResult = await verifyCredentials(email, password);
      
      if (!credentialResult.success) {
        toast({
          title: "Error",
          description: credentialResult.error || "Invalid email or password",
          variant: "destructive",
        });
        return;
      }

      // Step 2: Handle 2FA if required
      if (credentialResult.requires2FA) {
        if (!otp || otp.length !== 6) {
          toast({
            title: 'Two-factor authentication required',
            description: 'Please enter the 6-digit code from your authenticator app.',
            variant: 'destructive'
          });
          return;
        }

        // Verify TOTP code
        const isValidTotp = await verifyTOTP(otp, credentialResult.totpSecret!);
        
        if (!isValidTotp) {
          toast({
            title: 'Invalid code',
            description: 'The authenticator code is incorrect. Please try again.',
            variant: 'destructive'
          });
          setOtp(''); // Clear the OTP field
          return;
        }

        // Store pending auth data for final sign-in
        setPendingAuth({
          email,
          password,
          userId: credentialResult.userId!,
          totpSecret: credentialResult.totpSecret!
        });
      }

      // Step 3: Complete the sign-in process
      const { error: finalSignInError } = await signIn(email, password);
      if (finalSignInError) {
        toast({
          title: "Error",
          description: finalSignInError.message,
          variant: "destructive",
        });
        return;
      }

      // If we had pending 2FA auth, mark it as verified
      if (pendingAuth) {
        await supabase
          .from('security_settings')
          .update({ two_factor_verified: true })
          .eq('user_id', pendingAuth.userId);
      }

      toast({
        title: 'Success',
        description: credentialResult.requires2FA 
          ? 'Successfully signed in with two-factor authentication.' 
          : 'Successfully signed in.',
      });

    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setPendingAuth(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success!",
          description: "Please check your email to confirm your account."
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerified = () => {
    setNeedsOTP(false);
    setShowBackupCode(false);
    // User will be redirected by the auth context
  };

  const handleShowBackupCode = () => {
    setShowBackupCode(true);
  };

  const handleBackToOTP = () => {
    setShowBackupCode(false);
  };

  if (needsOTP) {
    if (showBackupCode) {
      return <BackupCodeVerification onVerified={handleOTPVerified} onBack={handleBackToOTP} />;
    }
    return <OTPVerification onVerified={handleOTPVerified} onBackupCode={handleShowBackupCode} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SSS Solutions HRMS</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin" className="mx-0 px-[195px]">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-otp">Authenticator code (6 digits)</Label>
                  <div className="flex justify-start">
                    <InputOTP
                      id="signin-otp"
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
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
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
