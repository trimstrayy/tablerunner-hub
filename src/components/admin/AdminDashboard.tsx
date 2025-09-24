import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Building2, MapPin, Mail, Users, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface AdminDashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export function AdminDashboard({ userEmail, onLogout }: AdminDashboardProps) {
  const [owners, setOwners] = useState<User[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchOwners = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'owner')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOwners(data || []);
      setFilteredOwners(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading owners",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    const filtered = owners.filter(owner =>
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (owner.hotel_name && owner.hotel_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (owner.hotel_location && owner.hotel_location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredOwners(filtered);
  }, [searchTerm, owners]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <Card className="rounded-none border-b shadow-card">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Restaurant Owners Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium flex items-center space-x-2">
                  <Badge variant="secondary">Admin</Badge>
                </p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Restaurant Owners ({filteredOwners.length})</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchOwners}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by email, hotel name, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading owners...</span>
              </div>
            ) : filteredOwners.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No owners found matching your search.' : 'No restaurant owners registered yet.'}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOwners.map((owner) => (
                  <Card key={owner.id} className="border border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{owner.email}</span>
                        </div>
                        
                        {owner.hotel_name && (
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{owner.hotel_name}</span>
                          </div>
                        )}
                        
                        {owner.hotel_location && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{owner.hotel_location}</span>
                          </div>
                        )}
                        
                        <div className="pt-2">
                          <Badge variant="outline" className="text-xs">
                            Registered: {new Date(owner.created_at || '').toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}