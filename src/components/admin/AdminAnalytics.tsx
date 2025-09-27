import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  Star
} from 'lucide-react';
import { useAnalyticsData, useOrderStats, useUserActivity } from '@/hooks/useAnalytics';
import { format, parseISO } from 'date-fns';

interface AdminAnalyticsProps {
  onBack: () => void;
}

const AdminAnalyticsComponent = ({ onBack }: AdminAnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [selectedUser, setSelectedUser] = useState('all');

  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    refetch: refetchAnalytics 
  } = useAnalyticsData();

  const { 
    data: orderStats, 
    isLoading: orderStatsLoading 
  } = useOrderStats();

  const { 
    data: userActivity, 
    isLoading: userActivityLoading 
  } = useUserActivity();

  const handleRefresh = useCallback(() => {
    refetchAnalytics();
  }, [refetchAnalytics]);

  // Memoize expensive calculations
  const isLoading = useMemo(() => 
    analyticsLoading || orderStatsLoading || userActivityLoading, 
    [analyticsLoading, orderStatsLoading, userActivityLoading]
  );

  const engagementRate = useMemo(() => 
    analytics?.activeUsers ? Math.round((analytics.activeUsersToday / analytics.activeUsers) * 100) : 0,
    [analytics?.activeUsers, analytics?.activeUsersToday]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Loading analytics data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2">
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights into your POS system usage</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Activity Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.ordersToday || 0} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {engagementRate}% engagement rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.ordersToday || 0}</div>
            <p className="text-xs text-muted-foreground">
              Orders placed today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.activeUsers ? Math.round((analytics.activeUsersToday / analytics.activeUsers) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Daily engagement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="popular">Popular Items</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Activity Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Trends (Last 7 Days)</CardTitle>
                <CardDescription>Daily order and user activity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.orderTrends?.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary rounded-full" style={{
                          height: `${Math.max(8, (trend.orders / Math.max(...(analytics?.orderTrends?.map(t => t.orders) || [1]))) * 32)}px`
                        }} />
                        <div>
                          <p className="font-medium">{trend.date}</p>
                          <p className="text-sm text-muted-foreground">{trend.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{trend.activeUsers} users</p>
                        <p className="text-xs text-muted-foreground">active</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity</CardTitle>
                <CardDescription>Real-time system usage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Orders Today</p>
                      <p className="text-sm text-muted-foreground">{analytics?.ordersToday || 0} orders placed</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Active Users Today</p>
                      <p className="text-sm text-muted-foreground">{analytics?.activeUsersToday || 0} users active</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Total System Usage</p>
                      <p className="text-sm text-muted-foreground">{analytics?.totalOrders || 0} orders all time</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Statistics</CardTitle>
              <CardDescription>Detailed breakdown of user activity and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Hotel</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Today's Orders</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.userStats?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{user.hotel_name || 'No hotel name'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.totalOrders}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.ordersToday > 0 ? "default" : "outline"}>
                          {user.ordersToday}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.daysActive} days</Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastActiveDate ? (
                          <span className="text-sm">
                            {format(parseISO(user.lastActiveDate), 'MMM dd, yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalOrders}</div>
                <p className="text-sm text-muted-foreground">Total orders placed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Daily Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.ordersToday}</div>
                <p className="text-sm text-muted-foreground">Orders placed today</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Active Restaurants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeUsers}</div>
                <p className="text-sm text-muted-foreground">Restaurants using system</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Popular Items Tab */}
        <TabsContent value="popular" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Items</CardTitle>
              <CardDescription>Top selling menu items across all restaurants</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Times Ordered</TableHead>
                    <TableHead>Orders Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.popularItems?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="flex items-center gap-2">
                        {index < 3 && <Star className="w-4 h-4 text-yellow-500" />}
                        <span className="font-medium">{item.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.totalOrdered} items</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.orderCount} orders</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.recentActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{activity.user_email}</span>
                        {activity.orderCount && (
                          <>
                            <span>•</span>
                            <span>{activity.orderCount} items</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {format(parseISO(activity.timestamp), 'MMM dd, HH:mm')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const AdminAnalytics = memo(AdminAnalyticsComponent);