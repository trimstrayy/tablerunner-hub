import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { OrdersTab } from '@/components/pos/OrdersTab';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { MenuManagementTab } from '@/components/menu/MenuManagementTab';
import { Building2, LogOut, ShoppingCart, BarChart3, Menu, User } from 'lucide-react';

interface MainLayoutProps {
  userRole: 'admin' | 'owner';
  userEmail: string;
  hotelName?: string;
  onLogout: () => void;
}

export function MainLayout({ userRole, userEmail, hotelName, onLogout }: MainLayoutProps) {
  const [activeTab, setActiveTab] = useState('orders');

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
                <h1 className="text-xl font-bold">Restaurant POS</h1>
                <p className="text-sm text-muted-foreground">Professional Billing System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="capitalize">{userRole}</span>
                </p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onLogout}
                className="hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 mx-auto bg-card shadow-card">
            <TabsTrigger 
              value="orders" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="menu" 
              className="flex items-center space-x-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Menu className="w-4 h-4" />
              <span>Menu</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-0">
            <OrdersTab userRole={userRole} />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-0">
            <DashboardTab userRole={userRole} />
          </TabsContent>

          <TabsContent value="menu" className="space-y-0">
            <MenuManagementTab userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}