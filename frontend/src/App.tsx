import { useState } from 'react';
import { StaffPortal } from './components/StaffPortal/StaffPortal';
import { AdminPortal } from './components/Admin/AdminPortal';
import './App.css';

function App() {
  const [view, setView] = useState<'admin' | 'staff'>('staff');

  if (view === 'staff') {
    return (
      <div className="relative">
        <StaffPortal />
        {/* Temporary toggle button to switch back to Admin View */}
        <button 
          onClick={() => setView('admin')}
          className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-full text-xs opacity-50 hover:opacity-100 transition-opacity"
        >
          Switch to Admin View
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <AdminPortal onSwitchView={() => setView('staff')} />
    </div>
  );
}

export default App;
