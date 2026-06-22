import { useState } from 'react';
import { StaffPortal } from './components/StaffPortal/StaffPortal';
import { AdminPortal } from './components/Admin/AdminPortal';
import { Login } from './components/Auth/Login';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<'admin' | 'staff' | null>(null);

  const handleLogin = (userRole: 'admin' | 'staff') => {
    setRole(userRole);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole(null);
  };

  if (!isAuthenticated || !role) {
    return <Login onLogin={handleLogin} />;
  }

  if (role === 'staff') {
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
