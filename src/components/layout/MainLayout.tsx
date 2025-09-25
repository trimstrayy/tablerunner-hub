import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OrdersTab } from '@/components/pos/OrdersTab';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { Building2, LogOut, ShoppingCart, BarChart3, User } from 'lucide-react';
import { AuthUser } from '@/types/database';
import { ThemeToggle } from '@/components/theme-toggle';

interface MainLayoutProps {
  user: AuthUser;
  onLogout: () => void;
}

export function MainLayout({ user, onLogout }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <Card className="rounded-none border-b shadow-card">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-hover rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold">
                  {user.role === 'owner' && user.hotel_name ? user.hotel_name : 'Restaurant POS'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  {user.role === 'owner' && user.hotel_location 
                    ? user.hotel_location 
                    : 'Professional Billing System'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex items-center space-x-3 hidden sm:flex">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.profile_photo_url} alt={user.full_name || user.email} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <p className="text-sm font-medium truncate max-w-[120px] md:max-w-[200px]">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-[200px]">
                    {user.email}
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
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="container mx-auto p-4 md:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto bg-card shadow-card h-auto md:h-10">
            <TabsTrigger 
              value="orders" 
              className="flex items-center justify-center space-x-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">POS</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center justify-center space-x-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-0">
            <OrdersTab user={user} />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-0">
            <DashboardTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}