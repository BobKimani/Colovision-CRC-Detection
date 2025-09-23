import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { useRouter, useAuth } from '../routes/Router';
import { AuthService } from '../services/auth';
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { navigate } = useRouter();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordValidation = AuthService.validateSignupPassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreeToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements');
      return;
    }

    setIsLoading(true);

    try {
      const session = await AuthService.signup({ email, password });
      setUser(session);
      navigate('/2fa-setup');
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    try {
      const session = await AuthService.googleAuth(true);
      setUser(session);
      navigate('/2fa-setup');
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
          <h2 className="text-xl text-gray-600">Create your account</h2>
        </div>

        <Card className="border-blue-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Get started</CardTitle>
            <CardDescription className="text-center">
              Join medical professionals using AI for better diagnostics
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
                    placeholder="Create a strong password"
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
                
                {password && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Password requirements:</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center space-x-1 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-1 h-1 rounded-full ${passwordValidation.minLength ? 'bg-green-600' : 'bg-gray-400'}`} />
                        <span>8+ characters</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-1 h-1 rounded-full ${passwordValidation.hasUpperCase ? 'bg-green-600' : 'bg-gray-400'}`} />
                        <span>Uppercase</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-1 h-1 rounded-full ${passwordValidation.hasLowerCase ? 'bg-green-600' : 'bg-gray-400'}`} />
                        <span>Lowercase</span>
                      </div>
                      <div className={`flex items-center space-x-1 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-1 h-1 rounded-full ${passwordValidation.hasNumbers ? 'bg-green-600' : 'bg-gray-400'}`} />
                        <span>Numbers</span>
                      </div>
                      <div className={`flex items-center space-x-1 col-span-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-gray-400'}`}>
                        <div className={`w-1 h-1 rounded-full ${passwordValidation.hasSpecialChar ? 'bg-green-600' : 'bg-gray-400'}`} />
                        <span>Special characters</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="border-blue-200 focus:border-blue-400 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <div className="text-xs text-red-600">Passwords do not match</div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                />
                <Label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                    Terms of Service
                  </Button>
                  {' '}and{' '}
                  <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                    Privacy Policy
                  </Button>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword || !agreeToTerms}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
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
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>

            <div className="text-center">
              <span className="text-sm text-gray-500">
                Already have an account?{' '}
                <Button
                  variant="link"
                  className="px-0 text-blue-600 hover:text-blue-700"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </Button>
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500 space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <Shield className="w-3 h-3" />
            <span>Your data is protected with enterprise-grade security</span>
          </div>
          <p>This is a demo application with mock authentication</p>
        </div>
      </div>
    </div>
  );
};