import { useState, useEffect, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Building2, MapPin, Mail, Users, RefreshCw, Shield, Rocket, Clock, CheckCircle, XCircle, User, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme-toggle';

// Lazy load heavy components
const AdminAnalytics = lazy(() => import('./AdminAnalytics').then(module => ({ default: module.AdminAnalytics })));
const DeploymentChecklist = lazy(() => import('./DeploymentChecklist').then(module => ({ default: module.DeploymentChecklist })));

// Custom type for owner data with all fields
interface OwnerData {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  contact_no: string | null;
  profile_photo_url: string | null;
  hotel_name: string | null;
  hotel_location: string | null;
  created_at: string | null;
  approval_status?: string;
  approved_at?: string;
  approved_by?: string;
}

interface AdminDashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export function AdminDashboard({ userEmail, onLogout }: AdminDashboardProps) {
  const { toast } = useToast();
  const [owners, setOwners] = useState<OwnerData[]>([]);
  const [pendingOwners, setPendingOwners] = useState<OwnerData[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<OwnerData[]>([]);
  const [filteredPendingOwners, setFilteredPendingOwners] = useState<OwnerData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('owners');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [userAnalytics, setUserAnalytics] = useState<Map<string, any>>(new Map());
  const [activeUsers, setActiveUsers] = useState<Set<string>>(new Set());

  const fetchUserAnalytics = async (userId: string) => {
    try {
      // Fetch user orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const ordersToday = orders?.filter(order => 
        new Date(order.created_at) >= todayStart
      ).length || 0;

      const lastOrderDate = orders?.[0]?.created_at || null;
      
      // Calculate unique days with orders (active days)
      const activeDays = new Set(
        orders?.map(order => new Date(order.created_at).toDateString()) || []
      ).size;

      // Estimate usage hours (assume 2 hours per active day)
      const estimatedHours = activeDays * 2;

      // Get first order date to calculate total days since registration
      const firstOrderDate = orders?.[orders.length - 1]?.created_at;
      const daysSinceFirstOrder = firstOrderDate 
        ? Math.ceil((Date.now() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const analytics = {
        totalOrders,
        ordersToday,
        lastOrderDate,
        activeDays,
        estimatedHours,
        daysSinceFirstOrder,
        avgOrdersPerDay: daysSinceFirstOrder > 0 ? (totalOrders / daysSinceFirstOrder).toFixed(1) : '0'
      };

      setUserAnalytics(prev => new Map(prev.set(userId, analytics)));
    } catch (error) {
      console.error('Error fetching user analytics:', error);
    }
  };

  const checkActiveUsers = async () => {
    try {
      // Check for recent activity (orders in last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const { data: recentOrders, error } = await supabase
        .from('orders')
        .select('owner_id')
        .gte('created_at', thirtyMinutesAgo.toISOString());

      if (error) throw error;

      const activeUserIds = new Set(recentOrders?.map(order => order.owner_id) || []);
      setActiveUsers(activeUserIds);
    } catch (error) {
      console.error('Error checking active users:', error);
    }
  };

  const fetchOwners = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching owners...');
      
      // Fetch approved owners
      const { data: approvedData, error: approvedError } = await supabase
        .from('users')
        .select('id, email, role, full_name, contact_no, profile_photo_url, hotel_name, hotel_location, approval_status, approved_at, created_at')
        .eq('role', 'owner')
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      // Fetch pending owners
      const { data: pendingData, error: pendingError } = await supabase
        .from('users')
        .select('id, email, role, full_name, contact_no, profile_photo_url, hotel_name, hotel_location, approval_status, approved_at, created_at')
        .eq('role', 'owner')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (approvedError) throw approvedError;
      if (pendingError) throw pendingError;

      console.log('Approved owners:', approvedData?.length || 0);
      console.log('Pending owners:', pendingData?.length || 0);

      setOwners((approvedData as any) || []);
      setPendingOwners((pendingData as any) || []);
      setFilteredOwners((approvedData as any) || []);
      setFilteredPendingOwners((pendingData as any) || []);

      // Check for active users
      await checkActiveUsers();
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

  const toggleCardExpansion = async (userId: string) => {
    const newExpanded = new Set(expandedCards);
    
    if (expandedCards.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      // Fetch analytics when expanding
      if (!userAnalytics.has(userId)) {
        await fetchUserAnalytics(userId);
      }
    }
    
    setExpandedCards(newExpanded);
  };

  useEffect(() => {
    fetchOwners();
    
    // Set up interval to check for active users every 5 minutes
    const interval = setInterval(checkActiveUsers, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-switch to owners tab if currently on pending tab but no pending owners
  useEffect(() => {
    if (activeTab === 'pending' && pendingOwners.length === 0) {
      setActiveTab('owners');
      toast({
        title: "All approvals processed",
        description: "No pending owner registrations remaining. Switched to Restaurant Owners tab.",
      });
    }
  }, [activeTab, pendingOwners.length, toast]);

  useEffect(() => {
    const filtered = owners.filter(owner =>
      owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (owner.full_name && owner.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (owner.contact_no && owner.contact_no.includes(searchTerm)) ||
      (owner.hotel_name && owner.hotel_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (owner.hotel_location && owner.hotel_location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredOwners(filtered);
  }, [searchTerm, owners]);

  useEffect(() => {
    const filtered = pendingOwners.filter(owner =>
      owner.email.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
      (owner.full_name && owner.full_name.toLowerCase().includes(pendingSearchTerm.toLowerCase())) ||
      (owner.contact_no && owner.contact_no.includes(pendingSearchTerm)) ||
      (owner.hotel_name && owner.hotel_name.toLowerCase().includes(pendingSearchTerm.toLowerCase())) ||
      (owner.hotel_location && owner.hotel_location.toLowerCase().includes(pendingSearchTerm.toLowerCase()))
    );
    setFilteredPendingOwners(filtered);
  }, [pendingSearchTerm, pendingOwners]);

  const handleApproveOwner = async (ownerId: string) => {
    try {
      console.log('Starting approval for owner:', ownerId);
      console.log('Current userEmail:', userEmail);
      
      // First, let's check what the current status is
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('id, email, approval_status')
        .eq('id', ownerId)
        .single();
        
      if (fetchError) {
        console.error('Error fetching current user:', fetchError);
        throw fetchError;
      }
      
      console.log('Current user before update:', currentUser);
      
      // Now update the user (don't use userEmail for approved_by since it expects UUID)
      const { data, error } = await supabase
        .from('users')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString()
          // Remove approved_by for now since it expects UUID, not email
        } as any)
        .eq('id', ownerId)
        .select('id, email, approval_status, approved_at');

      if (error) {
        console.error('Approval error:', error);
        throw error;
      }

      console.log('Approval successful - updated user:', data);

      // Verify the update worked by fetching again
      const { data: verifyUser, error: verifyError } = await supabase
        .from('users')
        .select('id, email, approval_status, approved_at')
        .eq('id', ownerId)
        .single();
        
      console.log('Verification fetch after update:', verifyUser);

      toast({
        title: "Owner approved",
        description: `Restaurant owner has been approved successfully! Status: ${verifyUser?.approval_status}`,
      });

      // Force refresh after a small delay to ensure database is updated
      setTimeout(() => {
        console.log('Refreshing owner lists...');
        fetchOwners();
      }, 1000);
      
    } catch (error: any) {
      console.error('Error in handleApproveOwner:', error);
      toast({
        title: "Error approving owner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRejectOwner = async (ownerId: string) => {
    try {
      console.log('Rejecting owner:', ownerId);
      
      const { data, error } = await supabase
        .from('users')
        .update({
          approval_status: 'rejected',
        } as any)
        .eq('id', ownerId)
        .select();

      if (error) {
        console.error('Rejection error:', error);
        throw error;
      }

      console.log('Rejection successful:', data);

      toast({
        title: "Owner rejected",
        description: "Restaurant owner application has been rejected.",
      });

      // Force refresh after a small delay to ensure database is updated
      setTimeout(() => {
        fetchOwners();
      }, 500);
      
    } catch (error: any) {
      console.error('Error in handleRejectOwner:', error);
      toast({
        title: "Error rejecting owner",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <Card className="rounded-none border-b shadow-card">
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Chief!</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">TableRunner-Hub</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-3 hidden sm:flex">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    <Shield className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium truncate max-w-[120px] md:max-w-[200px]">
                    Admin
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[200px]">
                    {userEmail}
                  </p>
                </div>
              </div>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="hover:bg-destructive hover:text-destructive-foreground transition-colors px-2 sm:px-4"
              >
                <span className="hidden sm:inline">Logout</span>
                <Shield className="w-4 h-4 sm:hidden" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${pendingOwners.length > 0 ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'} h-auto md:h-10`}>
            <TabsTrigger value="owners" className="flex items-center justify-center space-x-2 py-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Restaurant Owners</span>
              <span className="sm:hidden">Owners</span>
            </TabsTrigger>
            {pendingOwners.length > 0 && (
              <TabsTrigger value="pending" className="flex items-center justify-center space-x-2 py-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Pending Approvals ({pendingOwners.length})</span>
                <span className="sm:hidden">Pending ({pendingOwners.length})</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="analytics" className="flex items-center justify-center space-x-2 py-2">
              <Shield className="w-4 h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="deployment" className="flex items-center justify-center space-x-2 py-2">
              <Rocket className="w-4 h-4" />
              <span>Deployment</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owners">
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
                    placeholder="Search by name, email, contact, hotel name, or location..."
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
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredOwners.map((owner) => {
                      const isExpanded = expandedCards.has(owner.id);
                      const isActive = activeUsers.has(owner.id);
                      const analytics = userAnalytics.get(owner.id);
                      
                      return (
                        <Card 
                          key={owner.id} 
                          className="border border-border/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                          onClick={() => toggleCardExpansion(owner.id)}
                        >
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              {/* Profile Header */}
                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  <Avatar className="h-16 w-16 ring-2 ring-primary/10">
                                    <AvatarImage src={owner.profile_photo_url || undefined} alt={owner.full_name || owner.email} />
                                    <AvatarFallback>
                                      <User className="h-8 w-8" />
                                    </AvatarFallback>
                                  </Avatar>
                                  {/* Active Status Indicator */}
                                  {isActive && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">
                                    {owner.full_name || 'No Name Provided'}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">Restaurant Owner</Badge>
                                    {isActive && (
                                      <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                                        🟢 Online
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {/* Expand/Collapse Icon */}
                                <div className="text-muted-foreground">
                                  {isExpanded ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  )}
                                </div>
                              </div>

                              {/* Contact Information */}
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm truncate">{owner.email}</span>
                                </div>
                                
                                {owner.contact_no && (
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm font-mono">{owner.contact_no}</span>
                                  </div>
                                )}
                              </div>

                              {/* Hotel Information */}
                              {(owner.hotel_name || owner.hotel_location) && (
                                <div className="space-y-2 pt-2 border-t border-border/50">
                                  {owner.hotel_name && (
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm font-medium">{owner.hotel_name}</span>
                                    </div>
                                  )}
                                  
                                  {owner.hotel_location && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm text-muted-foreground">{owner.hotel_location}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Registration Date */}
                              <div className="pt-2">
                                <Badge variant="outline" className="text-xs">
                                  Registered: {new Date(owner.created_at || '').toLocaleDateString()}
                                </Badge>
                              </div>

                              {/* Expanded Analytics Section */}
                              {isExpanded && (
                                <div className="pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-1 duration-200">
                                  <h4 className="font-semibold text-sm flex items-center gap-2">
                                    📊 Usage Analytics
                                  </h4>
                                  
                                  {analytics ? (
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{analytics.totalOrders}</div>
                                        <div className="text-xs text-blue-600">Total Orders</div>
                                      </div>
                                      
                                      <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{analytics.ordersToday}</div>
                                        <div className="text-xs text-green-600">Orders Today</div>
                                      </div>
                                      
                                      <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-600">{analytics.activeDays}</div>
                                        <div className="text-xs text-purple-600">Active Days</div>
                                      </div>
                                      
                                      <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">{analytics.estimatedHours}h</div>
                                        <div className="text-xs text-orange-600">Est. Usage</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                                      <p className="text-sm text-muted-foreground">Loading analytics...</p>
                                    </div>
                                  )}
                                  
                                  {analytics?.lastOrderDate && (
                                    <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                      <p className="text-xs text-muted-foreground">
                                        Last Order: {new Date(analytics.lastOrderDate).toLocaleString()}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {pendingOwners.length > 0 && (
            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Pending Owner Approvals
                  </CardTitle>
                  <CardDescription>
                    Review and approve new restaurant owner registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingOwners.map((owner) => (
                      <Card key={owner.id} className="border-orange-200 bg-orange-50/50">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                            <div className="flex-1">
                              {/* Profile Header */}
                              <div className="flex items-center space-x-4 mb-4">
                                <Avatar className="h-16 w-16 ring-2 ring-orange-200">
                                  <AvatarImage src={owner.profile_photo_url || undefined} alt={owner.full_name || owner.email} />
                                  <AvatarFallback>
                                    <User className="h-8 w-8" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-lg truncate">
                                    {owner.full_name || 'No Name Provided'}
                                  </h3>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                      Pending Approval
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Contact Information */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center space-x-2">
                                  <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm truncate">{owner.email}</span>
                                </div>
                                
                                {owner.contact_no && (
                                  <div className="flex items-center space-x-2">
                                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm font-mono">{owner.contact_no}</span>
                                  </div>
                                )}
                              </div>

                              {/* Hotel Information */}
                              {(owner.hotel_name || owner.hotel_location) && (
                                <div className="space-y-2 mb-4">
                                  {owner.hotel_name && (
                                    <div className="flex items-center space-x-2">
                                      <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm font-medium">{owner.hotel_name}</span>
                                    </div>
                                  )}
                                  
                                  {owner.hotel_location && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                      <span className="text-sm text-muted-foreground">{owner.hotel_location}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Registration Date */}
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  Registered: {new Date(owner.created_at || '').toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row gap-2 sm:ml-4 w-full sm:w-auto">
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                onClick={() => handleApproveOwner(owner.id)}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                <span className="sm:hidden">Approve</span>
                                <span className="hidden sm:inline">Approve</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="w-full sm:w-auto"
                                onClick={() => handleRejectOwner(owner.id)}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                <span className="sm:hidden">Reject</span>
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="analytics">
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading analytics...</div>}>
              <AdminAnalytics onBack={() => setActiveTab('owners')} />
            </Suspense>
          </TabsContent>

          <TabsContent value="deployment">
            <Suspense fallback={<div className="flex items-center justify-center p-8">Loading deployment...</div>}>
              <DeploymentChecklist />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}