import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Minus, Save, X, Edit3, Trash2, Settings, RefreshCw, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthUser, MenuItem, CartItem } from '@/types/database';
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useCreateOrder, useNextOrderNumber } from '@/hooks/useSupabase';

// Known database categories (fallback / ordering)
const DB_CATEGORIES = [
  'Chiya/Coffee',
  'Snacks',
  'Cold Drinks',
  'Ice Cream',
  'Bakery',
  'Hookah',
  'Momo'
];

// Map DB category values to display names shown in the UI
const categoryDisplayMap: Record<string, string> = {
  'Chiya/Coffee': 'Tea',
  'Snacks': 'Snacks',
  'Cold Drinks': 'Cold Drinks',
  'Ice Cream': 'Ice Cream',
  'Bakery': 'Bakery',
  'Hookah': 'Hookah',
  'Momo': 'Momo',
};

interface OrdersTabProps {
  user: AuthUser;
}

export function OrdersTab({ user }: OrdersTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [tableGroup, setTableGroup] = useState<string | null>(null);
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  // One-off item inputs (name + price) that do not modify the menu
  const [oneOffName, setOneOffName] = useState('');
  const [oneOffPrice, setOneOffPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    // default to a valid DB category
    category: DB_CATEGORIES[0],
    price: '',
    image_url: ''
  });
    const { toast } = useToast();

   function printPage() {
        window.print();
        }
        const COMPANY_INFO = {
          name: 'ठुल्दाईको चिया चौतारी  ',
          address: '28 Kilo, Dhulikhel',
          phone: '9768768326',
          pan: '100717802'
        };

