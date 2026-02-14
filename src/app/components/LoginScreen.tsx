import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Phone, AlertCircle, UserPlus, LogIn, Loader2 } from 'lucide-react';

export function LoginScreen() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFullName, setRegisterFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, isLoading } = useAuth();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      if (!loginUsername || !loginPassword) {
        setError('Please enter both username and password');
        setLoading(false);
        return;
      }

      const success = await login(loginUsername, loginPassword);
      
      if (!success) {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!registerUsername || !registerPassword) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (registerPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      if (registerPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const success = await register(registerUsername, registerPassword, registerFullName);
      
      if (!success) {
        setError('Registration failed. Username might already be taken.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Phone className="h-12 w-12 text-blue-900" />
            </div>
            <h1 className="text-4xl text-white">Voizmatic</h1>
          </div>
          <p className="text-blue-100 text-lg">
            AI Voice in Action
          </p>
        </div>

        <Card className="shadow-2xl border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-white border-b border-blue-100">
            <CardTitle className="text-blue-900">Welcome</CardTitle>
            <CardDescription className="text-blue-700">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'login' | 'register'); setError(''); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-blue-900">Username / Email</Label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter username or email"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    disabled={isSubmitting}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-blue-900">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    disabled={isSubmitting}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                  onClick={handleLogin}
                  disabled={isSubmitting || !loginUsername || !loginPassword}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-fullname" className="text-blue-900">Full Name (Optional)</Label>
                  <Input
                    id="register-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={registerFullName}
                    onChange={(e) => setRegisterFullName(e.target.value)}
                    disabled={isSubmitting}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username" className="text-blue-900">Username / Email *</Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Enter username or email"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    disabled={isSubmitting}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password" className="text-blue-900">Password *</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-blue-900">Confirm Password *</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                    disabled={isSubmitting}
                    className="border-blue-200 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <Button
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                  onClick={handleRegister}
                  disabled={isSubmitting || !registerUsername || !registerPassword || !confirmPassword}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create Account
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* API Info */}
        <div className="mt-6 text-center text-sm text-blue-100 bg-blue-900/30 backdrop-blur-sm p-4 rounded-lg">
          <p>
            Connected to <strong className="text-white">api.voizmatic.com</strong>
          </p>
          <p className="mt-1 text-blue-200">
            Create an account or sign in with your existing credentials
          </p>
        </div>
      </div>
    </div>
  );
}