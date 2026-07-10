import { useState, useEffect, useMemo, type ElementType } from 'react';
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
import type { SalesEntry, ShiftSummaryItem, Expense } from 'shared/models';
import { SHIFT_STATUS } from 'shared/constants';
import { CsvExportButton } from './CsvExportButton';
import { 
  formatIsoDateTimeToTime, 
  formatIsoDateTimeToDateTime, 
  formatIsoDateTimeToDate,
  formatShiftDurationDisplay
} from '../../utils/datetime.utils';

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

const reportTabs: {
  id: 'sales' | 'shifts' | 'expenses';
  label: string;
  mobileLabel: string;
  icon: ElementType;
}[] = [
  { id: 'sales', label: 'Sales History', mobileLabel: 'Sales', icon: Receipt },
  { id: 'shifts', label: 'Shift History', mobileLabel: 'Shifts', icon: Timer },
  { id: 'expenses', label: 'Expense History', mobileLabel: 'Expenses', icon: Banknote },
];

export function AdminReports({
  onSubTitleChange
}: {
  onSubTitleChange?: (subtitle: string) => void;
}) {
  const [salesEntries, setSalesEntries] = useState<SalesEntry[]>([]);
  const [shifts, setShifts] = useState<ShiftSummaryItem[]>([]);
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
    const label = reportTabs.find(tab => tab.id === reportTab)?.label || '';
    onSubTitleChange?.(label);
  }, [reportTab, onSubTitleChange]);

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
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to load sales data');
      }
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
    } catch (error) {
      if (error instanceof Error) {
        setShiftError(error.message);
      } else {
        setShiftError('Failed to load shift data');
      }
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
    } catch (error) {
      if (error instanceof Error) {
        setExpenseError(error.message);
      } else {
        setExpenseError('Failed to load expense data');
      }
    } finally {
      setIsLoadingExpenses(false);
    }
  };

  const filteredSales = useMemo(() => {
    const sorted = [...salesEntries].sort(
      (a, b) => String(b.postedAt).localeCompare(String(a.postedAt))
    );
    if (dateFilter === 'all_time') return sorted;
    const today = new Date().toISOString().slice(0, 10);
    return sorted.filter(entry => String(entry.postedAt).slice(0, 10) <= today);
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



  const completedShifts = shifts.filter(s => s.status === SHIFT_STATUS.COMPLETED);
  const sortedShifts = [...shifts].sort(
    (a, b) => String(b.startTime).localeCompare(String(a.startTime))
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
      (a, b) => String(b.postedAt).localeCompare(String(a.postedAt))
    );
    if (dateFilter === 'all_time') return sorted;
    const today = new Date().toISOString().slice(0, 10);
    return sorted.filter(entry => String(entry.postedAt).slice(0, 10) <= today);
  }, [expenses, dateFilter]);

  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * itemsPerPage;
    return sortedExpenses.slice(start, start + itemsPerPage);
  }, [sortedExpenses, expensesPage]);

  const totalExpensesPages = Math.max(1, Math.ceil(sortedExpenses.length / itemsPerPage));

  return (
    <div className="space-y-5">
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
      <div className="rounded-2xl border border-gray-200 bg-white p-1 shadow-sm sm:inline-block">
        <div className="grid grid-cols-3 gap-1">
          {reportTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = reportTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportTab(tab.id)}
                className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-bold transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
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
              </button>
            );
          })}
        </div>
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

          {/* Mobile Sales Cards */}
          <div className="md:hidden space-y-3 p-4">
            {isLoading ? (
              <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center">
                <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-[3px] border-[#4a6741] border-t-transparent" />
                <p className="text-sm font-medium text-gray-400">
                  Loading sales history...
                </p>
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                  <Receipt size={18} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  No sales entries found
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  No records for the selected period.
                </p>
              </div>
            ) : (
              paginatedSales.map(entry => (
                <div
                  key={entry.salesEntryId}
                  className="rounded-xl border border-gray-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {formatIsoDateTimeToDate(String(entry.postedAt))}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatIsoDateTimeToTime(String(entry.postedAt))}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        ₱{fmt(Number(entry.totalRevenue))}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                        Total Revenue
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Cash Sales
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        ₱{fmt(Number(entry.cashSales))}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        Online/Card
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        ₱{fmt(Number(entry.onlineCardSales))}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
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
                              {formatIsoDateTimeToDate(String(entry.postedAt))}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {formatIsoDateTimeToTime(String(entry.postedAt))}
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
          <div>
            {/* Mobile Summary */}
            <div className="sm:hidden rounded-2xl border border-gray-100 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Shift Summary
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    This week's shift activity
                  </p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3b2f2f]/10 text-[#3b2f2f]">
                  <Timer size={18} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Total
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900 font-poppins">
                    {shifts.length}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">
                    Done
                  </p>
                  <p className="mt-1 text-lg font-bold text-emerald-700 font-poppins">
                    {completedShifts.length}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70">
                    Active
                  </p>
                  <p className="mt-1 text-lg font-bold text-amber-700 font-poppins">
                    {shifts.length - completedShifts.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Summary */}
            <div className="hidden sm:grid grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Total Shifts
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900 font-poppins">
                      {shifts.length}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center text-[#3b2f2f]">
                    <Timer size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Completed
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900 font-poppins">
                      {completedShifts.length}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center text-[#3b2f2f]">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                      In Progress
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900 font-poppins">
                      {shifts.length - completedShifts.length}
                    </h3>
                  </div>
                  <div className="flex items-center justify-center text-[#3b2f2f]">
                    <Clock size={24} />
                  </div>
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
            {/* Mobile Shift Cards */}
            <div className="md:hidden space-y-3 p-4">
              {isLoadingShifts ? (
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center">
                  <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-[3px] border-[#4a6741] border-t-transparent" />
                  <p className="text-sm font-medium text-gray-400">
                    Loading shift history...
                  </p>
                </div>
              ) : sortedShifts.length === 0 ? (
                <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                    <Timer size={18} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    No shifts found
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    No shift records for this week.
                  </p>
                </div>
              ) : (
                paginatedShifts.map(shift => {
                  const isCompleted = shift.status === SHIFT_STATUS.COMPLETED;

                  return (
                    <div
                      key={shift.shiftId}
                      className="rounded-xl border border-gray-100 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {shift.fullName}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            {shift.jobRole}
                          </p>
                        </div>

                        <span
                          className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>

                      <div className="mt-4 rounded-lg bg-gray-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Time
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {formatIsoDateTimeToTime(String(shift.startTime))}
                          <span className="text-gray-400">
                            {' '}–{' '}
                            {shift.endTime
                              ? formatIsoDateTimeToTime(String(shift.endTime))
                              : ''}
                          </span>
                        </p>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Duration
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatShiftDurationDisplay(
                              String(shift.startTime),
                              shift.endTime ? String(shift.endTime) : null
                            )}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Date
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {formatIsoDateTimeToDate(String(shift.shiftDate))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Opening Cash
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            ₱{fmt(Number(shift.openingCash))}
                          </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                            Closing Cash
                          </p>
                          <p className="mt-1 text-sm font-semibold text-gray-900">
                            {isCompleted ? `₱${fmt(Number(shift.closingCash))}` : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
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
                      const isCompleted = shift.status === SHIFT_STATUS.COMPLETED;
                      return (
                        <tr
                          key={shift.shiftId}
                          className="hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-6 py-3.5">
                            <p className="text-sm font-bold text-gray-900 font-poppins">
                              {formatIsoDateTimeToTime(String(shift.shiftDate))}
                            </p>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="text-[#3b2f2f] flex items-center justify-center shrink-0">
                                <User size={16} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700">
                                  {shift.fullName}
                                </p>
                                <p className="text-[11px] text-gray-400">
                                  {shift.jobRole}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <p className="text-sm text-gray-700 font-medium">
                              {formatIsoDateTimeToTime(String(shift.startTime))}

                              {shift.endTime ? (
                                <span className="text-gray-400">
                                  {' '}– {formatIsoDateTimeToTime(String(shift.endTime))}
                                </span>
                              ) : (
                                <span className="text-gray-400">
                                  {' '}–
                                </span>
                              )}
                            </p>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="text-sm font-medium text-gray-700">
                              {formatShiftDurationDisplay(
                                String(shift.startTime),
                                shift.endTime ? String(shift.endTime) : null
                              )}
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
                              {isCompleted ? 'Completed' : 'In Progress'}
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

          {/* Mobile Expense Cards */}
          <div className="md:hidden space-y-3 p-4">
            {isLoadingExpenses ? (
              <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center">
                <div className="mx-auto mb-3 h-5 w-5 animate-spin rounded-full border-[3px] border-[#4a6741] border-t-transparent" />
                <p className="text-sm font-medium text-gray-400">
                  Loading expense history...
                </p>
              </div>
            ) : sortedExpenses.length === 0 ? (
              <div className="rounded-xl border border-gray-100 bg-white px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50">
                  <Banknote size={18} className="text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  No expenses found
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  No expense records for this period.
                </p>
              </div>
            ) : (
              paginatedExpenses.map(expense => (
                <div
                  key={expense.expenseId}
                  className="min-h-[150px] rounded-xl border border-gray-100 bg-white p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase text-gray-700">
                        {expense.expenseCategory.replace('_', ' ')}
                      </span>

                      <p className="shrink-0 text-sm font-bold text-red-600">
                        ₱{fmt(Number(expense.amount))}
                      </p>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-relaxed text-gray-900 break-words">
                      {expense.description || 'No description'}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-3">
                    <p className="text-xs font-medium text-gray-400">
                      {formatIsoDateTimeToDate(String(expense.postedAt))}
                    </p>

                    <p className="text-xs font-medium text-gray-400">
                      {formatIsoDateTimeToTime(String(expense.postedAt))}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
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
                              {formatIsoDateTimeToDateTime(String(expense.postedAt))}
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

      {/* CSV Export Feature */}
      {reportTab === 'sales' && <CsvExportButton />}
    </div>
  );
}
