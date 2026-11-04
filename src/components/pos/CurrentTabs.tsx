import { useMemo, useState } from 'react';
import { Banknote, CheckCircle2, CreditCard, MapPin, RefreshCw, ShoppingCart, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useOrderPayments, useOrders, useRecordOrderPayment } from '@/hooks/useSupabase';
import { AuthUser } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface CurrentTabsProps {
  user: AuthUser;
  onOpenPos: (order: any) => void;
}

type PaymentMethod = 'cash' | 'online';

export function CurrentTabs({ user, onOpenPos }: CurrentTabsProps) {
  const { data: orders = [], isLoading, refetch } = useOrders(user.id);
  const { data: payments = [] } = useOrderPayments(user.id);
  const recordPayment = useRecordOrderPayment();
  const { toast } = useToast();
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentNote, setPaymentNote] = useState('');

  const paymentsByOrder = useMemo(() => {
    const grouped = new Map<string, typeof payments>();
    payments.forEach(payment => {
      const existing = grouped.get(payment.order_id) || [];
      grouped.set(payment.order_id, [...existing, payment]);
    });
    return grouped;
  }, [payments]);

  const openTabs = useMemo(() => orders.filter(order => {
    const orderPayments = paymentsByOrder.get(order.id) || [];
    const ledgerCollected = orderPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const collected = orderPayments.length > 0 ? ledgerCollected : Number((order as any).paid_amount || 0);
    return !(order as any).closed && collected < Number(order.total || 0);
  }), [orders, paymentsByOrder]);

  const totalOutstanding = openTabs.reduce((sum, order) => {
    const orderPayments = paymentsByOrder.get(order.id) || [];
    const ledgerCollected = orderPayments.reduce((paymentSum, payment) => paymentSum + Number(payment.amount || 0), 0);
    const collected = orderPayments.length > 0 ? ledgerCollected : Number((order as any).paid_amount || 0);
    return sum + Math.max(0, Number(order.total || 0) - collected);
  }, 0);

  const openPaymentForm = (orderId: string, remaining: number) => {
    setPaymentOrderId(orderId);
    setPaymentAmount(remaining.toFixed(2));
    setPaymentMethod('cash');
    setPaymentNote('');
  };

  const closePaymentForm = () => {
    setPaymentOrderId(null);
    setPaymentAmount('');
    setPaymentNote('');
  };

  const handleRecordPayment = async (order: any, collected: number, remaining: number) => {
    const amount = Number(paymentAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a payment amount greater than zero.', variant: 'destructive' });
      return;
    }
    if (amount > remaining + 0.001) {
      toast({ title: 'Amount is too high', description: `The remaining balance is NRs ${remaining.toFixed(2)}.`, variant: 'destructive' });
      return;
    }

    await recordPayment.mutateAsync({
      payment: {
        owner_id: user.id,
        order_id: order.id,
        amount,
        payment_method: paymentMethod,
        note: paymentNote.trim() || null,
      },
      currentCollected: collected,
      orderTotal: Number(order.total || 0),
    });
    closePaymentForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Current Tabs</h2>
          <p className="text-sm text-muted-foreground">Open orders and balances waiting for payment.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="w-fit gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open tabs</p>
            <p className="mt-1 text-2xl font-semibold">{openTabs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Outstanding</p>
            <p className="mt-1 text-2xl font-semibold text-amber-600">NRs {totalOutstanding.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payment model</p>
            <p className="mt-1 text-sm font-medium">Partial payments accepted</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading open tabs...
        </div>
      ) : openTabs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h3 className="mt-3 font-semibold">No open tabs</h3>
            <p className="mt-1 text-sm text-muted-foreground">New unpaid orders will appear here automatically.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
          {openTabs.map(order => {
            const orderPayments = paymentsByOrder.get(order.id) || [];
            const ledgerCollected = orderPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
            const collected = orderPayments.length > 0 ? ledgerCollected : Number((order as any).paid_amount || 0);
            const total = Number(order.total || 0);
            const remaining = Math.max(0, total - collected);
            const isPaymentOpen = paymentOrderId === order.id;
            const tableLabel = order.table_group && order.table_number
              ? `${order.table_group} ${order.table_number}`
              : order.table_number || 'No table';

            return (
              <Card key={order.id} className="min-w-0 overflow-hidden rounded-none border-r-0 first:rounded-l-lg last:border-r last:rounded-r-lg">
                <CardHeader className="border-b bg-muted/30 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">Tab #{order.order_number}</CardTitle>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <span className="flex min-w-0 items-center gap-1"><UserRound className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{order.customer_name || 'Walk-in customer'}</span></span>
                        <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{tableLabel}</span></span>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">Open</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4">
                  <div className="space-y-2">
                    {((order as any).order_items || []).map((item: any, index: number) => (
                      <div key={`${order.id}-${item.id || index}`} className="flex min-w-0 items-start justify-between gap-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.menu_items?.name || item.name || 'Unnamed item'}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} × NRs {Number(item.price || 0).toFixed(2)}</p>
                        </div>
                        <span className="shrink-0 font-medium">NRs {Number(item.total || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-semibold">NRs {total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Collected</p>
                      <p className="font-semibold text-green-600">NRs {collected.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Remaining</p>
                      <p className="font-semibold text-amber-600">NRs {remaining.toFixed(2)}</p>
                    </div>
                  </div>

                  {orderPayments.length > 0 && (
                    <div className="space-y-1 rounded-md bg-muted/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground">Payment history</p>
                      {orderPayments.map(payment => (
                        <div key={payment.id} className="flex items-center justify-between text-xs">
                          <span className="min-w-0 truncate">{payment.payment_method === 'cash' ? 'Cash' : 'Online'} · {new Date(payment.paid_at).toLocaleString()}</span>
                          <span className="font-medium">NRs {Number(payment.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {isPaymentOpen && (
                    <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor={`payment-${order.id}`} className="text-xs">Amount</Label>
                          <Input id={`payment-${order.id}`} type="number" min="0.01" max={remaining} step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} />
                        </div>
                        <div>
                          <Label className="text-xs">Method</Label>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button type="button" size="sm" variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="gap-1"><Banknote className="h-3.5 w-3.5" />Cash</Button>
                            <Button type="button" size="sm" variant={paymentMethod === 'online' ? 'default' : 'outline'} onClick={() => setPaymentMethod('online')} className="gap-1"><CreditCard className="h-3.5 w-3.5" />Online</Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`note-${order.id}`} className="text-xs">Note (optional)</Label>
                        <Textarea id={`note-${order.id}`} value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} placeholder="e.g. Student group payment" rows={2} />
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={closePaymentForm}>Cancel</Button>
                        <Button type="button" size="sm" onClick={() => handleRecordPayment(order, collected, remaining)} disabled={recordPayment.isPending}>
                          {recordPayment.isPending ? 'Saving...' : 'Save payment'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isPaymentOpen && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button type="button" variant="outline" className="w-full gap-1" onClick={() => onOpenPos(order)}>
                        <ShoppingCart className="h-4 w-4" /> Add items
                      </Button>
                      <Button type="button" className="w-full gap-1" onClick={() => openPaymentForm(order.id, remaining)}>
                        <CreditCard className="h-4 w-4" /> Payment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
