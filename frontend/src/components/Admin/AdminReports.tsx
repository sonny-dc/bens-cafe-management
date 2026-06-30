import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Banknote, 
  CreditCard,
  Calendar,
  AlertCircle,
  Receipt,
  ArrowUpRight,
  Clock,
  User,
  Timer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { salesApi } from '../../api/salesApi';
import { shiftSummaryApi } from '../../api/shiftSummaryApi';
import { expenseApi } from '../../api/expenseApi';
import type { SalesEntry, ShiftSession, Expense } from 'shared/models';

const fmt = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];
  return { start: toDateStr(monday), end: toDateStr(sunday) };
}

function formatDuration(startStr: string, endStr: string | null): string {
  if (!endStr) return '—';
  const ms = new Date(endStr).getTime() - new Date(startStr).getTime();
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function AdminReports() {
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([]);
  const [shifts, setShifts] = useState<ShiftSession[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [expenseError, setExpenseError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'this_week' | 'all_time'>('this_week');
  const [reportTab, setReportTab] = useState<'sales' | 'shifts' | 'expenses'>('sales');

  const [salesPage, setSalesPage] = useState(1);
  const [shiftsPage, setShiftsPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    fetchSalesData();
    fetchShifts();
  }, []);

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await salesApi.getAllSalesEntries();
      setSalesEntries(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      setIsLoadingShifts(true);
      setShiftError(null);
      const { start, end } = getWeekRange();
      const data = await shiftSummaryApi.getSummary(start, end);
      setShifts(data);
    } catch (err: any) {
      setShiftError(err.message || 'Failed to load shift data');
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoadingExpenses(true);
      setExpenseError(null);
      const data = await expenseApi.getAllExpenses();
      setExpenses(data);
    } catch (err: any) {
      setExpenseError(err.message || 'Failed to load expense data');
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const filteredSales = useMemo(() => {
    const sorted = [...salesEntries].sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
    if (dateFilter === 'all_time') return sorted;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sorted.filter(entry => new Date(entry.postedAt) >= sevenDaysAgo);
  }, [salesEntries, dateFilter]);

  // Reset pagination when filter or tab changes
  useEffect(() => {
    setSalesPage(1);
    setShiftsPage(1);
    setExpensesPage(1);

    // Fetch expenses if the user clicks the expenses tab and we haven't loaded them yet
    if (reportTab === 'expenses' && expenses.length === 0 && !isLoadingExpenses && !expenseError) {
      fetchExpenses();
    }
  }, [dateFilter, reportTab]);

  const { totalRevenue, totalProfit } = useMemo(() => {
    return filteredSales.reduce(
      (acc, entry) => {
        acc.totalRevenue += Number(entry.totalRevenue) || 0;
        acc.totalProfit += Number(entry.netProfit) || 0;
        return acc;
      },
      { totalRevenue: 0, totalProfit: 0 }
    );
  }, [filteredSales]);

  const totalCosts = totalRevenue - totalProfit;

  const kpiCards = [
    {
      label: 'Gross Revenue',
      value: totalRevenue,
      icon: TrendingUp,
      badge: 'Total Incoming',
      badgeIcon: Receipt,
    },
    {
      label: 'Total Costs',
      value: totalCosts,
      icon: Banknote,
      badge: 'Payroll + Expenses',
      badgeIcon: AlertCircle,
    },
    {
      label: 'Net Profit',
      value: totalProfit,
      icon: CreditCard,
      badge: 'Revenue - Costs',
      badgeIcon: ArrowUpRight,
    },
  ];



  const completedShifts = shifts.filter(s => s.status === 'completed');
  const sortedShifts = [...shifts].sort(
    (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const paginatedSales = useMemo(() => {
    const start = (salesPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, salesPage]);

  const totalSalesPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));

  const paginatedShifts = useMemo(() => {
    const start = (shiftsPage - 1) * itemsPerPage;
    return sortedShifts.slice(start, start + itemsPerPage);
  }, [sortedShifts, shiftsPage]);

  const totalShiftsPages = Math.max(1, Math.ceil(sortedShifts.length / itemsPerPage));

  const sortedExpenses = useMemo(() => {
    const sorted = [...expenses].sort(
      (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
    );
    if (dateFilter === 'all_time') return sorted;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sorted.filter(entry => new Date(entry.postedAt) >= sevenDaysAgo);
  }, [expenses, dateFilter]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * itemsPerPage;
    return sortedExpenses.slice(start, start + itemsPerPage);
  }, [sortedExpenses, expensesPage]);

  const totalExpensesPages = Math.max(1, Math.ceil(sortedExpenses.length / itemsPerPage));

  const reportTabs = [
    { id: 'sales' as const, label: 'Sales History' },
    { id: 'shifts' as const, label: 'Shift History' },
    { id: 'expenses' as const, label: 'Expense History' },
  ];

  return (
    <div className="space-y-5 -mx-4">
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100">
        <div>
          <p className="text-[10px] font-semibold text-[#4a6741] uppercase tracking-widest mb-0.5">
            Financial Reports
          </p>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight font-poppins">
            Revenue Overview
          </h2>
        </div>

        <div className="relative">
          <Calendar
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            title="Filter by Date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value as any)}
            className="pl-9 pr-8 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#4a6741]/20 focus:border-[#4a6741] transition-all appearance-none cursor-pointer"
          >
            <option value="this_week">This Week</option>
            <option value="all_time">All Time</option>
          </select>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
          <AlertCircle size={18} />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon;
          const BadgeIcon = card.badgeIcon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.35 }}
              className="bg-white p-5 rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                    {card.label}
                  </p>
                  <h3 className="text-[26px] font-bold text-gray-900 tracking-tight leading-none mb-2.5 font-poppins">
                    ₱{fmt(card.value)}
                  </h3>
                  <span
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#3b2f2f]/10 text-[#3b2f2f]"
                  >
                    <BadgeIcon size={10} />
                    {card.badge}
                  </span>
                </div>

                <div
                  className="flex items-center justify-center shrink-0 text-[#3b2f2f]"
                >
                  <Icon size={24} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportTab(tab.id)}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
              reportTab === tab.id
                ? 'bg-white text-gray-900 border border-gray-200'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Sales History Table ── */}
      {reportTab === 'sales' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-poppins">Sales History</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Recorded daily sales entries &bull; sorted by most recent
              </p>
            </div>
            {!isLoading && filteredSales.length > 0 && (
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                {filteredSales.length} {filteredSales.length === 1 ? 'entry' : 'entries'}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Date Posted
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                    Cash Sales
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                    Online / Card
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                    Total Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-5 h-5 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">
                          Loading sales history...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                          <Receipt size={18} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          No sales entries found
                        </p>
                        <p className="text-xs text-gray-400">
                          No records for the selected period.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map(entry => (
                    <tr
                      key={entry.salesEntryId}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <Clock size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(entry.postedAt).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {new Date(entry.postedAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm text-gray-700 font-medium">
                          ₱{fmt(Number(entry.cashSales))}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm text-gray-700 font-medium">
                          ₱{fmt(Number(entry.onlineCardSales))}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-bold text-emerald-600">
                          ₱{fmt(Number(entry.totalRevenue))}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sales Pagination */}
          {!isLoading && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <span className="text-[12px] font-medium text-gray-500">
                Page <span className="font-bold text-gray-900">{salesPage}</span> of {totalSalesPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  title='Previous Page'
                  onClick={() => setSalesPage(p => Math.max(1, p - 1))}
                  disabled={salesPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  title='Next Page'
                  onClick={() => setSalesPage(p => Math.min(totalSalesPages, p + 1))}
                  disabled={salesPage === totalSalesPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Shift History Table ── */}
      {reportTab === 'shifts' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {/* Shift summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Total Shifts</p>
                  <h3 className="text-2xl font-bold text-gray-900 font-poppins">{shifts.length}</h3>
                </div>
                <div className="flex items-center justify-center text-[#3b2f2f]">
                  <Timer size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900 font-poppins">{completedShifts.length}</h3>
                </div>
                <div className="flex items-center justify-center text-[#3b2f2f]">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">In Progress</p>
                  <h3 className="text-2xl font-bold text-gray-900 font-poppins">{shifts.length - completedShifts.length}</h3>
                </div>
                <div className="flex items-center justify-center text-[#3b2f2f]">
                  <Clock size={24} />
                </div>
              </div>
            </div>
          </div>

          {shiftError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100">
              <AlertCircle size={18} />
              <p className="text-sm font-bold">{shiftError}</p>
            </div>
          )}

          {/* Shift table */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-poppins">Shift Log</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  This week's shift sessions &bull; sorted by most recent
                </p>
              </div>
              {!isLoadingShifts && shifts.length > 0 && (
                <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                  {shifts.length} {shifts.length === 1 ? 'shift' : 'shifts'}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/60 border-b border-gray-100">
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Duration</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Opening Cash</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Closing Cash</th>
                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isLoadingShifts ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-5 h-5 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-gray-400 font-medium">Loading shift history...</p>
                        </div>
                      </td>
                    </tr>
                  ) : sortedShifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                            <Timer size={18} className="text-gray-300" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">No shifts found</p>
                          <p className="text-xs text-gray-400">No shift records for this week.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedShifts.map(shift => {
                      const isCompleted = shift.status === 'completed';
                      return (
                        <tr
                          key={shift.shiftId}
                          className="hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-6 py-3.5">
                            <p className="text-sm font-bold text-gray-900 font-poppins">
                              {new Date(shift.shiftDate).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="text-[#3b2f2f] flex items-center justify-center shrink-0">
                                <User size={16} />
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                ID #{shift.employeeId}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <p className="text-sm text-gray-700 font-medium">
                              {formatTime(shift.startTime)}
                              {shift.endTime && (
                                <span className="text-gray-400"> – {formatTime(shift.endTime)}</span>
                              )}
                            </p>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="text-sm font-medium text-gray-700">
                              {formatDuration(shift.startTime, shift.endTime)}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="text-sm text-gray-700 font-medium">
                              ₱{fmt(Number(shift.openingCash))}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="text-sm text-gray-700 font-medium">
                              {isCompleted ? `₱${fmt(Number(shift.closingCash))}` : '—'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {isCompleted ? 'Completed' : 'Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Shifts Pagination */}
            {!isLoadingShifts && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
                <span className="text-[12px] font-medium text-gray-500">
                  Page <span className="font-bold text-gray-900">{shiftsPage}</span> of {totalShiftsPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    title='Previous Page'
                    onClick={() => setShiftsPage(p => Math.max(1, p - 1))}
                    disabled={shiftsPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    title='Next Page'
                    onClick={() => setShiftsPage(p => Math.min(totalShiftsPages, p + 1))}
                    disabled={shiftsPage === totalShiftsPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Expense History Table ── */}
      {reportTab === 'expenses' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
          {expenseError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 border-b border-red-100">
              <AlertCircle size={18} />
              <p className="text-sm font-bold">{expenseError}</p>
            </div>
          )}

          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 font-poppins">Expense History</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Recorded expenses &bull; sorted by most recent
              </p>
            </div>
            {!isLoadingExpenses && sortedExpenses.length > 0 && (
              <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg">
                {sortedExpenses.length} {sortedExpenses.length === 1 ? 'expense' : 'expenses'}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoadingExpenses ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-5 h-5 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-400 font-medium">Loading expense history...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                          <Banknote size={18} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900">No expenses found</p>
                        <p className="text-xs text-gray-400">No expense records for this period.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map(expense => (
                    <tr
                      key={expense.expenseId}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <Clock size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {new Date(expense.postedAt).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 uppercase">
                          {expense.expenseCategory.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-gray-700">
                        {expense.description || '—'}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <span className="text-sm font-medium text-gray-700">
                          ₱{fmt(Number(expense.amount))}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Expenses Pagination */}
          {!isLoadingExpenses && (
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
              <span className="text-[12px] font-medium text-gray-500">
                Page <span className="font-bold text-gray-900">{expensesPage}</span> of {totalExpensesPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  title='Previous Page'
                  onClick={() => setExpensesPage(p => Math.max(1, p - 1))}
                  disabled={expensesPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  title='Next Page'
                  onClick={() => setExpensesPage(p => Math.min(totalExpensesPages, p + 1))}
                  disabled={expensesPage === totalExpensesPages}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
