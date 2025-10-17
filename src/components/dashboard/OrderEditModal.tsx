import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Plus, Minus, X, Save } from 'lucide-react';
import { useMenuItems, useUpdateOrder } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';
import { MenuItem } from '@/types/database';

interface CartItem {
  id: string; // menu item id
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderEditModalProps {
  open: boolean;
  onClose: () => void;
  orderRow: any; // raw DB order row (includes id, order_items)
  ownerId: string;
}

export default function OrderEditModal({ open, onClose, orderRow, ownerId }: OrderEditModalProps) {
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [tableGroup, setTableGroup] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null);
  const { data: menuItemsData = [], isLoading: isLoadingMenu } = useMenuItems(ownerId);
  const menuItems: MenuItem[] = (menuItemsData as MenuItem[]) || [];
  const updateOrder = useUpdateOrder();
  const { toast } = useToast();

  useEffect(() => {
    if (!orderRow) return;
    const initial: CartItem[] = (orderRow.order_items || []).map((it: any) => ({
      id: it.menu_items?.id || it.item_id,
      name: it.menu_items?.name || it.name || 'Unknown',
      quantity: it.quantity,
      unitPrice: it.price,
      total: it.quantity * it.price,
    }));
    setOrderItems(initial);
    // populate optional fields if present on the orderRow
    setCustomerName(orderRow.customer_name || null);
    setTableNumber(orderRow.table_number || null);
    setTableGroup(orderRow.table_group || null);
    setPaymentMethod(orderRow.payment_method || null);
  }, [orderRow]);

  const addToOrder = (menuItem: MenuItem) => {
    setOrderItems(prev => {
      const existing = prev.find(p => p.id === menuItem.id);
      if (existing) {
        return prev.map(p => p.id === menuItem.id ? { ...p, quantity: p.quantity + 1, total: (p.quantity + 1) * p.unitPrice } : p);
      }
      return [...prev, { id: menuItem.id, name: menuItem.name, quantity: 1, unitPrice: menuItem.price, total: menuItem.price }];
    });
  };

  const updateQuantity = (id: string, change: number) => {
    setOrderItems(prev => prev.map(p => {
      if (p.id !== id) return p;
      const q = Math.max(0, p.quantity + change);
      return q === 0 ? null as any : { ...p, quantity: q, total: q * p.unitPrice };
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromOrder = (id: string) => setOrderItems(prev => prev.filter(p => p.id !== id));

  const subtotal = orderItems.reduce((s, it) => s + it.total, 0);

  const handleSave = async () => {
    if (!orderRow) return;

    // If the order has been marked closed (another order was created for the same table), prevent saving
    if (orderRow.closed) {
      toast({
        title: 'Order closed',
        description: 'This order has been closed because a new order was created for the same table. It cannot be edited.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent editing orders older than 12 hours
    const createdAt = orderRow.created_at ? new Date(orderRow.created_at) : null;
    if (createdAt) {
      const twelveHours = 12 * 60 * 60 * 1000;
      if ((Date.now() - createdAt.getTime()) > twelveHours) {
        toast({
          title: 'Edit unavailable',
          description: 'Orders older than 12 hours cannot be edited.',
          variant: 'destructive',
        });
        return;
      }
    }

    const orderItemsPayload = orderItems.map(it => ({
      item_id: it.id && it.id.toString().startsWith('oneoff-') ? null : it.id,
      name: it.id && it.id.toString().startsWith('oneoff-') ? it.name : undefined,
      quantity: it.quantity,
      price: it.unitPrice,
      total: it.total,
    }));

    const updates = {
      subtotal,
      discount: orderRow.discount || 0,
      total: subtotal - (orderRow.discount || 0),
      customer_name: customerName || null,
      table_group: tableGroup || null,
      table_number: tableNumber || null,
      payment_method: paymentMethod || null,
    };

    try {
      await updateOrder.mutateAsync({ orderId: orderRow.id, updates, orderItems: orderItemsPayload });
      onClose();
    } catch (error) {
      // error handled by hook toast
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl shadow-professional">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Edit Order #{orderRow?.order_number}</span>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium">Menu</h4>
                <div className="text-sm text-muted-foreground">{isLoadingMenu ? 'Loading...' : `${menuItems.length} items`}</div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-2">
                {menuItems.map(item => (
                  <div key={item.id} className="p-2 border rounded-lg cursor-pointer hover:shadow" onClick={() => addToOrder(item)}>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">NRs {item.price}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <h4 className="font-medium mb-2">Order</h4>
              <div className="mb-3">
                <Label className="text-xs">Customer name (optional)</Label>
                <Input value={customerName ?? ''} onChange={(e) => setCustomerName(e.target.value || null)} className="text-sm" />
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1">
                    <Label className="text-xs">Table group</Label>
                    <Select value={tableGroup ?? ''} onValueChange={(v) => { setTableGroup(v || null); setTableNumber(null); }}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Table #</Label>
                    <Select value={tableNumber ?? ''} onValueChange={(v) => setTableNumber(v || null)}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        {(tableGroup ? Array.from({ length: 5 }, (_, i) => `${tableGroup}${i+1}`) : []).map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-2">
                  <Label className="text-xs">Payment method</Label>
                  <div className="flex items-center space-x-3 mt-1">
                    <label className="text-sm">
                      <input type="radio" name="edit-payment" value="cash" checked={paymentMethod === 'cash'} onChange={() => setPaymentMethod('cash')} /> Cash
                    </label>
                    <label className="text-sm">
                      <input type="radio" name="edit-payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} /> Online
                    </label>
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {orderItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No items</div>
                ) : orderItems.map(it => (
                  <div key={it.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground">NRs {it.unitPrice} each</div>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <div className="flex items-center space-x-1">
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, -1)} className="w-6 h-6 p-0"><Minus className="w-3 h-3" /></Button>
                        <span className="font-medium text-xs">{it.quantity}</span>
                        <Button size="sm" variant="outline" onClick={() => updateQuantity(it.id, 1)} className="w-6 h-6 p-0"><Plus className="w-3 h-3" /></Button>
                      </div>
                      <div className="text-right text-sm font-semibold">NRs {it.total}</div>
                      <Button size="sm" variant="outline" onClick={() => removeFromOrder(it.id)} className="w-6 h-6 p-0 text-destructive"><X className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />
              <div className="mt-2 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">NRs {subtotal}</span></div>
                <div className="flex gap-2">
                  <Button onClick={onClose} variant="outline" className="flex-1">Cancel</Button>
                  <Button onClick={handleSave} className="flex-1">{updateOrder.isPending ? (<><RefreshCw className="w-4 h-4 mr-2 animate-spin"/>Saving...</>) : (<><Save className="w-4 h-4 mr-2"/>Save Changes</>)}</Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
