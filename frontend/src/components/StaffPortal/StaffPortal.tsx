import { useEffect, useState, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Clock, MessageSquare, ShoppingCart } from 'lucide-react';
import { ShiftManager } from './ShiftManager';
import { NotesManager } from './NotesManager';
import { InventoryManager } from './InventoryManager';
import { type EmployeeProfile } from 'shared/models';
import { employeeApi } from '../../api/employeeApi';

type Tab = 'shift' | 'notes' | 'inventory';

const tabs: { id: Tab; label: string; mobileLabel: string; icon: ElementType; badge?: number }[] = [
  { id: 'shift', label: 'My Shift', mobileLabel: 'Shift', icon: Clock },
  { id: 'notes', label: 'Notes & Messages', mobileLabel: 'Notes', icon: MessageSquare },
  { id: 'inventory', label: 'Inventory Requests', mobileLabel: 'Requests', icon: ShoppingCart },
];

interface StaffPortalProps {
  onLogout: () => void;
}

export function StaffPortal({ onLogout }: StaffPortalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('shift');
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setProfileError(null);
        
        const profile = await employeeApi.getMyProfile();
        setEmployeeProfile(profile);
      } catch (error) {
        setEmployeeProfile(null);

        if (error instanceof Error) {
          setProfileError(error.message);
        } else {
          setProfileError('Failed to load staff profile.');
        }
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-1">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

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

        {profileError && (
          <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {profileError}
          </div>
        )}

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="mb-8 rounded-2xl border border-gray-200 bg-white p-1 shadow-sm"
        >
          <div className="grid grid-cols-3 gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
                    isActive
                      ? 'bg-[#4a6741] text-white'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <Icon size={15} className="shrink-0" />

                  <span className="truncate sm:hidden">
                    {tab.mobileLabel}
                  </span>

                  <span className="hidden truncate sm:inline">
                    {tab.label}
                  </span>

                  {tab.badge && (
                    <span
                      className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
