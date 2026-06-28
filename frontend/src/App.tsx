import { useEffect, useState } from 'react';
import { StaffPortal } from './components/StaffPortal/StaffPortal';
import { AdminPortal } from './components/Admin/AdminPortal';
import { Login } from './components/Auth/Login';
import { USER_ROLES, type UserRole } from 'shared/constants';
import './App.css';
import { apiFetch } from './api/apiFetch';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const handleLogin = (userRole: UserRole) => {
    setRole(userRole);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsAuthenticated(false);
      setRole(null);
    }
  };

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await apiFetch('/auth/me');

        if (!response.ok) {
          setIsAuthenticated(false);
          setRole(null);
          return;
        }

        const result = await response.json();

        const userRole = result.data.role as UserRole;

        if (
          userRole !== USER_ROLES.ADMIN &&
          userRole !== USER_ROLES.EMPLOYEE
        ) {
          setIsAuthenticated(false);
          setRole(null);
          return;
        }

        setRole(userRole);
        setIsAuthenticated(true);
      } catch (error) {
        console.error(error);
        setIsAuthenticated(false);
        setRole(null);
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-[#4a6741]/30 border-t-[#4a6741] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !role) {
    return <Login onLogin={handleLogin} />;
  }

  if (role === USER_ROLES.EMPLOYEE) {
    return (
      <div className="relative">
        <StaffPortal onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="relative">
      <AdminPortal onLogout={handleLogout} />
    </div>
  );
}

export default App;
