import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, Calculator, ClipboardList, Package, BarChart3, Users } from 'lucide-react';
import { SalesEntry } from './SalesEntry';
import { AdminStaffBoard } from './AdminStaffBoard';
import { StaffRegistry } from './StaffRegistry';
import { AdminInventory } from './AdminInventory';
import { AdminReports } from './AdminReports';

type Tab = 'dashboard' | 'sales' | 'staff_board' | 'inventory' | 'reports' | 'staff_registry';

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { id: 'sales',          label: 'Sales Entry',    icon: Calculator },
  { id: 'staff_board',    label: 'Staff Board',    icon: ClipboardList },
  { id: 'inventory',      label: 'Inventory',      icon: Package },
  { id: 'reports',        label: 'Reports',        icon: BarChart3 },
  { id: 'staff_registry', label: 'Staff Registry', icon: Users },
];

interface AdminPortalProps {
  onLogout: () => void;
}

export function AdminPortal({ onLogout }: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [inventorySubTitle, setInventorySubTitle] = useState('Stock Overview');

  return (
    <div className="min-h-screen flex bg-[#2a2a2a] font-sans">
      
      {/* ── Sidebar (Left) ── */}
      <aside className="w-64 bg-[#f2f4f6] flex flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          {/* Header */}
          <div className="p-5 flex items-center gap-1">
            <img
              src="/bens-logo-plain.svg"
              alt="Ben's Cafe logo"
              className="h-16 w-16 object-contain scale-[1.15] -ml-2"
            />
            <div className="leading-tight overflow-hidden">
              <h1 className="font-bold text-gray-900 text-[15px] font-poppins">Ben's Cafe</h1>
              <p className="text-[10px] text-[#789e81] font-medium uppercase tracking-wide whitespace-nowrap">Management System</p>
            </div>
          </div>

          {/* Menu */}
          <div className="px-4 mt-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-4 mb-3">Menu</p>
            <nav className="flex flex-col gap-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-[#5c7155] text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'}`}
                  >
                    <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400'} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer / Log out */}
        <div className="p-4 border-t border-gray-200/60 mt-auto">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#4a5f6a] hover:text-gray-900 transition-colors w-full"
          >
            <LogOut size={18} className="text-[#4a5f6a] opacity-70" />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Main Content Area (Right) ── */}
      <main className="flex-1 bg-[#f2f4f6]">
        {/* The rounded white container */}
        <div className="bg-white rounded-tl-[40px] h-full w-full shadow-2xl overflow-hidden flex flex-col">
          
          {/* Top Bar inside content */}
          <header className="h-20 px-8 flex items-center justify-between border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-gray-900 font-bold">{tabs.find(t => t.id === activeTab)?.label}</span>
              {activeTab === 'sales' && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-400">New entry</span>
                </>
              )}
              {activeTab === 'inventory' && inventorySubTitle && (
                <>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-400">{inventorySubTitle}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#5c7155] text-white text-xs font-bold flex items-center justify-center">
                A
              </div>
              <div className="leading-none text-right">
                <p className="text-sm font-bold text-gray-900">Admin</p>
                <p className="text-[11px] text-[#789e81]">Manager</p>
              </div>
            </div>
          </header>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={activeTab === 'staff_board' || activeTab === 'inventory' || activeTab === 'reports' ? "max-w-7xl mx-auto" : "max-w-4xl mx-auto"}
              >
                {activeTab === 'sales' && <SalesEntry />}
                {activeTab === 'staff_board' && <AdminStaffBoard />}
                {activeTab === 'staff_registry' && <StaffRegistry />}
                {activeTab === 'inventory' && <AdminInventory onSubTitleChange={setInventorySubTitle} />}
                {activeTab === 'reports' && <AdminReports />}
                
                {activeTab !== 'sales' && activeTab !== 'staff_board' && activeTab !== 'staff_registry' && activeTab !== 'inventory' && activeTab !== 'reports' && (
                  <div className="flex flex-col items-center justify-center text-center h-[50vh] text-gray-400">
                    <p className="text-lg font-medium">{tabs.find(t => t.id === activeTab)?.label}</p>
                    <p className="text-sm">Coming soon</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
