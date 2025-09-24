import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, Search, TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Order {
  id: string;
  orderNumber: number;
  date: Date;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'completed' | 'pending';
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 1001,
    date: new Date(2024, 0, 15, 10, 30),
    items: [
      { name: 'Masala Tea', quantity: 2, price: 15 },
      { name: 'Samosa', quantity: 3, price: 25 }
    ],
    subtotal: 105,
    discount: 5,
    total: 100,
    status: 'completed'
  },
  {
    id: '2',
    orderNumber: 1002,
    date: new Date(2024, 0, 15, 14, 15),
    items: [
      { name: 'Black Coffee', quantity: 1, price: 20 },
      { name: 'Sandwich', quantity: 2, price: 40 }
    ],
    subtotal: 100,
    discount: 0,
    total: 100,
    status: 'completed'
  },
  {
    id: '3',
    orderNumber: 1003,
    date: new Date(2024, 0, 16, 9, 45),
    items: [
      { name: 'Chai Latte', quantity: 1, price: 35 },
      { name: 'Cold Coffee', quantity: 1, price: 45 }
    ],
    subtotal: 80,
    discount: 10,
    total: 70,
    status: 'pending'
  }
];

interface DashboardTabProps {
  userRole: 'admin' | 'owner';
}

export function DashboardTab({ userRole }: DashboardTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = mockOrders.filter(order =>
    order.orderNumber.toString().includes(searchTerm) ||
    order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalSales = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = mockOrders.length;
  const todaysOrders = mockOrders.filter(order => 
    order.date.toDateString() === new Date().toDateString()
  ).length;

  // Calculate item sales summary
  const itemSales = mockOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (acc[item.name]) {
        acc[item.name] += item.quantity * item.price;
      } else {
        acc[item.name] = item.quantity * item.price;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold text-primary">₹{totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-success">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold text-info">{todaysOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold text-warning">₹{Math.round(totalSales / totalOrders)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Orders</span>
              {userRole === 'admin' && (
                <Badge variant="secondary">All Restaurants</Badge>
              )}
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <Badge 
                        variant={order.status === 'completed' ? 'default' : 'secondary'}
                        className={order.status === 'completed' ? 'bg-success text-white' : ''}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(order.date, 'PPp')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.items.length} items • ₹{order.total}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Item Sales Summary */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Sales by Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(itemSales)
                .sort(([,a], [,b]) => b - a)
                .map(([item, revenue]) => (
                <div key={item} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item}</p>
                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{revenue}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bill Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md shadow-professional">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order #{selectedOrder.orderNumber}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {format(selectedOrder.date, 'PPpp')}
                </p>
              </div>
              
              <div className="space-y-2">
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{item.quantity * item.price}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₹{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>-₹{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{selectedOrder.total}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}