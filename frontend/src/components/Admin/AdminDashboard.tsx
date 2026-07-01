import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  MessageSquare,
  Timer,
  Clock,
  User,
  AlertCircle,
  Receipt
} from 'lucide-react';
import { salesApi } from '../../api/salesApi';
import { shiftApi } from '../../api/shiftApi';
import { inventoryRequestApi } from '../../api/inventoryRequestApi';
import { notesApi } from '../../api/notesApi';
import { inventoryBudgetAccountApi } from '../../api/inventoryBudgetAccountApi';
import type { SalesEntry, InventoryRequestListItem, StaffMessage, ActiveShiftItem } from 'shared/models';
import { formatIsoDateTimeToTime } from '../../utils/datetime.utils';

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function formatDurationLive(startTimeStr: string): string {
  return startTimeStr ? 'Active' : '—';
}

function isToday(dateStr: string | Date): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return String(dateStr).slice(0, 10) === today;
}

export function AdminDashboard() {
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [activeShifts, setActiveShifts] = useState<ActiveShiftItem[]>([]);
  const [inventoryReqs, setInventoryReqs] = useState<InventoryRequestListItem[]>([]);
  const [notes, setNotes] = useState<StaffMessage[]>([]);
  const [budget, setBudget] = useState<string>('0.00');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-refresh for live duration and data
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
      fetchDashboardData(); // Re-fetch the live data every minute
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [salesData, shiftsData, invData, notesData, budgetData] = await Promise.all([
        salesApi.getAllSalesEntries(),
        shiftApi.getAllActiveShifts(),
        inventoryRequestApi.getAllRequestsSimplified(),
        notesApi.getAllNotes(),
        inventoryBudgetAccountApi.getCurrent(),
      ]);
      setSales(salesData);
      setActiveShifts(shiftsData);
      setInventoryReqs(invData);
      setNotes(notesData);
      if (budgetData) {
        setBudget(budgetData.currentBalance);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const todaysProfit = useMemo(() => {
    return sales
      .filter(s => isToday(s.postedAt))
      .reduce((sum, s) => sum + (Number(s.netProfit) || 0), 0);
  }, [sales]);

  const pendingRequests = useMemo(() => {
    return inventoryReqs.filter(r => r.requestStatus === 'pending');
  }, [inventoryReqs]);


  const kpiCards = [
    {
      label: "Profit",
      value: `₱${fmt(todaysProfit)}`,
      icon: TrendingUp,
    },
    {
      label: "Allotted Budget",
      value: `₱${fmt(Number(budget))}`,
      icon: Receipt,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight font-poppins">Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time status of the cafe operations</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm"
        >
          <Clock size={16} /> {/* Reusing Clock icon as a refresh indicator */}
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 flex items-start justify-between"
            >
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  {card.label}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-poppins">
                  {card.value}
                </h3>
              </div>
              <div className="flex items-center justify-center shrink-0 text-[#3b2f2f]">
                <Icon size={24} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Active Shifts ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 font-poppins">Who's Working Now</h3>
            <span className="text-[11px] font-bold text-[#3b2f2f] bg-[#3b2f2f]/10 px-2.5 py-1 rounded-lg">
              {activeShifts.length} Active
            </span>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {activeShifts.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Timer size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No active shifts right now</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {activeShifts.map((shift) => (
                  <li key={shift.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-[#3b2f2f] flex items-center justify-center mr-1">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 font-poppins">{shift.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Clock size={12} />
                          Started {formatIsoDateTimeToTime(String(shift.clockInTime))}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                      <p className="text-sm font-bold text-[#4a6741]">{formatDurationLive(shift.clockInTime)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── Pending Requests ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 font-poppins">Pending Requests</h3>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Package size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">All caught up</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {pendingRequests.slice(0, 5).map((req) => (
                  <li key={req.requestId} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-bold text-gray-900 font-poppins">{req.itemName}</p>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                        {req.quantity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Req. by {req.requestedBy}
                    </p>
                  </li>
                ))}
                {pendingRequests.length > 5 && (
                  <li className="p-3 text-center border-t border-gray-50">
                    <span className="text-xs font-bold text-gray-400">
                      +{pendingRequests.length - 5} more
                    </span>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Staff Messages ── */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 font-poppins">Recent Staff Messages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {notes.filter(n => n.messageStatus !== 'acknowledged').slice(0, 3).map(note => (
            <div key={note.messageId} className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors cursor-default">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <User size={12} />
                  </div>
                  <span className="text-xs font-bold text-gray-900">{note.employeeName || `ID: ${note.employeeId}`}</span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                  {formatIsoDateTimeToTime(String(note.postedAt))}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1 font-poppins">{note.subject || note.messageType}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{note.messageText}</p>
              {(note.messageStatus === 'new' || note.messageStatus === 'unread' as any) && (
                <div className="mt-4">
                  <span className="inline-block px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-md">
                    UNREAD
                  </span>
                </div>
              )}
            </div>
          ))}
          {notes.filter(n => n.messageStatus !== 'acknowledged').length === 0 && (
            <div className="col-span-3 p-8 bg-white border border-gray-100 rounded-2xl text-center text-gray-400">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No new messages</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