const generateReceipt = (printedOrderNumber?: number | string) => {
  const receiptNumberToShow = printedOrderNumber ?? nextOrderNumber;
  const receiptHTML = `
    <html>
      <head>
        <title>Receipt #${receiptNumberToShow}</title>
          <style>
          /* Target 78mm thermal receipts: larger top margin to avoid header clipping */
          /* margin: top right bottom left */
          @page { size: 78mm auto; margin: 8mm 5mm 6mm 5mm; }
          body {
            /* Use a high-contrast, widely-available sans-serif for better print legibility */
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: #000;
            -webkit-print-color-adjust: exact;
            -webkit-font-smoothing: antialiased;
            font-weight: 400;
          }
          /* Printable content width = 78mm - 5mm(left) - 5mm(right) = 68mm */
          .receipt {
            width: 68mm;
            max-width: 68mm;
            margin: 0 auto;
            /* internal padding to keep content away from edges (top particularly) */
            padding: 2mm 0 2mm 0;
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
            font-size: 12px;
            line-height: 1;
            font-weight: 800; /* bold store name */
            letter-spacing: 0.2px;
          }
          .receipt-header p {
            margin: 0px 0;
            font-size: 8px;
            line-height: 1;
            font-weight: 600; /* make address/phone clearer */
          }
          .order-details {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 4px;
            margin-bottom: 4px;
            font-size: 9px;
          }
          .order-details p {
            margin: 3px 0;
          }
          .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            font-size: 8px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 3px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            margin-bottom: 1px;
            padding-bottom: 1px;
            border-bottom: 1px dotted #eee;
            color: #000;
            font-weight: 500; /* slightly bolder for item lines */
          }
          .item-name {
            flex: 1;
          }
          /* Use mm units so widths align to the printable area; remaining space used by item name */
          .item-qty {
            width: 8mm;
            text-align: center;
          }
          .item-price {
            width: 16mm;
            text-align: right;
            font-weight: 600;
          }
          .item-total {
            width: 22mm;
            text-align: right;
            font-weight: 700; /* emphasis on totals for readability */
          }
          .totals {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 4px 0;
            margin: 4px 0;
            font-size: 9px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .total-row.final {
            font-weight: 900;
            font-size: 12px;
          }
          .discount-row {
            color: #d32f2f;
          }
          .footer {
            text-align: center;
            margin-top: 4px;
            font-size: 8px;
          }
          @media print {
            /* Ensure print-time page settings align with the mm-based layout */
            @page { size: 78mm auto; margin: 8mm 5mm 6mm 5mm; }
            html, body { width: 78mm; margin: 0; padding: 0; }
            .receipt { width: 68mm; margin: 0; padding: 2mm 0 2mm 0; }
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <!-- Header -->
          <div class="receipt-header">
            <h1>${COMPANY_INFO.name}</h1>
            <p>${COMPANY_INFO.address}</p>
            <p>${COMPANY_INFO.phone}</p>
            <p>PAN: ${COMPANY_INFO.pan}</p>
          </div>

          <!-- Order Info -->
          <div class="order-details">
            <p><strong>Order #${nextOrderNumber}</strong></p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
            <p>Time: ${new Date().toLocaleTimeString()}</p>
            ${customerName ? `<p>Customer: ${customerName}</p>` : ''}
            ${tableNumber ? `<p>Table: ${tableNumber}</p>` : ''}
            ${paymentMethod ? `<p>Payment: ${paymentMethod === 'cash' ? 'Cash' : 'Online'}</p>` : ''}
          </div>

          <!-- Items -->
          <div class="items-header">
            <div class="item-name">Item</div>
            <div class="item-qty">Qty</div>
            <div class="item-price">Price</div>
            <div class="item-total">Total</div>
          </div>
          
          ${orderItems.map(item => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity}</div>
              <div class="item-price">NRs ${item.unitPrice}</div>
              <div class="item-total">NRs ${item.total}</div>
            </div>
          `).join('')}

          <!-- Totals -->
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>NRs ${subtotal}</span>
            </div>
            ${discount > 0 ? `
              <div class="total-row discount-row">
                <span>Discount (${discountType === 'percentage' ? discount + '%' : 'Rs'}):</span>
                <span>-NRs ${discountAmount.toFixed(0)}</span>
              </div>
            ` : ''}
            <div class="total-row final">
              <span>TOTAL:</span>
              <span>NRs ${total}</span>
            </div>
          </div>

          <div class="footer">
            <p> म अनि मेरो चिया!</p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Print using a hidden iframe appended to the current document.
  // This avoids opening a new tab/window and generally bypasses popup blockers.
  const printInIframe = (html: string) => {
    const iframe = document.createElement('iframe');
    // Keep iframe hidden and non-intrusive
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
      toast({ title: 'Cannot print', description: 'Failed to create print frame.', variant: 'destructive' });
      return;
    }

    // Write the full HTML into the iframe
    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      try {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      } catch (e) {
        // noop
      }
      try { win.removeEventListener('afterprint', cleanup); } catch (e) {}
      try { window.removeEventListener('focus', cleanup); } catch (e) {}
    };

    const doPrint = () => {
      try {
        win.focus();
        win.print();
      } catch (err) {
        // fallback to main window print if iframe print fails
        try { window.print(); } catch (e) {}
      }
    };

    // Some browsers may fire load after writing, others may not. Use both load listener and timeouts.
    const onLoaded = () => {
      // Give the iframe a brief moment to apply styles/fonts before printing
      setTimeout(doPrint, 200);
    };

    iframe.addEventListener('load', onLoaded, { once: true });

    // Try to use afterprint on the iframe window to cleanup
    try {
      win.addEventListener('afterprint', cleanup, { once: true });
    } catch (e) {
      // ignore
    }

    // Fallback cleanup: when main window regains focus (user closed print dialog)
    window.addEventListener('focus', cleanup, { once: true });

    // In case load didn't fire for dynamic documents, trigger print after a short fallback timeout
    setTimeout(() => {
      try {
        const ready = doc.readyState === 'complete' || doc.readyState === 'interactive';
        if (ready) onLoaded();
      } catch (e) {
        onLoaded();
      }
    }, 500);
  };

  printInIframe(receiptHTML);
};

