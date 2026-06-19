import { useState } from 'react';
import { AddNewEmployeeModal } from './components/AddNewEmployeeModal';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-8 min-h-screen bg-[#f6f7f4]">
      <h1 className="text-3xl font-bold mb-8 text-[#4a5e44]">Ben's Cafe Management</h1>
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
