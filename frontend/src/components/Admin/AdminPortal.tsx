import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, Calculator, ClipboardList, Package, BarChart3, Users, Menu } from 'lucide-react';
import { SalesEntry } from './SalesEntry';
import { AdminStaffBoard } from './AdminStaffBoard';
import { StaffRegistry } from './StaffRegistry';
import { AdminInventory } from './AdminInventory';
import { AdminReports } from './AdminReports';
import { AdminDashboard } from './AdminDashboard';

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
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [inventorySubTitle, setInventorySubTitle] = useState('Stock Overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#2a2a2a] font-sans">
      
      {/* ── Sidebar Overlay for Mobile ── */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (Left) ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:sticky lg:top-0 lg:translate-x-0 w-64 bg-[#f2f4f6] flex flex-col justify-between shrink-0 h-screen transition-transform duration-300 ease-in-out`}>
        <div>
          {/* Header */}
          <div className="p-5 flex items-center gap-1">
            <img
              src="/bens-logo-plain.svg"
              alt="Ben's Cafe logo"
              className="h-14 w-14 object-contain scale-[1.15] -ml-2"
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
                    onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
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
      <main className="flex-1 bg-[#f2f4f6] w-full min-w-0">
        {/* The rounded white container */}
        <div className="bg-white rounded-none lg:rounded-tl-[40px] h-full w-full shadow-2xl overflow-hidden flex flex-col">
          
          {/* Top Bar inside content */}
          <header className="h-16 lg:h-20 px-4 lg:px-8 flex items-center justify-between border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2 lg:gap-3 text-sm font-medium">
              <button 
                title="Open menu"
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 -ml-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={20} />
              </button>
              <span className="text-gray-900 font-bold hidden sm:inline">{tabs.find(t => t.id === activeTab)?.label}</span>
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
          <div className="flex-1 overflow-y-auto p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={activeTab === 'staff_board' || activeTab === 'inventory' || activeTab === 'reports' || activeTab === 'dashboard' ? "max-w-7xl mx-auto" : "max-w-4xl mx-auto"}
              >
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'sales' && <SalesEntry />}
                {activeTab === 'staff_board' && <AdminStaffBoard />}
                {activeTab === 'staff_registry' && <StaffRegistry />}
                {activeTab === 'inventory' && <AdminInventory onSubTitleChange={setInventorySubTitle} />}
                {activeTab === 'reports' && <AdminReports />}
                
                {activeTab !== 'dashboard' && activeTab !== 'sales' && activeTab !== 'staff_board' && activeTab !== 'staff_registry' && activeTab !== 'inventory' && activeTab !== 'reports' && (
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
