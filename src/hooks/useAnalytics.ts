import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

// Analytics data types (Activity-focused, no monetary data)
export interface AnalyticsData {
  totalOrders: number;
  activeUsers: number;
  ordersToday: number;
  activeUsersToday: number;
  orderTrends: OrderTrend[];
  popularItems: PopularItem[];
  userStats: UserStats[];
  recentActivity: RecentActivity[];
}

export interface OrderTrend {
  date: string;
  orders: number;
  activeUsers: number;
}

export interface PopularItem {
  name: string;
  category: string;
  totalOrdered: number;
  orderCount: number;
}

export interface UserStats {
  id: string;
  email: string;
  full_name: string | null;
  hotel_name: string | null;
  totalOrders: number;
  lastOrderDate: string | null;
  ordersToday: number;
  lastActiveDate: string | null;
  status: 'active' | 'inactive';
  daysActive: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'user_login' | 'user_register';
  description: string;
  timestamp: string;
  user_email: string;
  orderCount?: number;
}

// Hook to get comprehensive analytics data - Optimized
export const useAnalyticsData = () => {
  return useQuery({
    queryKey: ['analytics-data'],
    queryFn: async (): Promise<AnalyticsData> => {
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);
      const last7Days = subDays(today, 7);

      // Fetch all orders with related data
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items (*)
          ),
          owner:users!orders_owner_id_fkey (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch all users
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'owner');

      if (usersError) throw usersError;

      // Calculate activity metrics
      const totalOrders = orders?.length || 0;

      // Today's metrics
      const ordersToday = orders?.filter(order => 
        new Date(order.created_at) >= todayStart && new Date(order.created_at) <= todayEnd
      ).length || 0;

      // Active users (users who made orders today)
      const activeUsersToday = new Set(
        orders?.filter(order => 
          new Date(order.created_at) >= todayStart && new Date(order.created_at) <= todayEnd
        ).map(order => order.owner_id)
      ).size;

      // Total active users (users who made at least one order)
      const activeUsers = new Set(orders?.map(order => order.owner_id)).size;

      // Order trends for last 7 days
      const orderTrends: OrderTrend[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayOrders = orders?.filter(order => 
          new Date(order.created_at) >= dayStart && new Date(order.created_at) <= dayEnd
        ) || [];

        const dayActiveUsers = new Set(dayOrders.map(order => order.owner_id)).size;

        orderTrends.push({
          date: format(date, 'MMM dd'),
          orders: dayOrders.length,
          activeUsers: dayActiveUsers
        });
      }

      // Popular menu items (activity-based)
      const itemStats = new Map<string, { name: string; category: string; count: number; orderCount: number }>();
      
      orders?.forEach(order => {
        order.order_items?.forEach(item => {
          if (item.menu_item) {
            const key = item.menu_item.id;
            const existing = itemStats.get(key);
            if (existing) {
              existing.count += item.quantity;
              existing.orderCount += 1;
            } else {
              itemStats.set(key, {
                name: item.menu_item.name,
                category: item.menu_item.category,
                count: item.quantity,
                orderCount: 1
              });
            }
          }
        });
      });

      const popularItems: PopularItem[] = Array.from(itemStats.values())
        .map(item => ({
          name: item.name,
          category: item.category,
          totalOrdered: item.count,
          orderCount: item.orderCount
        }))
        .sort((a, b) => b.totalOrdered - a.totalOrdered)
        .slice(0, 10);

      // User activity statistics
      const userStats: UserStats[] = users?.map(user => {
        const userOrders = orders?.filter(order => order.owner_id === user.id) || [];
        const userOrdersToday = userOrders.filter(order => 
          new Date(order.created_at) >= todayStart && new Date(order.created_at) <= todayEnd
        );
        const lastOrder = userOrders.length > 0 ? userOrders[0] : null;
        
        // Calculate days active (days with at least one order)
        const activeDays = new Set(
          userOrders.map(order => format(new Date(order.created_at), 'yyyy-MM-dd'))
        ).size;

        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          hotel_name: user.hotel_name,
          totalOrders: userOrders.length,
          lastOrderDate: lastOrder?.created_at || null,
          lastActiveDate: lastOrder?.created_at || null,
          ordersToday: userOrdersToday.length,
          daysActive: activeDays,
          status: userOrders.length > 0 ? 'active' : 'inactive' as const
        };
      }) || [];

      // Recent activity
      const recentActivity: RecentActivity[] = orders
        ?.slice(0, 20)
        .map(order => ({
          id: order.id,
          type: 'order' as const,
          description: `Order #${order.order_number} placed`,
          timestamp: order.created_at,
          user_email: order.owner?.email || 'Unknown',
          orderCount: order.order_items?.length || 0
        })) || [];

      return {
        totalOrders,
        activeUsers,
        ordersToday,
        activeUsersToday,
        orderTrends,
        popularItems,
        userStats,
        recentActivity
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - analytics can be slightly stale
    cacheTime: 10 * 60 * 1000, // 10 minutes in cache
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on focus for heavy analytics
  });
};

// Hook for real-time order statistics (activity-focused)
export const useOrderStats = (ownerId?: string) => {
  return useQuery({
    queryKey: ['order-stats', ownerId],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*');

      if (ownerId) {
        query = query.eq('owner_id', ownerId);
      }

      const { data: orders, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const today = startOfDay(new Date());
      const todayOrders = orders?.filter(order => new Date(order.created_at) >= today) || [];

      return {
        totalOrders: orders?.length || 0,
        todayOrders: todayOrders.length,
        totalItems: orders?.reduce((sum, order) => sum + (order.order_items?.length || 0), 0) || 0,
        avgOrderSize: orders?.length ? (orders.reduce((sum, order) => sum + (order.order_items?.length || 0), 0) / orders.length).toFixed(1) : 0
      };
    },
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time feel
  });
};

// Hook for user activity tracking
export const useUserActivity = () => {
  return useQuery({
    queryKey: ['user-activity'],
    queryFn: async () => {
      const today = startOfDay(new Date());
      
      // Get users who made orders today
      const { data: todayOrders, error: ordersError } = await supabase
        .from('orders')
        .select('owner_id, owner:users!orders_owner_id_fkey(*)')
        .gte('created_at', today.toISOString());

      if (ordersError) throw ordersError;

      const activeToday = new Set(todayOrders?.map(order => order.owner_id)).size;
      const uniqueUsers = todayOrders?.reduce((acc, order) => {
        if (order.owner && !acc.find(u => u.id === order.owner.id)) {
          acc.push(order.owner);
        }
        return acc;
      }, [] as any[]) || [];

      return {
        activeUsersToday: activeToday,
        activeUsers: uniqueUsers
      };
    },
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
};