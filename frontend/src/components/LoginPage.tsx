import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { useRouter, useAuth } from '../routes/Router';
import { AuthService } from '../services/auth';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate } = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!AuthService.validateCredentials(email, password)) {
        setError('Please enter valid email and password');
        return;
      }

      const session = await AuthService.login({ email, password });
      setUser(session);

      // Navigate based on 2FA requirements
      if (session.needs2FASetup) {
        navigate('/2fa-setup');
      } else if (session.needs2FAVerification) {
        navigate('/2fa-verify');
      } else {
        navigate('/detection');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      const session = await AuthService.googleAuth(false);
      setUser(session);

      // Navigate based on 2FA requirements
      if (session.needs2FASetup) {
        navigate('/2fa-setup');
      } else if (session.needs2FAVerification) {
        navigate('/2fa-verify');
      } else {
        navigate('/detection');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
      setIsLoading(false); // Reset loading state on error
    }
    // Note: Don't set isLoading to false in finally block for successful auth
    // as the component will unmount when navigating away
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-900">ColoVision</span>
          </div>
          <h2 className="text-xl text-gray-600">Sign in to your account</h2>
        </div>

        <Card className="border-blue-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access the detection platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-400"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-blue-600 hover:text-blue-700"
                  onClick={() => setError('Password reset functionality would be implemented with Firebase Auth')}
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-blue-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <img 
                src="/assets/google.png" 
                alt="Google" 
                className="w-4 h-4 mr-2"
              />
              Sign in with Google
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-500">
                Don't have an account?{' '}
                <Button
                  variant="link"
                  className="px-0 text-blue-600 hover:text-blue-700"
                  onClick={() => navigate('/signup')}
                >
                  Sign up
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          <p className="mt-1">This is a demo application with mock authentication</p>
        </div>
      </div>
    </div>
  );
};