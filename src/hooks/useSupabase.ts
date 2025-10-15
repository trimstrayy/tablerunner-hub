import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  MenuItem, 
  MenuItemInsert, 
  MenuItemUpdate,
  Order,
  OrderInsert,
  OrderItem,
  OrderItemInsert,
  User
} from '@/types/database';
import { useToast } from '@/hooks/use-toast';

// Menu Items Hooks - Optimized with caching
export const useMenuItems = (ownerId?: string) => {
  return useQuery({
    queryKey: ['menu-items', ownerId],
    queryFn: async () => {
      let query = supabase.from('menu_items').select('*');
      
      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as MenuItem[];
    },
    enabled: !!ownerId,
    staleTime: 5 * 60 * 1000, // 5 minutes - menu items don't change frequently
    refetchOnWindowFocus: false, // Don't refetch when user returns to tab
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (menuItem: MenuItemInsert) => {
      const { data, error } = await supabase
        .from('menu_items')
        .insert(menuItem)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Menu item created",
        description: `${data.name} has been added to the menu.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: MenuItemUpdate }) => {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Menu item updated",
        description: `${data.name} has been updated.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast({
        title: "Menu item deleted",
        description: "The item has been removed from the menu.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting menu item",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Orders Hooks
export const useOrders = (ownerId?: string) => {
  return useQuery({
    queryKey: ['orders', ownerId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (*)
          )
        `);
      
      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }
      
      const { data, error } = await query.order('order_number', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};

// Get next sequential order number for a specific owner
export const useNextOrderNumber = (ownerId?: string) => {
  return useQuery({
    queryKey: ['next-order-number', ownerId],
    queryFn: async () => {
      if (!ownerId) return 1;
      
      const { data, error } = await supabase
        .from('orders')
        .select('order_number')
        .eq('owner_id', ownerId)
        .order('order_number', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      // If no orders exist, start from 1, otherwise increment the highest order number
      return data.length > 0 ? data[0].order_number + 1 : 1;
    },
    enabled: !!ownerId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      order, 
      orderItems 
    }: { 
      order: OrderInsert; 
      orderItems: Omit<OrderItemInsert, 'order_id'>[] 
    }) => {
      // Create the order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();
      
      if (orderError) throw orderError;
      
      // Create order items
      const orderItemsWithOrderId = orderItems.map(item => ({
        ...item,
        order_id: orderData.id,
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);
      
      if (itemsError) throw itemsError;
      
      return orderData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['next-order-number'] });
      toast({
        title: "Order saved",
        description: `Order #${data.order_number} has been saved successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error saving order",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Users/Owners Hooks (for admin dashboard)
export const useOwners = () => {
  return useQuery({
    queryKey: ['owners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'owner')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as User[];
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      orderId,
      updates,
      orderItems,
    }: {
      orderId: string;
      updates: Partial<Order>;
      orderItems: Omit<OrderItemInsert, 'order_id'>[];
    }) => {
      // Delete existing order_items for this order
      const { error: deleteError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) throw deleteError;

      // Insert new order items
      const orderItemsWithOrderId = orderItems.map(item => ({ ...item, order_id: orderId }));
      const { error: insertError } = await supabase
        .from('order_items')
        .insert(orderItemsWithOrderId);

      if (insertError) throw insertError;

      // Update order totals
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (orderUpdateError) throw orderUpdateError;

      // Return the refreshed order with nested order_items and menu_items
      const { data: refreshedOrder, error: fetchError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (*)
          )
        `)
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;
      return refreshedOrder;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Order updated',
        description: `Order #${data.order_number} updated successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};