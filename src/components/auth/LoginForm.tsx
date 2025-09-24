import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Building2, User, Mail, Lock, MapPin, UserPlus } from 'lucide-react';
import { AuthUser, UserRole } from '@/types/database';

interface LoginFormProps {
  onLogin: (user: AuthUser) => void;
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [hotelName, setHotelName] = useState('');
  const [hotelLocation, setHotelLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Check if user exists in our users table
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (userError || !users) {
        toast({
          title: "Login failed",
          description: "Invalid email or password.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Login successful",
        description: `Welcome ${users.role}!`,
      });
      
      // Create AuthUser object
      const authUser: AuthUser = {
        id: users.id,
        email: users.email,
        role: users.role as UserRole,
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

      // Create new user
      const { error } = await supabase
        .from('users')
        .insert({
          email,
          password,
          role,
          hotel_name: role === 'owner' ? hotelName : null,
          hotel_location: role === 'owner' ? hotelLocation : null,
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
        description: "Account created successfully! Please login.",
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
      <Card className="w-full max-w-md shadow-professional">
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
                  <Label>Account Type</Label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="owner"
                        checked={role === 'owner'}
                        onChange={(e) => setRole(e.target.value as 'admin' | 'owner')}
                        className="text-primary"
                      />
                      <span className="text-sm">Hotel Owner</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={role === 'admin'}
                        onChange={(e) => setRole(e.target.value as 'admin' | 'owner')}
                        className="text-primary"
                      />
                      <span className="text-sm">Admin</span>
                    </label>
                  </div>
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
  );
}