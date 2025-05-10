import { useState } from 'react';
import { useAuth } from '@/context/authContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Alert,
  AlertDescription 
} from "@/components/ui/alert";
import { 
  Lock, 
  User, 
  AlertCircle,
  Loader2,
  Info
} from "lucide-react";
import { Link } from 'react-router-dom';

function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [lockoutTime, setLockoutTime] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAttemptsLeft(null);
    setLockoutTime(null);

    try {
      await login(username, password);
    } catch (error: any) {
      // Handle specific error responses from the backend
      if (error.response) {
        const { status, data } = error.response;
        
        // Extract the most useful error message
        let errorMessage = '';
        
        if (data.message) {
          errorMessage = data.message;
          
          // If there's a more detailed error field, use that instead
          if (data.error && typeof data.error === 'string') {
            errorMessage = data.error;
          }
        } else {
          errorMessage = 'Failed to login. Please try again.';
        }
        
        if (status === 429) {
          // Rate limit error - IP is locked
          setError(errorMessage);
          
          // Try to extract lockout time if it's in the message
          const lockoutMatch = errorMessage.match(/after\s+(\d+)\s+minutes/i);
          if (lockoutMatch && lockoutMatch[1]) {
            setLockoutTime(lockoutMatch[1]);
          }
        } else if (status === 401) {
          // Invalid credentials with attempts tracking
          setError(errorMessage);
          if (data.attemptsLeft) {
            setAttemptsLeft(data.attemptsLeft);
          }
        } else if (status === 500 && data.error) {
          // Server error with details
          setError(data.error);
        } else {
          setError(errorMessage);
        }
      } else {
        setError('Failed to login. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Auqli Admin</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {attemptsLeft !== null && (
            <Alert className="mb-6 bg-amber-50 border-amber-500">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                You have {attemptsLeft} login {attemptsLeft === 1 ? 'attempt' : 'attempts'} remaining before your IP is locked for some time.
              </AlertDescription>
            </Alert>
          )}
          
          {lockoutTime && (
            <Alert className="mb-6 bg-amber-50 border-amber-500">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700">
                Your IP is temporarily locked. Please try again after {lockoutTime} minutes.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username or Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Username or Email"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 rounded border-gray-300"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <Label htmlFor="remember" className="text-sm font-normal">Remember me</Label>
            </div>

            <Button 
              type="submit" 
              className="w-full py-6"
              disabled={isLoading || lockoutTime !== null}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center mt-4">
            Need help? Contact the system administrator.
          </div>
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Auqli Admin Dashboard
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default Login;