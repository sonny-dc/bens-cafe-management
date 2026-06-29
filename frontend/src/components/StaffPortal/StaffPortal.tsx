import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Clock, MessageSquare, ShoppingCart } from 'lucide-react';
import { ShiftManager } from './ShiftManager';
import { NotesManager } from './NotesManager';
import { InventoryManager } from './InventoryManager';
import { type EmployeeProfile } from 'shared/models';
import { employeeApi } from '../../api/employeeApi';

type Tab = 'shift' | 'notes' | 'inventory';

const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: 'shift',     label: 'My Shift',           icon: Clock },
  { id: 'notes',     label: 'Notes & Messages',   icon: MessageSquare },
  { id: 'inventory', label: 'Inventory Requests', icon: ShoppingCart },
];

interface StaffPortalProps {
  onLogout: () => void;
}

export function StaffPortal({ onLogout }: StaffPortalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('shift');
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await employeeApi.getMyProfile();
        setEmployeeProfile(profile);
      } catch {
        setEmployeeProfile(null);
      }
    };
    loadProfile();
  }, []);
  const fullName = employeeProfile?.fullName?.trim() || 'Staff';
  const firstName = fullName.split(/\s+/)[0] || 'Staff';

  const initials = fullName
    .split(/\s+/)
    .slice(0, 2)
    .map(name => name[0]?.toUpperCase() || '')
    .join('') || 'ST';

    const jobRole = employeeProfile?.jobRole;

  return (
    <div className="min-h-screen bg-[#f5f5f3] font-sans text-gray-800">

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200"
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/bens-logo.png"
              alt="Ben's Cafe logo"
              className="h-10 w-10 object-contain"
            />
            <span className="font-semibold text-[15px] tracking-tight font-poppins text-gray-900">Ben's Cafe</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#4a6741] text-white text-xs font-bold flex items-center justify-center">
                {initials}
              </div>
              <div className="hidden sm:block leading-none">
                <p className="text-sm font-semibold text-gray-800">{firstName}</p>
                {jobRole && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {jobRole}
                  </p>
                )}
              </div>
            </div>
            <button onClick={onLogout} className="ml-1 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100">
              <LogOut size={15} />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-poppins text-gray-900 mb-1">Good morning, {firstName}</h1>
          <p className="text-gray-500">Here's your workspace for today.</p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="flex gap-1 mb-8 border-b border-gray-200"
        >
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                  ${isActive ? 'text-[#4a6741]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Icon size={15} />
                {tab.label}
                {tab.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full 
                    ${isActive ? 'bg-[#4a6741] text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a6741] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'shift' && <ShiftManager />}

            {activeTab === 'notes' && <NotesManager />}

            {activeTab === 'inventory' && <InventoryManager />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
