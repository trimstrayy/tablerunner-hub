import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, User, Mail, Lock, MapPin, UserPlus, Phone, Camera } from 'lucide-react';
import { AuthUser, UserRole } from '@/types/database';
import { ThemeToggle } from '@/components/theme-toggle';
import { 
  validateEmail, 
  validateNepaliPhoneNumber, 
  validateFullName, 
  validateProfilePhotoUrl,
  validateHotelName,
  validateHotelLocation 
} from '@/utils/validation';

interface LoginFormProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState<UserRole>('owner'); // Only owners can self-register
  const [fullName, setFullName] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [hotelLocation, setHotelLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Debug logging
      console.log('Login attempt:', { email, password: '***masked***' });
      
      // First, test database connection by getting all users (for debugging)
      const { data: allUsers, error: testError } = await supabase
        .from('users')
        .select('email, role')
        .limit(5);
      
      console.log('Database connection test:', { 
        allUsers, 
        testError,
        connectionWorking: !testError && Array.isArray(allUsers)
      });
      
      // First check if user exists by email only (for debugging)
      const { data: emailCheck, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);
      
      console.log('Email check:', { 
        emailFound: emailCheck && emailCheck.length > 0,
        userCount: emailCheck?.length,
        emailError 
      });
      
      // Now check with email + password
      const { data: userResults, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .limit(1);
      
      // Take the first user if multiple exist
      const users = userResults && userResults.length > 0 ? userResults[0] : null;

      // Debug logging
      console.log('Database response:', { 
        data: users, 
        error: userError,
        hasData: !!users,
        errorCode: userError?.code,
        errorMessage: userError?.message 
      });

      if (userError || !users) {
        console.log('Login failed - no matching user found');
        toast({
          title: "Login failed",
          description: `Invalid email or password. Error: ${userError?.message || 'No user found'}`,
          variant: "destructive",
        });
        return;
      }

      // Check approval status for owners
      if (users.role === 'owner' && users.approval_status !== 'approved') {
        const statusMessage = users.approval_status === 'pending' 
          ? "Your account is pending admin approval. Please wait for confirmation."
          : "Your account has been rejected. Please contact support.";
        
        toast({
          title: "Access Denied",
          description: statusMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login successful",
        description: `Welcome ${users.role}!`,
      });
      
      // Debug: Check what fields are available
      console.log('Available user fields:', Object.keys(users));
      console.log('Full user object:', users);
      
      // Create AuthUser object
      const authUser: AuthUser = {
        id: users.id,
        email: users.email,
        role: users.role as UserRole,
        full_name: (users as any).full_name || undefined,
        contact_no: (users as any).contact_no || undefined,
        profile_photo_url: (users as any).profile_photo_url || undefined,
        hotel_name: users.hotel_name || undefined,
        hotel_location: users.hotel_location || undefined,
      };
      
      onLogin(authUser);
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate all fields
    const emailValidation = validateEmail(email);
    const nameValidation = validateFullName(fullName);
    const phoneValidation = validateNepaliPhoneNumber(contactNo);
    const photoValidation = validateProfilePhotoUrl(profilePhoto);
    const hotelNameValidation = validateHotelName(hotelName);
    const hotelLocationValidation = validateHotelLocation(hotelLocation);

    if (!emailValidation.isValid) {
      toast({
        title: "Registration failed",
        description: emailValidation.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!nameValidation.isValid) {
      toast({
        title: "Registration failed",
        description: nameValidation.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!phoneValidation.isValid) {
      toast({
        title: "Registration failed",
        description: phoneValidation.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!photoValidation.isValid) {
      toast({
        title: "Registration failed",
        description: photoValidation.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (role === 'owner') {
      if (!hotelNameValidation.isValid) {
        toast({
          title: "Registration failed",
          description: hotelNameValidation.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!hotelLocationValidation.isValid) {
        toast({
          title: "Registration failed",
          description: hotelLocationValidation.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        toast({
          title: "Registration failed",
          description: "User with this email already exists.",
          variant: "destructive",
        });
        return;
      }

      // Create new user with pending approval status for owners
      const { error } = await supabase
        .from('users')
        .insert({
          email: email.trim().toLowerCase(),
          password,
          role,
          full_name: fullName.trim(),
          contact_no: contactNo.replace(/[\s\-\(\)]/g, ''), // Clean phone number
          profile_photo_url: profilePhoto.trim() || null,
          hotel_name: role === 'owner' ? hotelName.trim() : null,
          hotel_location: role === 'owner' ? hotelLocation.trim() : null,
          approval_status: role === 'owner' ? 'pending' : 'approved', // Owners need approval, admins auto-approved
        });

      if (error) {
        toast({
          title: "Registration failed",
          description: "Failed to create account. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registration successful",
        description: role === 'owner' 
          ? "Account created successfully! Your registration is pending admin approval. You will be notified once approved."
          : "Account created successfully! Please login.",
      });

      // Switch to login mode
      setIsRegistering(false);
      setPassword('');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="relative w-full max-w-md">
        <div className="absolute top-0 right-0 z-10">
          <ThemeToggle />
        </div>
        <Card className="w-full shadow-professional">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-xl flex items-center justify-center">
              <Building2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Restaurant POS</CardTitle>
              <CardDescription className="text-muted-foreground">
                Professional billing & order management system
              </CardDescription>
            </div>
          </CardHeader>
        <CardContent>
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {isRegistering && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactNo">Contact Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactNo"
                      type="tel"
                      placeholder="Enter your contact number"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePhoto">Profile Photo URL (Optional)</Label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="profilePhoto"
                      type="url"
                      placeholder="Enter profile photo URL"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 You can upload your photo to any image hosting service and paste the URL here
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="role"
                        value="owner"
                        checked={true}
                        readOnly
                        className="text-primary"
                      />
                      <span className="text-sm">Restaurant Owner</span>
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Admin accounts can only be created by existing administrators
                  </p>
                </div>

                {role === 'owner' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="hotelName">Hotel Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="hotelName"
                          type="text"
                          placeholder="Enter hotel name"
                          value={hotelName}
                          onChange={(e) => setHotelName(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hotelLocation">Hotel Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="hotelLocation"
                          type="text"
                          placeholder="Enter hotel location"
                          value={hotelLocation}
                          onChange={(e) => setHotelLocation(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-primary-hover hover:shadow-elevated transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>{isRegistering ? 'Creating Account...' : 'Signing in...'}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {isRegistering ? <UserPlus className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                </div>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setPassword('');
                setFullName('');
                setContactNo('');
                setProfilePhoto('');
                setHotelName('');
                setHotelLocation('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isRegistering 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Create one"}
            </Button>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}