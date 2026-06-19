import { useState } from 'react';
import { AddNewEmployeeModal } from './components/AddNewEmployeeModal';
import { StaffPortal } from './components/StaffPortal/StaffPortal';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <div className="p-8 min-h-screen bg-[#f6f7f4]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#4a5e44]">Ben's Cafe Management</h1>
        <button 
          onClick={() => setView('staff')}
          className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-700 transition-colors"
        >
          Switch to Staff Portal
        </button>
      </div>

      <button 
        className="btn border-none text-white hover:brightness-95 shadow-sm" 
        style={{ backgroundColor: '#5c7155' }}
        onClick={() => setIsModalOpen(true)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Employee
      </button>

      <AddNewEmployeeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}

export default App;