const handlePrint = async (e: React.MouseEvent) => {
  e.preventDefault();
  if (orderItems.length === 0) {
    toast({
      title: 'Cannot print',
      description: 'Add items to order first.',
      variant: 'destructive',
    });
    return;
  }

  try {
    // build payload for save (same structure as handleSaveOrder)
    const orderData = {
      order_number: nextOrderNumber,
      owner_id: user.id,
      subtotal,
      discount: discountType === 'percentage' ? (subtotal * discount / 100) : discount,
      total,
      customer_name: customerName || null,
      table_group: tableGroup || null,
      table_number: tableNumber || null,
    } as any;

    const orderItemsData = orderItems.map(item => ({
      item_id: item.id && item.id.toString().startsWith('oneoff-') ? null : item.id,
      name: item.id && item.id.toString().startsWith('oneoff-') ? item.name : undefined,
      quantity: item.quantity,
      price: item.unitPrice,
      total: item.total,
    }));

    // save order first
    const saved = await createOrder.mutateAsync({ order: orderData, orderItems: orderItemsData });

    // once saved, open receipt with server-assigned order number
    generateReceipt(saved?.order_number ?? nextOrderNumber);

    // Clear the order as save was successful
    setOrderItems([]);
    setDiscount(0);
    setDiscountType('fixed');
    setCustomerName('');
    setTableGroup(null);
    setTableNumber(null);
  } catch (err) {
    console.error('Error saving or printing order:', err);
    toast({ title: 'Error', description: 'Could not save or print the order.', variant: 'destructive' });
  }
};


  // Supabase hooks
  const { data: menuItems = [], isLoading: isLoadingMenu, refetch: refetchMenu } = useMenuItems(user.id);
  const { data: nextOrderNumber = 1 } = useNextOrderNumber(user.id);
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const createOrder = useCreateOrder();
  // Ensure we have a typed array for TypeScript and derive categories
  const menuItemsArray: MenuItem[] = (menuItems as MenuItem[]) || [];

  const dbCategories: string[] = menuItemsArray.length > 0
    ? Array.from(new Set(menuItemsArray.map((item: MenuItem) => item.category)))
    : DB_CATEGORIES;

  const sidebarCategories: string[] = ['All', ...dbCategories];

  // Keyboard shortcut for milk tea
  useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (event.key.toLowerCase() === 't') {
        // Find the first milk tea item
        const milkTeaItem = menuItemsArray.find(item => 
          item.name.toLowerCase().includes('milk tea') || 
          item.name.toLowerCase().includes('milktea')
        );
        
        if (milkTeaItem) {
          addToOrder(milkTeaItem);
          toast({
            title: "Quick add",
            description: `${milkTeaItem.name} added to order with keyboard shortcut 'T'`,
          });
        } else {
          toast({
            title: "No milk tea found",
            description: "Add a milk tea item to your menu to use this shortcut",
            variant: "destructive",
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [menuItemsArray, toast]);

  const filteredItems = menuItemsArray.filter(item => {
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

  // Add a one-off item (name + price) to the current order without touching the menu
  const addOneOffItem = () => {
    const price = parseFloat(oneOffPrice);
    if (!oneOffName || isNaN(price) || price <= 0) {
      toast({
        title: 'Invalid one-off item',
        description: 'Please enter a name and valid price for the one-off item.',
        variant: 'destructive',
      });
      return;
    }

    const id = `oneoff-${Date.now()}`;
    const item = {
      id,
      name: oneOffName,
      quantity: 1,
      unitPrice: price,
      total: price,
    } as CartItem;

    setOrderItems(prev => [...prev, item]);
    setOneOffName('');
    setOneOffPrice('');
  };

  const updateQuantity = (id: string, change: number) => {
    setOrderItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 
            ? null 
            : { ...item, quantity: newQuantity, total: newQuantity * item.unitPrice };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromOrder = (id: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== id));
  };

  const clearAllItems = () => {
    setOrderItems([]);
    setDiscount(0);
    setDiscountType('fixed');
    toast({
      title: "Order cleared",
      description: "All items have been removed from the order.",
    });
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount / 100) 
    : discount;
  const total = Math.max(0, subtotal - discountAmount);

  const handleSaveOrder = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Cannot save order",
        description: "Add items to the order first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        order_number: nextOrderNumber,
        owner_id: user.id,
        subtotal,
        discount: discountAmount,
        total,
        // optional extra fields
        customer_name: customerName || null,
        table_group: tableGroup || null,
        table_number: tableNumber || null,
        payment_method: paymentMethod,
      };

      const orderItemsData = orderItems.map(item => ({
        // If this is a one-off item (generated id starts with 'oneoff-'), set item_id null
        // and include the name so the DB can store custom item names.
        item_id: item.id && item.id.toString().startsWith('oneoff-') ? null : item.id,
        name: item.id && item.id.toString().startsWith('oneoff-') ? item.name : undefined,
        quantity: item.quantity,
        price: item.unitPrice,
        total: item.total,
      }));

      await createOrder.mutateAsync({
        order: orderData,
        orderItems: orderItemsData,
      });

      // Clear the order
      setOrderItems([]);
      setDiscount(0);
      setDiscountType('fixed');
      setCustomerName('');
      setTableGroup(null);
      setTableNumber(null);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  // Menu editing functions
  const handleSaveMenuItem = async () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        await updateMenuItem.mutateAsync({
          id: editingItem.id,
          updates: {
            name: formData.name,
            category: formData.category,
            price,
            image_url: formData.image_url || null,
          },
        });
      } else {
        await createMenuItem.mutateAsync({
          name: formData.name,
          category: formData.category,
          price,
          image_url: formData.image_url || null,
          owner_id: user.id,
        });
      }

      setFormData({ name: '', category: 'Tea', price: '', image_url: '' });
      setEditingItem(null);
      setIsAddingItem(false);
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      image_url: item.image_url || '',
    });
    setIsAddingItem(true);
  };

  const handleDeleteMenuItem = async (id: string) => {
    try {
      await deleteMenuItem.mutateAsync(id);
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const cancelEdit = () => {
    setFormData({ name: '', category: 'Tea', price: '', image_url: '' });
    setEditingItem(null);
    setIsAddingItem(false);
  };

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
      {/* Menu Section */}
      <Card className="shadow-card lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Menu Items</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchMenu()}
                disabled={isLoadingMenu}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingMenu ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingMenu(!isEditingMenu)}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>{isEditingMenu ? 'View Mode' : 'Edit Menu'}</span>
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex gap-4">
            {/* Categories Sidebar */}
              <div className="w-28 flex-shrink-0">
              <div className="space-y-1">
                {sidebarCategories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {category === 'All' ? 'All' : (categoryDisplayMap[category] ?? category)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Menu Items Container with Scrolling */}
            <div className="flex-1">
              {/* Fixed Edit Menu Section */}
              {isEditingMenu && (
                <div className="border rounded-lg p-4 bg-muted/50 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm">
                      {isAddingItem ? (editingItem ? 'Edit Item' : 'Add New Item') : 'Menu Management'}
                    </h4>
                    {!isAddingItem && (
                      <Button
                        size="sm"
                        onClick={() => setIsAddingItem(true)}
                        className="flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Item</span>
                      </Button>
                    )}
                  </div>

                  {isAddingItem && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="name" className="text-sm">Name *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Item name"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="price" className="text-sm">Price *</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            placeholder="0.00"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="category" className="text-sm">Category *</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {dbCategories.map(category => (
                                <SelectItem key={category} value={category} className="text-sm">
                                  {categoryDisplayMap[category] ?? category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="image" className="text-sm">Image/Emoji</Label>
                          <Input
                            id="image"
                            value={formData.image_url}
                            onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                            placeholder="🍕 or image URL"
                            className="text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={cancelEdit}>
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveMenuItem}>
                          <Save className="w-3 h-3 mr-1" />
                          {editingItem ? 'Update' : 'Add'} Item
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Scrollable Menu Items Grid */}
              <div className="h-[calc(100vh-20rem)] overflow-y-auto p-2">
                {isLoadingMenu ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading menu...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className={`relative p-3 border rounded-xl transition-all duration-200 ${
                        !isEditingMenu 
                          ? 'cursor-pointer hover:bg-primary/5 hover:border-primary/30 hover:shadow-lg hover:scale-105' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => !isEditingMenu && addToOrder(item)}
                    >
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center text-xl shadow-sm">
                          {item.image_url || '🍽️'}
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-sm text-foreground leading-tight">{item.name}</h3>
                          <Badge variant="secondary" className="text-xs font-medium">
                            {item.category}
                          </Badge>
                          <p className="text-lg font-bold text-primary">NRs {item.price}</p>
                        </div>
                      </div>
                      
                      {isEditingMenu && (
                        <div className="absolute top-1 right-1 flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditMenuItem(item);
                            }}
                            className="w-6 h-6 p-0 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMenuItem(item.id);
                            }}
                            className="w-6 h-6 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      
                      {!isEditingMenu && (
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent hover:border-primary/30 transition-all pointer-events-none" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Section - Fixed */}
      <Card className="shadow-card flex flex-col h-fit max-h-full">
        <CardHeader className="pb-3 flex-shrink-0">
          <CardTitle className="flex items-center justify-between text-lg">
              <span>Order</span>
              <Badge variant="outline" className="text-xs">
                #{nextOrderNumber}{customerName ? ` — ${customerName}` : ''}{tableNumber ? ` — ${tableNumber}` : ''}
              </Badge>
            </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 flex-1 overflow-hidden flex flex-col">
          {/* Customer name and table selection */}
          <div className="space-y-2">
            <Label className="text-xs">Customer name (optional)</Label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. John" className="text-sm" />

            <div className="flex items-center space-x-2 mt-2">
              <div className="flex-1">
                <Label className="text-xs">Table group (optional)</Label>
                <Select value={tableGroup ?? ''} onValueChange={(v) => { setTableGroup(v || null); setTableNumber(null); }}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="T">T</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="w-28">
                <Label className="text-xs">Table #</Label>
                <Select value={tableNumber ?? ''} onValueChange={(v) => setTableNumber(v || null)}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="-" /></SelectTrigger>
                  <SelectContent>
                    {(() => {
                      if (!tableGroup) return null;
                      if (tableGroup === 'T') return ['T0', 'T1', 'T2', 'T3'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>);
                      if (tableGroup === 'G') return ['G0', 'G1', 'G2'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>);
                      // For A, B, C -> tables 1..8
                      if (['A', 'B', 'C'].includes(tableGroup)) return Array.from({ length: 8 }, (_, i) => `${tableGroup}${i+1}`).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ));
                      // For D -> tables 1..2
                      if (tableGroup === 'D') return Array.from({ length: 2 }, (_, i) => `${tableGroup}${i+1}`).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ));
                      // Fallback: keep previous behavior (5 tables)
                      return Array.from({ length: 5 }, (_, i) => `${tableGroup}${i+1}`).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ));
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* One-off item input: name + price (does not change menu) */}
            <div className="mt-3">
              <Label className="text-xs">One-off item</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="Item name"
                  value={oneOffName}
                  onChange={(e) => setOneOffName(e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="0.00"
                  value={oneOffPrice}
                  onChange={(e) => setOneOffPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  className="w-28 text-sm"
                />
                <Button size="sm" onClick={addOneOffItem}>
                  Add
                </Button>
              </div>
            </div>
          </div>
          {orderItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No items in order</p>
              <p className="text-xs">Add items to get started</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 flex-1 overflow-y-auto">
                {orderItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">NRs {item.unitPrice} each</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <div className="flex items-center space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-medium text-xs min-w-[1.5rem] text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="font-semibold text-xs min-w-[2.5rem] text-right">NRs {item.total}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFromOrder(item.id)}
                        className="w-6 h-6 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 space-y-3 mt-auto">
                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-semibold">NRs {subtotal}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-xs">Discount:</Label>
                    <div className="flex items-center space-x-1">
                      <Select value={discountType} onValueChange={(value: 'fixed' | 'percentage') => {
                        setDiscountType(value);
                        // Reset discount when switching types to avoid invalid values
                        if (value === 'percentage' && discount > 100) {
                          setDiscount(0);
                        }
                      }}>
                        <SelectTrigger className="w-16 h-6 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Rs</SelectItem>
                          <SelectItem value="percentage">%</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="discount"
                        type="number"
                        step={discountType === 'percentage' ? "1" : "5"}
                        min="0"
                        max={discountType === 'percentage' ? "100" : undefined}
                        value={discount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (value >= 0) {
                            if (discountType === 'percentage' && value <= 100) {
                              setDiscount(value);
                            } else if (discountType === 'fixed') {
                              setDiscount(value);
                            }
                          }
                        }}
                        className="w-16 h-6 text-xs text-right"
                        placeholder="0"
                      />
                    </div>
                    {discountType === 'percentage' && discount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {discount}% = Rs {discountAmount.toFixed(0)}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span className="text-primary">NRs {total}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Payment</Label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`px-3 py-1 rounded-lg border transition-colors text-sm ${paymentMethod === 'cash' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-200 text-gray-700 border-gray-200'}`}
                      >
                        Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('online')}
                        className={`px-3 py-1 rounded-lg border transition-colors text-sm ${paymentMethod === 'online' ? 'bg-green-600 text-white border-green-600' : 'bg-gray-200 text-gray-700 border-gray-200'}`}
                      >
                        Online
                      </button>
                    </div>
                  </div>
                </div>
                  <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={clearAllItems}
                    variant="outline"
                    className="group flex-1 min-w-0 hover:bg-destructive hover:text-destructive-foreground"
                    size="sm"
                    disabled={orderItems.length === 0}
                  >
                    <span className="w-5 inline-flex items-center justify-center text-muted-foreground">
                      <Trash2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-white transition-opacity duration-150" />
                    </span>
                    <span>Clear</span>
                  </Button>

                  {/* Print button - icon a
                  ppears on hover; reserved icon space prevents shifting */}
                  <Button
                    type="button"
                    onClick={handlePrint}
                    variant="outline"
                    className="group flex-1 min-w-0"
                    size="sm"
                    disabled={createOrder.isPending || orderItems.length === 0}
                  >
                    <span className="w-5 inline-flex items-center justify-center text-muted-foreground">
                      <Printer className="w-3 h-3 opacity-0 group-hover:opacity-100 text-white transition-opacity duration-150" />
                    </span>
                    <span>Print</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSaveOrder}
                    className="group flex-1 min-w-0"
                    size="sm"
                    disabled={createOrder.isPending || orderItems.length === 0}
                  >
                    <span className="w-5 inline-flex items-center justify-center text-muted-foreground">
                      {createOrder.isPending ? (
                        <RefreshCw className="w-3 h-3 mr-0 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3 opacity-0 group-hover:opacity-100 text-white transition-opacity duration-150" />
                      )}
                    </span>
                    <span>{createOrder.isPending ? 'Saving' : 'Save'}</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
