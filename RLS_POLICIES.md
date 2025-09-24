# Row-Level Security (RLS) Policies for TableRunner Hub

This document contains the SQL scripts to set up Row-Level Security policies for the TableRunner Hub database. These policies ensure that:

- **Admins**: Can only read the users table (no menu or orders access)
- **Owners**: Can read/write only their own orders and menu items

## Prerequisites

Before applying these policies, ensure you have the following tables created in your Supabase database:

- `users` (with columns: id, email, password, role, hotel_name, hotel_location, created_at)
- `menu_items` (with columns: id, name, category, price, image_url, owner_id, created_at)
- `orders` (with columns: id, order_number, owner_id, subtotal, discount, total, created_at)
- `order_items` (with columns: id, order_id, item_id, quantity, price, total)

## SQL Scripts

### 1. Enable RLS on all tables

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on menu_items table
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Enable RLS on order_items table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
```

### 2. Users Table Policies

```sql
-- Policy: Admins can read all users (to view owners list)
CREATE POLICY "Admins can read all users" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can register" ON users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
```

### 3. Menu Items Table Policies

```sql
-- Policy: Owners can read their own menu items
CREATE POLICY "Owners can read own menu items" ON menu_items
  FOR SELECT
  USING (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Policy: Owners can insert their own menu items
CREATE POLICY "Owners can insert own menu items" ON menu_items
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Policy: Owners can update their own menu items
CREATE POLICY "Owners can update own menu items" ON menu_items
  FOR UPDATE
  USING (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  )
  WITH CHECK (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Policy: Owners can delete their own menu items
CREATE POLICY "Owners can delete own menu items" ON menu_items
  FOR DELETE
  USING (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );
```

### 4. Orders Table Policies

```sql
-- Policy: Owners can read their own orders
CREATE POLICY "Owners can read own orders" ON orders
  FOR SELECT
  USING (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Policy: Owners can insert their own orders
CREATE POLICY "Owners can insert own orders" ON orders
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Policy: Owners can update their own orders
CREATE POLICY "Owners can update own orders" ON orders
  FOR UPDATE
  USING (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  )
  WITH CHECK (
    owner_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );
```

### 5. Order Items Table Policies

```sql
-- Policy: Owners can read order items for their own orders
CREATE POLICY "Owners can read own order items" ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON o.owner_id = u.id
      WHERE o.id = order_items.order_id 
      AND u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Policy: Owners can insert order items for their own orders
CREATE POLICY "Owners can insert own order items" ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON o.owner_id = u.id
      WHERE o.id = order_items.order_id 
      AND u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );

-- Policy: Owners can update order items for their own orders
CREATE POLICY "Owners can update own order items" ON order_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON o.owner_id = u.id
      WHERE o.id = order_items.order_id 
      AND u.id = auth.uid() 
      AND u.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o 
      JOIN users u ON o.owner_id = u.id
      WHERE o.id = order_items.order_id 
      AND u.id = auth.uid() 
      AND u.role = 'owner'
    )
  );
```

### 6. Additional Security Functions (Optional)

```sql
-- Function to get current user role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is owner
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_current_user_role() = 'owner';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Implementation Notes

1. **Authentication**: The policies assume you're using Supabase's built-in authentication with `auth.uid()`.

2. **Role-based Access**: 
   - Admins can only view the users table to see owner information
   - Owners can manage their own menu items and orders
   - No cross-owner data access is allowed

3. **Data Isolation**: Each owner can only see and modify their own data, ensuring complete data isolation between different restaurant owners.

4. **Admin Restrictions**: Admins are explicitly restricted from accessing menu items and orders, maintaining clear separation of concerns.

## Testing the Policies

After implementing these policies, test them by:

1. Creating an admin user and verifying they can only access the users table
2. Creating owner users and verifying they can only access their own data
3. Attempting cross-owner data access to ensure it's blocked
4. Testing all CRUD operations for each role

## Troubleshooting

If you encounter issues:

1. Check that RLS is enabled on all tables
2. Verify that the `auth.uid()` function returns the correct user ID
3. Ensure your frontend is properly authenticated with Supabase
4. Test policies individually by temporarily disabling others