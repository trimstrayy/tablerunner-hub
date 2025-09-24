import { Database } from '@/integrations/supabase/types';

// Type aliases for easier usage
export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderInsert = Database['public']['Tables']['orders']['Insert'];
export type OrderUpdate = Database['public']['Tables']['orders']['Update'];

export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];
export type OrderItemUpdate = Database['public']['Tables']['order_items']['Update'];

export type MenuItem = Database['public']['Tables']['menu_items']['Row'];
export type MenuItemInsert = Database['public']['Tables']['menu_items']['Insert'];
export type MenuItemUpdate = Database['public']['Tables']['menu_items']['Update'];

// Extended types for frontend use
export type UserRole = 'admin' | 'owner';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  hotel_name?: string;
  hotel_location?: string;
}

export interface OrderWithItems extends Order {
  order_items: (OrderItem & {
    menu_item: MenuItem | null;
  })[];
}

export interface MenuItemWithOwner extends MenuItem {
  owner: User | null;
}

// Frontend-specific types
export interface CartItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderSummary {
  orderNumber: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}