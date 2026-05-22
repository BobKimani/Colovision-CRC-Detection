import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useRouter, useAuth } from '../routes/Router';
import { TwoFactorService } from '../services/twoFactor';
import { AuthService } from '../services/auth';
import { Eye, Smartphone, Shield, RefreshCw } from 'lucide-react';

interface TwoFactorAuthProps {
  isSetup?: boolean; // true for initial setup, false for verification
}

export const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ isSetup = false }) => {
  const { navigate } = useRouter();
  const { user, setUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');

  useEffect(() => {
    if (!user?.email) {
      navigate('/login');
      return;
    }

    if (isSetup) {
      const setup = TwoFactorService.generateSetup(user.email);
      setQrCodeUrl(setup.qrCodeUrl);
      setSecretKey(setup.secretKey);
    }
  }, [isSetup, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!user?.email) {
      navigate('/login');
      return;
    }

    try {
      const result = await TwoFactorService.verifyCode(user.email, code, isSetup);
      
      if (result.isValid) {
        // Update user session
        const authenticatedSession = {
          ...user,
          isAuthenticated: true,
          needs2FASetup: false,
          needs2FAVerification: false
        };
        
        setUser(authenticatedSession);
        AuthService.saveSession(authenticatedSession);
        navigate('/detection');
      } else {
        setError(`Invalid verification code. ${result.remainingAttempts ? `${result.remainingAttempts} attempts remaining.` : ''}`);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-900">ColoVision</span>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          </div>
          <p className="text-gray-600">
            {isSetup 
              ? 'Set up 2FA to secure your account' 
              : 'Enter the verification code from your authenticator app'
            }
          </p>
        </div>

        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span>{isSetup ? 'Setup Authenticator' : 'Verify Code'}</span>
            </CardTitle>
            <CardDescription>
              {isSetup 
                ? 'Scan the QR code with your authenticator app'
                : 'Use Google Authenticator, Authy, or similar app'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isSetup && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-dashed border-blue-200 inline-block">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code for 2FA setup"
                      className="w-48 h-48"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Manual Entry Key</Label>
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={secretKey} 
                      readOnly 
                      className="bg-gray-50 border-blue-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(secretKey)}
                      className="border-blue-200"
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enter this key manually if you can't scan the QR code
                  </p>
                </div>

                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription className="text-sm">
                    <strong>Setup Instructions:</strong>
                    <br />1. Install Google Authenticator or Authy on your phone
                    <br />2. Scan the QR code or enter the key manually
                    <br />3. Enter the 6-digit code below to verify setup
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={handleInputChange}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest border-blue-200 focus:border-blue-400"
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-gray-500 text-center">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || code.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </div>
                ) : (
                  isSetup ? 'Complete Setup' : 'Verify Code'
                )}
              </Button>
            </form>

            {!isSetup && (
              <div className="text-center">
                <Button
                  variant="link"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => setError('In a real app, this would trigger backup code recovery')}
                >
                  Use backup code instead
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="outline" className="border-green-200 text-green-700">
              <Shield className="w-3 h-3 mr-1" />
              Bank-level Security
            </Badge>
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              <Smartphone className="w-3 h-3 mr-1" />
              Mobile Protected
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            {isSetup 
              ? 'This demo uses mock 2FA. In production, use proper TOTP libraries.'
              : 'For demo purposes, any 6-digit code will work (or use 123456)'
            }
          </p>
        </div>
      </div>
    </div>
  );
};