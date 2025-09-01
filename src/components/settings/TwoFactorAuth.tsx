import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Copy, Check, RefreshCw, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';

interface SecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  two_factor_backup_codes: string[];
  two_factor_verified: boolean;
  totp_secret?: string;
  totp_confirmed: boolean;
}

// Browser-compatible secret generation using Web Crypto API
const generateBrowserSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
  const array = new Uint8Array(20); // 160 bits = 32 base32 chars
  crypto.getRandomValues(array);
  
  let secret = '';
  for (let i = 0; i < array.length; i++) {
    secret += chars[array[i] % chars.length];
  }
  return secret;
};

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

// Browser-compatible TOTP verification
const verifyTOTP = async (token: string, secret: string): Promise<boolean> => {
  try {
    const time = Math.floor(Date.now() / 1000 / 30); // 30-second window
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false); // Big-endian
    
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
    
    // Check current time window and adjacent windows for clock skew tolerance
    const tokenInt = parseInt(token);
    const expectedInt = parseInt(expectedToken);
    
    return tokenInt === expectedInt;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
};

const TwoFactorAuth = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [tempSecret, setTempSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEnabling, setIsEnabling] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState<'show' | 'disable' | null>(null);

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load security settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (useExistingSecret = false) => {
    setQrLoading(true);
    console.log('Starting QR code generation...');
    
    try {
      // Check for Web Crypto API support
      if (!window.crypto || !window.crypto.getRandomValues) {
        throw new Error('Web Crypto API not supported in this browser');
      }

      let secret: string;
      
      if (useExistingSecret && settings?.two_factor_secret) {
        secret = settings.two_factor_secret;
        console.log('Using existing secret for QR code');
      } else {
        // Generate new secret using browser-compatible method
        secret = generateBrowserSecret();
        console.log('Generated new secret for QR code');
        setTempSecret(secret);
        setIsEnabling(true);
      }
      
      const service = 'SSS Solutions HRMS';
      const account = user?.email || 'user';
      
      // Manually construct the TOTP URI
      const otpauth_url = `otpauth://totp/${encodeURIComponent(service)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(service)}`;
      
      console.log('Creating QR code with URL:', otpauth_url);
      
      const qrDataUrl = await QRCode.toDataURL(otpauth_url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('QR code generated successfully');
      setQrCodeUrl(qrDataUrl);
      setShowQRCode(true);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const handleShowQRCode = () => {
    setPendingAction('show');
    setShowPasswordModal(true);
  };

  const handleDisableRequest = () => {
    setPendingAction('disable');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    const correctPassword = "Santhosh@28";
    
    if (passwordInput === correctPassword) {
      setShowPasswordModal(false);
      setPasswordInput('');
      
      if (pendingAction === 'show') {
        console.log('Show QR Code button clicked', { is2FAEnabled: settings?.two_factor_enabled });
        
        if (settings?.two_factor_enabled) {
          // For existing 2FA users, show QR with existing secret
          generateQRCode(true);
        } else {
          // For new users, generate new secret
          generateQRCode(false);
        }
      } else if (pendingAction === 'disable') {
        handleDisable2FA();
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

  const handleEnable2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    if (!tempSecret) {
      toast({
        title: "Error",
        description: "No secret available. Please generate a new QR code.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Starting 2FA verification process...');
      
      // Verify the TOTP code using browser-compatible function
      const verified = await verifyTOTP(verificationCode, tempSecret);

      console.log('TOTP verification result:', verified);

      if (!verified) {
        toast({
          title: "Error",
          description: "Invalid verification code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('TOTP verified successfully, updating database...');

      // Generate backup codes
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );

      const settingsData = {
        user_id: user?.id,
        two_factor_enabled: true,
        two_factor_secret: tempSecret,
        two_factor_backup_codes: backupCodes,
        two_factor_verified: true,
        totp_secret: tempSecret,
        totp_confirmed: true,
      };

      console.log('Updating security settings with data:', { ...settingsData, two_factor_secret: '[HIDDEN]' });

      let dbError;
      
      if (settings?.id) {
        console.log('Updating existing settings record...');
        const { error } = await supabase
          .from('security_settings')
          .update(settingsData)
          .eq('id', settings.id);
        dbError = error;
      } else {
        console.log('Creating new settings record...');
        const { error } = await supabase
          .from('security_settings')
          .insert([settingsData]);
        dbError = error;
      }

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      console.log('Database updated successfully, refreshing settings...');
      
      // Refresh settings data
      await fetchSettings();
      
      // Reset form state
      setIsEnabling(false);
      setTempSecret('');
      setVerificationCode('');
      setQrCodeUrl('');
      setShowQRCode(false);
      setShowBackupCodes(true);

      toast({
        title: "Success!",
        description: "Two-factor authentication has been enabled.",
      });
      
      console.log('2FA setup completed successfully');
      
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      
      let errorMessage = "Failed to enable two-factor authentication.";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Failed to enable 2FA: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDisable2FA = async () => {
    if (!settings) return;

    try {
      const { error } = await supabase
        .from('security_settings')
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          two_factor_backup_codes: [],
          two_factor_verified: false,
          totp_secret: null,
          totp_confirmed: false,
        })
        .eq('id', settings.id);

      if (error) throw error;

      await fetchSettings();
      setShowBackupCodes(false);
      setShowQRCode(false);

      toast({
        title: "Success!",
        description: "Two-factor authentication has been disabled.",
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
    
    toast({
      title: "Copied!",
      description: "Backup code copied to clipboard.",
    });
  };

  const regenerateBackupCodes = async () => {
    if (!settings) return;

    try {
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substr(2, 8).toUpperCase()
      );

      const { error } = await supabase
        .from('security_settings')
        .update({ two_factor_backup_codes: backupCodes })
        .eq('id', settings.id);

      if (error) throw error;

      await fetchSettings();

      toast({
        title: "Success!",
        description: "New backup codes generated.",
      });
    } catch (error) {
      console.error('Error regenerating backup codes:', error);
      toast({
        title: "Error", 
        description: "Failed to regenerate backup codes.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Two-Factor Authentication</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const is2FAEnabled = settings?.two_factor_enabled || false;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Two-Factor Authentication</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">Enable Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account with Microsoft Authenticator
              </p>
            </div>
            
            {!showQRCode && (
              <Button 
                onClick={handleShowQRCode}
                disabled={qrLoading}
                className="w-full flex items-center space-x-2"
              >
                <QrCode className="h-4 w-4" />
                <span>
                  {qrLoading 
                    ? 'Generating QR Code...' 
                    : (is2FAEnabled ? 'Show QR Code' : 'Generate QR Code')
                  }
                </span>
              </Button>
            )}

            {is2FAEnabled && !isEnabling && showQRCode && (
              <Button 
                onClick={handleDisableRequest}
                variant="destructive"
                className="w-full"
              >
                Disable Two-Factor Authentication
              </Button>
            )}
          </div>

          {showQRCode && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-semibold">
                {isEnabling ? 'Set up Two-Factor Authentication' : 'QR Code for Microsoft Authenticator'}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    1. Install Microsoft Authenticator on your mobile device
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    2. Scan the QR code below with Microsoft Authenticator
                  </p>
                </div>

                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <img src={qrCodeUrl} alt="QR Code for Microsoft Authenticator" className="w-64 h-64" />
                    </div>
                  </div>
                )}

                {qrLoading && (
                  <div className="flex justify-center py-8">
                    <div className="text-sm text-gray-600">Generating QR code...</div>
                  </div>
                )}

                {isEnabling && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 mb-3">
                        3. Enter the 6-digit code from Microsoft Authenticator
                      </p>
                      <div className="flex justify-center">
                        <InputOTP
                          maxLength={6}
                          value={verificationCode}
                          onChange={setVerificationCode}
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

                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleEnable2FA}
                        disabled={verificationCode.length !== 6}
                      >
                        Verify & Enable
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEnabling(false);
                          setTempSecret('');
                          setVerificationCode('');
                          setQrCodeUrl('');
                          setShowQRCode(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}

                {is2FAEnabled && showQRCode && !isEnabling && (
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setQrCodeUrl('');
                        setShowQRCode(false);
                      }}
                    >
                      Hide QR Code
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Codes Section - Always shown at bottom when 2FA is enabled */}
      {is2FAEnabled && settings?.two_factor_backup_codes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Backup Codes</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBackupCodes(!showBackupCodes)}
              >
                {showBackupCodes ? 'Hide' : 'Show'} Codes
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
            </p>

            {showBackupCodes && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {settings.two_factor_backup_codes.map((code, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-100 rounded">
                      <code className="flex-1 font-mono text-sm">{code}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(code, index)}
                        className="h-6 w-6 p-0"
                      >
                        {copiedCodeIndex === index ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={regenerateBackupCodes}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Generate New Codes</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Enter Password</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePasswordModalClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Please enter your password to {pendingAction === 'show' ? 'view the QR code' : 'disable two-factor authentication'}.
              </p>
              
              <Input
                type="password"
                placeholder="Enter password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                className="w-full"
              />
              
              <div className="flex space-x-2 justify-end">
                <Button
                  variant="outline"
                  onClick={handlePasswordModalClose}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordSubmit}
                  disabled={!passwordInput}
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;
