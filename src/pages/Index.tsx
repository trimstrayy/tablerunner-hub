import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { MainLayout } from '@/components/layout/MainLayout';

const Index = () => {
  const [user, setUser] = useState<{ email: string; role: 'admin' | 'owner'; hotelName?: string } | null>(null);

  const handleLogin = (email: string, role: 'admin' | 'owner', hotelName?: string) => {
    setUser({ email, role, hotelName });
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <MainLayout 
      userRole={user.role} 
      userEmail={user.email} 
      hotelName={user.hotelName}
      onLogout={handleLogout} 
    />
  );
};

export default Index;
