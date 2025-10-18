import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Eye, Search, TrendingUp, DollarSign, ShoppingBag, Users, RefreshCw, CalendarDays } from 'lucide-react';
import { format, isToday, isSameDay } from 'date-fns';
import OrderEditModal from './OrderEditModal';
import { AuthUser } from '@/types/database';
import { useOrders } from '@/hooks/useSupabase';

interface DashboardTabProps {
  user: AuthUser;
}

export function DashboardTab({ user }: DashboardTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'custom'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Fetch orders from Supabase
  const { data: ordersData = [], isLoading, refetch } = useOrders(user.id);

  // raw DB order row for the currently selected order (contains optional fields like customer_name/table)
  const rawSelectedOrder = selectedOrder ? (ordersData.find((r: any) => r.id === selectedOrder.id) as any) : null;

  // Helper to parse timestamps returned from Supabase reliably.
  // Supabase may return strings like '2025-10-17 14:33:00' (no timezone) or
  // ISO strings with timezone. If timezone is missing, treat the value as UTC
  // by appending 'Z' so JS converts it to the user's local timezone correctly.
  const parseDbTimestamp = (ts: any): Date | null => {
    if (!ts) return null;
    if (ts instanceof Date) return ts;
    const s = String(ts);
    // If string already contains timezone info (Z or +HH or -HH), parse directly
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s) || s.includes('T') && s.endsWith('Z')) {
      return new Date(s);
    }
    // Replace space between date and time with 'T' then append 'Z' to treat as UTC
    const normalized = s.replace(' ', 'T') + 'Z';
    return new Date(normalized);
  };

  // Transform Supabase data to match our display format
  const orders = ordersData.map((order: any) => {
    const customerName: string | null = order.customer_name ?? null;
    // table_number may already contain combined value like 'A3' or be separate; prefer combined
    const tableNumber: string | null = order.table_number ?? null;
    const tableGroup: string | null = order.table_group ?? null;
    const combinedTable = tableNumber ?? (tableGroup ? `${tableGroup}${order.table_index ?? ''}`.replace(/\s+$/,'') : null);
    const displayLabel = customerName || combinedTable
      ? [customerName, combinedTable].filter(Boolean).join('  ')
      : `Order #${order.order_number}`;

    return {
      id: order.id,
      orderNumber: order.order_number,
      displayLabel,
      customerName,
      tableNumber: combinedTable,
      date: parseDbTimestamp(order.created_at),
      items: order.order_items?.map((item: any) => ({
        // Prefer linked menu item name, then one-off `name` column, then a fallback
        name: item.menu_items?.name || item.name || 'Unknown Item',
        quantity: item.quantity,
        price: item.price
      })) || [],
      subtotal: order.subtotal || 0,
      discount: order.discount || 0,
      total: order.total || 0,
      status: order.closed ? 'closed' as const : 'completed' as const,
      closed: !!order.closed,
      // Payment method may be stored as payment_method or paymentMethod in returned row
      paymentMethod: (order.payment_method ?? order.paymentMethod ?? 'cash') as 'cash' | 'online' | string,
    };
  });

  // Apply date filtering
  const dateFilteredOrders = orders.filter((order: any) => {
    if (dateFilter === 'today') {
      return isToday(order.date);
    } else if (dateFilter === 'custom' && selectedDate) {
      return isSameDay(order.date, selectedDate);
    }
    return true; // 'all' - show all orders
  });

  // Apply search filtering on top of date filtering
  const filteredOrders = dateFilteredOrders.filter((order: any) => {
    const term = searchTerm.toString().toLowerCase();
    if (!term) return true;
    // match by order number
    if (order.orderNumber.toString().includes(term)) return true;
    // match by display label (customer name / table)
    if (order.displayLabel && order.displayLabel.toLowerCase().includes(term)) return true;
    // match by items
    if (order.items.some((item: any) => item.name.toLowerCase().includes(term))) return true;
    return false;
  });

  // Calculate stats based on date filter
  const statsOrders = dateFilter === 'all' ? orders : dateFilteredOrders;
  const totalSales = statsOrders.reduce((sum: number, order: any) => sum + order.total, 0);
  const totalOrders = statsOrders.length;
  const todaysOrders = orders.filter((order: any) => 
    order.date.toDateString() === new Date().toDateString()
  ).length;

  // Breakdown by payment method
  const cashSales = statsOrders.reduce((sum: number, order: any) => {
    const pm = (order.paymentMethod ?? order.payment_method ?? 'cash');
    return sum + ((pm === 'cash' || pm === 'CASH') ? (order.total || 0) : 0);
  }, 0);
  const onlineSales = statsOrders.reduce((sum: number, order: any) => {
    const pm = (order.paymentMethod ?? order.payment_method ?? 'cash');
    return sum + ((pm === 'online' || pm === 'ONLINE') ? (order.total || 0) : 0);
  }, 0);

  const [salesOpen, setSalesOpen] = useState(false);

  const COMPANY_INFO = {
    name: 'ठुल्दाई को चिया चौतारी  ',
    address: '28 Kilo, Dhulikhel',
    phone: '9768768326',
    pan: '100717802'
  };

  const printInIframe = (html: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!doc || !win) {
      try { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch (e) {}
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      try { if (iframe.parentNode) iframe.parentNode.removeChild(iframe); } catch (e) {}
      try { win.removeEventListener('afterprint', cleanup); } catch (e) {}
      try { window.removeEventListener('focus', cleanup); } catch (e) {}
    };

    const doPrint = () => {
      try { win.focus(); win.print(); } catch (err) { try { window.print(); } catch (e) {} }
    };

    const onLoaded = () => { setTimeout(doPrint, 200); };
    iframe.addEventListener('load', onLoaded, { once: true });
    try { win.addEventListener('afterprint', cleanup, { once: true }); } catch (e) {}
    window.addEventListener('focus', cleanup, { once: true });
    setTimeout(() => {
      try { const ready = doc.readyState === 'complete' || doc.readyState === 'interactive'; if (ready) onLoaded(); } catch (e) { onLoaded(); }
    }, 500);
  };

  const handlePrintOrder = (order: any) => {
    if (!order) return;
    const receiptHTML = `
    <html>
      <head>
        <title>Receipt #${order.orderNumber}</title>
        <style>
          /* Target 78mm thermal receipts: larger top margin to avoid header clipping */
          @page { size: 78mm auto; margin: 8mm 5mm 6mm 3mm; }
          body {
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 0;
            background: white;
            color: #000;
            -webkit-print-color-adjust: exact;
            font-weight: 400;
          }
          /* Printable content width reduced to 62mm to add breathing room and avoid clipping */
          .receipt {
            width: 62mm;
            max-width: 62mm;
            margin: 0 auto;
            padding: 3mm 1mm 3mm 1mm; /* tighten left/right padding to allow more space */
            box-sizing: border-box;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .receipt-header h1 {
            margin: 1px 0;
            font-size: 14px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: 0.2px;
          }
          .receipt-header p {
            margin: 0px 0;
            font-size: 10px;
            line-height: 1;
            font-weight: 700;
          }
          .order-details {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding: 6px 0 6px 0; /* increased vertical padding to avoid clipping */
            margin: 6px 0 8px 0;
            font-size: 12px; /* slightly larger */
            line-height: 1.2; /* make more room vertically */
            font-weight: 700; /* make date/time/customer/table/payment bold */
          }
          .order-details p {
            margin: 4px 0; /* slightly larger vertical spacing */
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: 800; /* bolder header labels */
            font-size: 11px; /* increased */
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px; /* increased */
            margin-bottom: 2px;
            padding: 2px 0;
            border-bottom: 1px dotted #eee;
            color: #000;
            font-weight: 700; /* heavier for better thermal contrast */
          }
          .item-name { flex: 1; font-weight: 700; }
          .item-qty { width: 7mm; text-align: center; }
          .item-price { width: 14mm; text-align: right; font-weight: 600; }
          .item-total { width: 18mm; text-align: right; font-weight: 700; }
          .totals {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 6px 0; /* increased vertical padding for legibility */
            margin: 6px 0;
            font-size: 12px; /* slightly larger */
            font-weight: 700;
          }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .total-row.final { font-weight: 900; font-size: 14px; }
          .discount-row { color: #d32f2f; }
          .footer { text-align: center; margin-top: 6px; font-size: 11px; font-weight: 700; }
          @media print {
            @page { size: 78mm auto; margin: 8mm 5mm 6mm 5mm; }
            html, body { width: 78mm; margin: 0; padding: 0; }
            /* Keep print receipt content slightly narrower than page to avoid clipping */
            .receipt { width: 62mm; max-width: 62mm; margin: 0 auto; padding: 4mm 1mm 4mm 1mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h1>${COMPANY_INFO.name}</h1>
            <p>${COMPANY_INFO.address}</p>
            <p>${COMPANY_INFO.phone}</p>
            <p>PAN: ${COMPANY_INFO.pan}</p>
          </div>
          <div class="order-details">
            <p><strong>Order #${order.orderNumber}</strong></p>
            <p>Date: ${new Date(order.date).toLocaleDateString()}</p>
            <p>Time: ${new Date(order.date).toLocaleTimeString()}</p>
            ${order.customerName ? `<p>Customer: ${order.customerName}</p>` : ''}
            ${order.tableNumber ? `<p>Table: ${order.tableNumber}</p>` : ''}
            ${order.paymentMethod ? `<p>Payment: ${order.paymentMethod === 'cash' ? 'Cash' : 'Online'}</p>` : ''}
          </div>
          <div class="items-header">
            <div class="item-name">Item</div>
            <div class="item-qty">Qty</div>
            <div class="item-price">Price</div>
            <div class="item-total">Total</div>
          </div>
          ${order.items.map((item: any) => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity}</div>
              <div class="item-price">NRs ${item.price}</div>
              <div class="item-total">NRs ${item.quantity * item.price}</div>
            </div>
          `).join('')}
          <div class="totals">
            <div class="total-row"><span>Subtotal:</span><span>NRs ${order.subtotal}</span></div>
            ${order.discount && order.discount > 0 ? `<div class="total-row"><span>Discount:</span><span>-NRs ${order.discount}</span></div>` : ''}
            <div class="total-row final"><span>TOTAL:</span><span>NRs ${order.total}</span></div>
          </div>
          <div class="footer"><p> म अनि मेरो चिया!</p></div>
        </div>
      </body>
    </html>
    `;

    printInIframe(receiptHTML);
  };

  // Calculate item sales summary
  const itemSales = orders.reduce((acc: Record<string, number>, order: any) => {
    order.items.forEach((item: any) => {
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
        <Card className="shadow-card cursor-pointer" onClick={() => setSalesOpen(prev => !prev)} role="button" aria-pressed={salesOpen}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {dateFilter === 'today' ? "Today's Sales" : 
                     dateFilter === 'custom' && selectedDate ? `Sales on ${format(selectedDate, 'MMM dd')}` : 
                     'Total Sales'}
                  </p>
                  <p className="text-xs text-muted-foreground">{salesOpen ? '-' : '+'}</p>
                </div>
                <p className="text-2xl font-bold text-primary">NRs {totalSales}</p>

                {salesOpen && (
                  <div className="mt-3 space-y-2">  
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Cash</Badge>
                        <span className="text-sm text-muted-foreground"></span>
                      </div>
                      <div className="font-medium">NRs {cashSales}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Online</Badge>
                        <span className="text-sm text-muted-foreground"></span>
                      </div>
                      <div className="font-medium">NRs {onlineSales}</div>
                    </div>
                  </div>
                )}
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
                <p className="text-sm font-medium text-muted-foreground">
                  {dateFilter === 'today' ? "Today's Orders" : 
                   dateFilter === 'custom' && selectedDate ? `Orders on ${format(selectedDate, 'MMM dd')}` : 
                   'Total Orders'}
                </p>
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
                <p className="text-2xl font-bold text-warning">NRs {totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0}</p>
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
              <span>Recent Orders ({filteredOrders.length})</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>
                {user.role === 'admin' && (
                  <Badge variant="secondary">All Restaurants</Badge>
                )}
              </div>
            </CardTitle>
            
            {/* Date Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Button
                variant={dateFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('all');
                  setSelectedDate(undefined);
                }}
                className={`flex items-center space-x-2 ${
                  dateFilter === 'all' 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' 
                    : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
              >
                <span>All Orders</span>
              </Button>
              
              <Button
                variant={dateFilter === 'today' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDateFilter('today');
                  setSelectedDate(undefined);
                }}
                className={`flex items-center space-x-2 ${
                  dateFilter === 'today' 
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' 
                    : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Today</span>
              </Button>
              
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={dateFilter === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    className={`flex items-center space-x-2 ${
                      dateFilter === 'custom' 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200' 
                        : 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>
                      {dateFilter === 'custom' && selectedDate
                        ? format(selectedDate, 'MMM dd, yyyy')
                        : 'Select Date'
                      }
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setDateFilter('custom');
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              {(dateFilter === 'today' || (dateFilter === 'custom' && selectedDate)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFilter('all');
                    setSelectedDate(undefined);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Clear Filter
                </Button>
              )}
            </div>
            
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
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading orders...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'No orders found matching your search.' : 'No orders yet. Start taking orders in the POS tab!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{order.displayLabel}</p>
                        <Badge 
                          variant={order.status === 'completed' ? 'default' : 'secondary'}
                          className={order.status === 'completed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(order.date, 'PPp')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items • NRs {order.total}
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
            )}
          </CardContent>
        </Card>

        {/* Item Sales Summary */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Sales by Item</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading sales data...</span>
              </div>
            ) : Object.keys(itemSales).length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No sales data available yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(itemSales)
                  .sort(([,a], [,b]) => (b as number) - (a as number))
                  .map(([item, revenue]) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item}</p>
                      <p className="text-xs text-muted-foreground">Total Revenue</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">NRs {revenue as number}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bill Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md shadow-professional">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                  <span>Order #{selectedOrder.orderNumber}{rawSelectedOrder?.customer_name ? ` — ${rawSelectedOrder.customer_name}` : ''}{rawSelectedOrder?.table_number ? ` — ${rawSelectedOrder.table_number}` : ''}</span>
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
                    <span>NRs {item.quantity * item.price}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>NRs {selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>-NRs {selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>NRs {selectedOrder.total}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                {(() => {
                  const twelveHours = 12 * 60 * 60 * 1000;
                  const now = new Date();
                  const created = selectedOrder?.date ? new Date(selectedOrder.date) : null;
                  const withinWindow = created ? (now.getTime() - created.getTime()) <= twelveHours : false;
                  const isClosed = rawSelectedOrder?.closed === true || selectedOrder?.closed === true;
                  const canEdit = withinWindow && !isClosed;
                  return canEdit ? (
                    <Button onClick={() => { setIsEditingOrder(true); }} className="flex-1">Edit Order</Button>
                  ) : (
                    <Button disabled variant="outline" className="flex-1" size="sm">Edit (disabled)</Button>
                  );
                })()}
                <Button variant="outline" onClick={() => handlePrintOrder(selectedOrder)} className="flex-1">Print</Button>
                <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1">Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isEditingOrder && selectedOrder && (
        <OrderEditModal
          open={isEditingOrder}
          onClose={() => { setIsEditingOrder(false); setSelectedOrder(null); refetch(); }}
          // pass raw DB row so modal has access to order_items.menu_items
          orderRow={ordersData.find((r: any) => r.id === selectedOrder.id)}
          ownerId={user.id}
        />
      )}
    </div>
  );
}