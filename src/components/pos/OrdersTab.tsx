import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Minus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const mockMenuItems: MenuItem[] = [
  { id: '1', name: 'Masala Tea', category: 'Tea', price: 15, image: '🫖' },
  { id: '2', name: 'Black Coffee', category: 'Drinks', price: 20, image: '☕' },
  { id: '3', name: 'Samosa', category: 'Snacks', price: 25, image: '🥟' },
  { id: '4', name: 'Sandwich', category: 'Snacks', price: 40, image: '🥪' },
  { id: '5', name: 'Chai Latte', category: 'Tea', price: 35, image: '🍵' },
  { id: '6', name: 'Cold Coffee', category: 'Drinks', price: 45, image: '🥤' },
];

const categories = ['All', 'Tea', 'Drinks', 'Snacks'];

interface OrdersTabProps {
  userRole: 'admin' | 'owner';
}

export function OrdersTab({ userRole }: OrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNumber] = useState(() => Math.floor(Math.random() * 1000) + 1000);
  const [discount, setDiscount] = useState(0);
  const { toast } = useToast();

  const filteredItems = mockMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.id === menuItem.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      } else {
        return [...prev, {
          id: menuItem.id,
          name: menuItem.name,
          quantity: 1,
          unitPrice: menuItem.price,
          total: menuItem.price
        }];
      }
    });
  };

  const removeFromOrder = (itemId: string) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1, total: (item.quantity - 1) * item.unitPrice }
            : item
        );
      } else {
        return prev.filter(item => item.id !== itemId);
      }
    });
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const finalTotal = subtotal - discount;

  const saveOrder = () => {
    toast({
      title: "Order saved successfully",
      description: `Order #${orderNumber} has been saved to the database.`,
    });
    setOrderItems([]);
    setDiscount(0);
  };

  const cancelOrder = () => {
    setOrderItems([]);
    setDiscount(0);
    toast({
      title: "Order cancelled",
      description: "Current order has been cleared.",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Left Column - Search & Categories */}
      <div className="lg:col-span-3 space-y-4">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2">
              <p className="font-medium text-sm">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedCategory === category 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-primary/10'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Column - Menu Grid */}
      <div className="lg:col-span-6">
        <Card className="shadow-card h-full">
          <CardHeader>
            <CardTitle className="text-lg">Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
              {filteredItems.map(item => (
                <Card
                  key={item.id}
                  className="cursor-pointer hover:shadow-elevated transition-all duration-200 hover:scale-105"
                  onClick={() => addToOrder(item)}
                >
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="text-3xl">{item.image}</div>
                    <h4 className="font-medium text-sm">{item.name}</h4>
                    <p className="text-primary font-bold">₹{item.price}</p>
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Order Panel */}
      <div className="lg:col-span-3">
        <Card className="shadow-card h-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order #{orderNumber}</span>
              <Badge variant="outline">{orderItems.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No items in order</p>
                <p className="text-sm">Click menu items to add</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-muted/50 p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">₹{item.unitPrice} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromOrder(item.id)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToOrder(mockMenuItems.find(m => m.id === item.id)!)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="w-16 text-right">
                        <p className="font-medium text-sm">₹{item.total}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Discount</span>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-20 h-8 text-right"
                      min="0"
                      max={subtotal}
                    />
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-primary">₹{finalTotal}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={saveOrder}
                    className="flex-1 bg-gradient-to-r from-success to-accent text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={cancelOrder}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}