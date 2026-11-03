import { useState, useEffect } from 'react';
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
  Mail,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  InfoIcon
} from "lucide-react";
import { Link } from 'react-router-dom';

function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  
  // Password validation states
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Validate password on change
  useEffect(() => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    });
  }, [password]);

  // Check if password is valid
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validate password
    if (!isPasswordValid) {
      setError('Please ensure your password meets all the requirements.');
      setShowPasswordRequirements(true);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      await register(username, email, password);
      setSuccess('Registration successful! Redirecting to dashboard...');
    } catch (error: any) {
      // Handling specific error messages from the backend
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          setError(error.response.data.message);
        } else if (error.response.status === 403) {
          setError('This email is not authorized to register as an admin.');
        } else if (error.response.status === 400) {
          setError('An admin with this email or username already exists.');
        } else {
          setError('Failed to register. Please try again.');
        }
      } else {
        setError('Failed to register. ' + error.message);
      }
      
      // Show password requirements if there's a password-related error
      if (error.response?.data?.message?.includes('Password')) {
        setShowPasswordRequirements(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Compact version of password requirements
  const PasswordRequirementsBadge = () => {
    if (!password) return null;
    
    const allValid = isPasswordValid;
    const someValid = Object.values(passwordValidation).some(Boolean);
    
    let color = "bg-gray-200 text-gray-700";
    if (allValid) color = "bg-green-100 text-green-800";
    else if (someValid) color = "bg-amber-100 text-amber-800";
    
    return (
      <div 
        className={`text-xs px-2 py-1 rounded-full ${color} flex items-center cursor-pointer mt-1`}
        onClick={() => setShowPasswordRequirements(!showPasswordRequirements)}
      >
        {allValid ? 
          <CheckCircle2 className="h-3 w-3 mr-1" /> : 
          <InfoIcon className="h-3 w-3 mr-1" />
        }
        <span>{allValid ? "Strong password" : "Password requirements"}</span>
      </div>
    );
  };

  // Detailed password requirements
  const ValidationItem = ({ 
    condition, 
    text 
  }: { 
    condition: boolean; 
    text: string 
  }) => (
    <div className="flex items-center gap-2">
      {condition ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={condition ? "text-green-500" : "text-red-500"}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-6">
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">Create Admin Account</CardTitle>
          <CardDescription className="text-center">
            Enter your details to create an admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert className="mb-6 bg-green-50 border-green-500">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">{success}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  className="pl-10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value && !showPasswordRequirements) {
                      setShowPasswordRequirements(true);
                    }
                  }}
                  onFocus={() => setShowPasswordRequirements(true)}
                  required
                />
              </div>
              
              <PasswordRequirementsBadge />
              
              {showPasswordRequirements && (
                <div className="text-sm space-y-1 mt-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                  <p className="font-medium mb-1">Password must have:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <ValidationItem 
                      condition={passwordValidation.minLength} 
                      text="At least 8 characters" 
                    />
                    <ValidationItem 
                      condition={passwordValidation.hasUppercase} 
                      text="Uppercase letter (A-Z)" 
                    />
                    <ValidationItem 
                      condition={passwordValidation.hasLowercase} 
                      text="Lowercase letter (a-z)" 
                    />
                    <ValidationItem 
                      condition={passwordValidation.hasNumber} 
                      text="Number (0-9)" 
                    />
                    <ValidationItem 
                      condition={passwordValidation.hasSpecialChar} 
                      text="Special character (@$!%*?&)" 
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`pl-10 ${confirmPassword && password !== confirmPassword ? 'border-red-500' : ''}`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  Passwords do not match
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full py-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
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

export default Register;
