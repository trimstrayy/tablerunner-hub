import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AuthUser } from '@/types/database';

const Index = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved user session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('tablerunner_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('tablerunner_user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (authUser: AuthUser) => {
    setUser(authUser);
    // Save user to localStorage for persistent login
    localStorage.setItem('tablerunner_user', JSON.stringify(authUser));
  };

  const handleLogout = () => {
    setUser(null);
    // Clear user from localStorage
    localStorage.removeItem('tablerunner_user');
  };

  // Show loading while checking for saved session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
