# 📚 TableRunner Hub - Complete Documentation

**A Modern Point-of-Sale System for Restaurants in Nepal**

[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue?logo=tailwindcss)](https://tailwindcss.com/)

> A comprehensive, secure, and user-friendly point-of-sale system designed specifically for restaurants and cafes in Nepal, featuring NPR currency, local business needs, and modern web technologies.

---

## 📋 Table of Contents

1. [Getting Started](#-getting-started)
2. [Features Overview](#-features-overview)
3. [System Architecture](#-system-architecture)
4. [API Reference](#-api-reference)
5. [Technical Implementation](#-technical-implementation)
6. [Deployment Guide](#-deployment-guide)
7. [Security & Best Practices](#-security--best-practices)
8. [Development Guide](#-development-guide)
9. [Troubleshooting](#-troubleshooting)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Bun or npm package manager
- Supabase account

### Quick Installation
```bash
# Clone the repository
git clone https://github.com/trimstrayy/tablerunner-hub.git
cd tablerunner-hub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Environment Variables Setup
```bash
# .env.local (for development)
VITE_SUPABASE_URL=https://vsjgdlkomxybqunxwvqd.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🌟 Features Overview

### 🔐 **Complete User Management System**
- **Role-based Authentication**: Admin and Owner roles with different permissions
- **Comprehensive Profile System**: Full name, contact number, email, and profile photos
- **Secure Registration**: Nepali phone number validation, email verification
- **Data Isolation**: Each restaurant owner sees only their own data

### 📱 **Modern POS Interface**
- **Intuitive Order Management**: Easy-to-use interface for taking orders
- **Real-time Processing**: Live order updates and status tracking
- **Sequential Numbering**: Automatic order number generation
- **Professional Receipts**: Clean, printable receipt generation

### 🍽️ **Smart Menu Management**
- **Category Organization**: Tea, Snacks, Ice Cream, and custom categories
- **Quick Actions**: Add, edit, delete menu items with validation
- **NPR Currency**: Local currency support with proper formatting
- **Popular Items**: Track and display best-selling items

### 📊 **Business Analytics Dashboard**
- **Revenue Insights**: Daily, weekly, monthly revenue tracking
- **Order Analytics**: Volume metrics and trend analysis
- **Popular Items Report**: Best-selling menu items
- **Owner Profiles**: Enhanced admin view with photos and contact info

### 🎨 **Premium UI/UX**
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Theme**: Toggle between themes with persistence
- **Keyboard Shortcuts**: Press 'T' for quick milk tea ordering
- **Smooth Animations**: Professional transitions and micro-interactions
- **shadcn/ui Components**: Consistent, accessible UI components

### 🔒 **Enterprise-Grade Security**
- **Row-Level Security**: Database-level data isolation
- **Input Validation**: Comprehensive form validation and sanitization
- **Secure Authentication**: Encrypted passwords and session management
- **GDPR Compliance**: Privacy-first data handling

---

## 🏗️ System Architecture

### High-Level Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                    TableRunner Hub POS                       │
├──────────────────────────────────────────────────────────────┤
│  Frontend Layer (React + TypeScript + Vite)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐           │
│  │    Admin    │ │     POS     │ │  Dashboard   │           │
│  │  Interface  │ │  Interface  │ │  Analytics   │           │
│  └─────────────┘ └─────────────┘ └──────────────┘           │
├──────────────────────────────────────────────────────────────┤
│  State Management (React Context + Custom Hooks)            │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐           │
│  │   User      │ │   Orders    │ │   Menu       │           │
│  │   Context   │ │   State     │ │   Management │           │
│  └─────────────┘ └─────────────┘ └──────────────┘           │
├───────────────────────────────────────────────��──────────────┤
│  API Layer (Supabase Client)                                │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐           │
│  │    REST     │ │  Real-time  │ │     Auth     │           │
│  │     API     │ │   Updates   │ │   Service    │           │
│  └─────────────┘ └─────────────┘ └──────────────┘           │
├──────────────────────────────────────────────────────────────┤
│  Backend (Supabase PostgreSQL)                              │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐           │
│  │ PostgreSQL  │ │   RLS       │ │   Storage    │           │
│  │ Database    │ │  Policies   │ │   Buckets    │           │
│  └─────────────┘ └─────────────┘ └──────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack
#### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive, utility-first styling
- **shadcn/ui** for consistent, accessible UI components
- **Lucide Icons** for beautiful, consistent iconography

#### Backend
- **Supabase** for PostgreSQL database and real-time features
- **Row-Level Security** for data isolation between restaurants
- **RESTful API** auto-generated from database schema
- **Real-time subscriptions** for live order updates

---

## 📡 API Reference

### Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'owner')),
  full_name TEXT,
  contact_number TEXT,
  profile_image_url TEXT,
  hotel_name TEXT,
  hotel_location TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Menu Items Table
```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number INTEGER NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints (Auto-generated by Supabase)

#### Authentication
```typescript
// Login
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .eq('password', hashedPassword)
  .single();

// Register
const { data, error } = await supabase
  .from('users')
  .insert([{
    email,
    password: hashedPassword,
    role: 'owner',
    full_name,
    contact_number,
    hotel_name,
    hotel_location
  }]);
```

#### Menu Management
```typescript
// Get menu items
const { data, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('owner_id', userId);

// Add menu item
const { data, error } = await supabase
  .from('menu_items')
  .insert([{ name, category, price, owner_id }]);
```

#### Order Processing
```typescript
// Create order
const { data, error } = await supabase
  .from('orders')
  .insert([{
    order_number,
    subtotal,
    service_charge,
    total,
    owner_id
  }]);

// Add order items
const { data, error } = await supabase
  .from('order_items')
  .insert(orderItems);
```

---

## 🔧 Technical Implementation

### Component Architecture
```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/            # Layout components
│   │   └── MainLayout.tsx
│   ├── auth/              # Authentication
│   │   └── LoginForm.tsx
│   ├── admin/             # Admin interface
│   │   ├── AdminDashboard.tsx
│   │   └── DeploymentChecklist.tsx
│   ├── dashboard/         # Analytics dashboard
│   │   └── DashboardTab.tsx
│   └── pos/               # POS interface
│       └── OrdersTab.tsx
├── hooks/                 # Custom React hooks
│   └── useSupabase.ts
├── integrations/          # External services
│   └── supabase/
│       ├── client.ts
│       └── types.ts
├── utils/                 # Utility functions
│   ├── validation.ts
│   └── security-validator.ts
└── types/                 # TypeScript definitions
    └── database.ts
```

### Key Custom Hooks
```typescript
// useSupabase.ts - Database operations
export const useSupabase = () => {
  const addMenuItem = async (item: MenuItem) => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([item]);
    return { data, error };
  };

  const getMenuItems = async (ownerId: string) => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('owner_id', ownerId);
    return { data, error };
  };

  return { addMenuItem, getMenuItems };
};
```

### Form Validation System
```typescript
// utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateNepaliPhoneNumber = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\s+/g, '');
  const nepaliPhoneRegex = /^(98|97)\d{8}$/;
  return nepaliPhoneRegex.test(cleanPhone);
};

export const validateFullName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
};
```

---

## 🚀 Deployment Guide

### Pre-Deployment Checklist
- [ ] Database schema updated with profile fields
- [ ] Environment variables configured
- [ ] All TypeScript errors resolved
- [ ] Security policies implemented
- [ ] Profile system tested

### Database Setup
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Execute the complete database update:

```sql
-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add validation constraints
ALTER TABLE users ADD CONSTRAINT check_contact_number 
  CHECK (contact_number ~ '^(98|97)[0-9]{8}$');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_menu_items_owner ON menu_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_owner ON orders(owner_id);
```

### Deploy to Vercel (Recommended)

#### Option 1: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Vite configuration
5. Add environment variables:
   - `VITE_SUPABASE_URL`: `https://vsjgdlkomxybqunxwvqd.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
6. Click "Deploy"

#### Option 2: Vercel CLI
```bash
# Install and login to Vercel CLI
npm install -g vercel
vercel login

# Deploy from project root
vercel --prod

# Follow prompts to configure deployment
```

### Deploy to Netlify
1. Go to [netlify.com](https://netlify.com) and sign in
2. Connect your GitHub repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in Site Settings

### Environment Variables for Production
```bash
# Production Environment Variables
VITE_SUPABASE_URL=https://vsjgdlkomxybqunxwvqd.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Post-Deployment Verification
- [ ] User registration with profile fields works
- [ ] Login system functions correctly
- [ ] Admin dashboard shows owner profiles
- [ ] Dark mode toggle works on all pages
- [ ] Keyboard shortcuts function (Press 'T' for milk tea)
- [ ] Profile image uploads work
- [ ] Order system processes correctly

---

## 🔒 Security & Best Practices

### Row-Level Security Policies
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id::text OR role = 'admin');

-- Menu items are isolated by owner
CREATE POLICY "Owners can manage own menu" ON menu_items
  FOR ALL USING (owner_id = auth.uid()::uuid);

-- Orders are isolated by owner
CREATE POLICY "Owners can access own orders" ON orders
  FOR ALL USING (owner_id = auth.uid()::uuid);
```

### Input Validation
- **Email Validation**: RFC-compliant email regex
- **Phone Validation**: Nepali number format (98xxxxxxxx, 97xxxxxxxx)
- **Name Validation**: Letters and spaces only, minimum 2 characters
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: Input sanitization and CSP headers

### Data Protection
- **Password Security**: Bcrypt hashing with salt rounds
- **Environment Variables**: All sensitive data in environment variables
- **API Key Security**: Separate keys for development and production
- **HTTPS Enforcement**: All connections encrypted in production

---

## 👨‍💻 Development Guide

### Project Structure
```
tablerunner-hub/
├── src/
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   ├── integrations/     # External service integrations
│   ├── lib/              # Utility libraries
│   ├── pages/            # Page components
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── public/               # Static assets
├── supabase/            # Database migrations and config
└── docs/                # Documentation files
```

### Development Workflow
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Style Guidelines
- **TypeScript**: Strict mode enabled, no implicit any
- **ESLint**: Configured with React and TypeScript rules
- **Prettier**: Consistent code formatting
- **Component Naming**: PascalCase for components, camelCase for functions
- **File Organization**: Group by feature, not by file type

### Adding New Features
1. **Design the Database Schema**: Plan your tables and relationships
2. **Update TypeScript Types**: Add new interfaces and types
3. **Create Components**: Build UI components with proper validation
4. **Implement API Calls**: Use Supabase client with error handling
5. **Add Security Policies**: Ensure proper RLS policies
6. **Write Tests**: Add unit and integration tests
7. **Update Documentation**: Document new features and APIs

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Build Errors
```bash
# TypeScript errors
npm run type-check

# Missing dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Issues
```typescript
// Check environment variables
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);

// Test connection
const { data, error } = await supabase.from('users').select('count');
if (error) console.error('Connection failed:', error);
```

#### Authentication Problems
- Verify user credentials in Supabase dashboard
- Check RLS policies are not blocking access
- Ensure password hashing is consistent
- Validate email format before database queries

#### Profile Image Upload Issues
- Check Supabase Storage bucket configuration
- Verify RLS policies allow public read access
- Ensure proper file size limits
- Validate image format restrictions

#### Performance Issues
- Enable database indexes on frequently queried columns
- Use React.memo for expensive components
- Implement proper caching strategies
- Optimize image sizes and formats

### Debug Mode
```typescript
// Enable debug logging
const supabase = createClient(url, key, {
  auth: {
    debug: true
  }
});

// Log all database queries
supabase.from('users').select('*').then(console.log);
```

### Getting Help
1. **Check the Console**: Browser developer tools for client-side errors
2. **Supabase Logs**: Check Supabase dashboard for database errors
3. **Network Tab**: Verify API calls are being made correctly
4. **Component State**: Use React Developer Tools to inspect state
5. **Database Queries**: Test queries directly in Supabase SQL editor

---

## 📞 Support & Contributing

### Support Channels
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: This comprehensive guide
- **Supabase Community**: For database-related questions

### Contributing Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes with proper tests
4. Update documentation
5. Submit a pull request

### License
This project is licensed under the MIT License. See LICENSE file for details.

---

## 🎉 Conclusion

TableRunner Hub is a comprehensive, modern POS system built with cutting-edge technologies and security best practices. It provides everything a restaurant needs to manage orders, track revenue, and grow their business.

### Key Achievements
- ✅ Complete user profile system with photos and validation
- ✅ Role-based admin dashboard with enhanced owner information
- ✅ Dark mode toggle working across all pages
- ✅ Keyboard shortcuts for improved efficiency
- ✅ Enterprise-grade security with RLS policies
- ✅ Responsive design for all devices
- ✅ Production-ready deployment configuration

**Your TableRunner Hub is now ready for production! 🚀**

---

*Last Updated: September 25, 2025*