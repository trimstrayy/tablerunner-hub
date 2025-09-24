import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AuthUser } from '@/types/database';

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Render AdminDashboard for admin users
  if (user.role === 'admin') {
    return (
      <AdminDashboard 
        userEmail={user.email}
        onLogout={handleLogout} 
      />
    );
  }

  // Render MainLayout for owner users
  return (
    <MainLayout 
      user={user}
      onLogout={handleLogout} 
    />
  );
};

export default Index;
