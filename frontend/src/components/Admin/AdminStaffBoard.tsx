import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, Banknote,
  MessageSquare, AlertTriangle, Info, Package, CheckCircle2, X, Receipt, ChevronDown, ChevronUp, Download, Trash2, Maximize, Minimize
} from 'lucide-react';
import { shiftSummaryApi } from '../../api/shiftSummaryApi';
import { shiftApi } from '../../api/shiftApi';
import {
  type ShiftSummaryItem,
  type InventoryRequestListItem,
  type StaffWeeklyPerformance,
  type ActiveShiftItem
} from 'shared/models';
import { type Note, notesApi } from '../../api/notesApi';
import { REQUEST_STATUS, MESSAGE_STATUS, type MessageType, MESSAGE_TYPES, type RequestStatus, SHIFT_STATUS } from 'shared/constants';
import { inventoryRequestApi } from '../../api/inventoryRequestApi';
import { formatDateToYYYYMMDD, getStoreWeekRange, DEFAULT_CLOSING_DAY, WEEKDAY_LABELS } from '../../utils/storeWeek.utils';
import { getShiftProgressHours, formatIsoDateTimeToTime, formatIsoDateTimeToDate, formatIsoDateTimeToRelativeDateTime } from '../../utils/datetime.utils';

// --- HELPERS ---
const getNoteStyle = (type: MessageType) => {
  switch (type) {
    case MESSAGE_TYPES.URGENT: return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: AlertTriangle };
    case MESSAGE_TYPES.CONCERN: return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: MessageSquare };
    default: return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: Info };
  }
};

const getNoteTypeInfo = (type: MessageType) => {
  switch (type) {
    case MESSAGE_TYPES.URGENT:
      return {
        label: 'Urgent',
        description:
          'Requires immediate attention because it may affect staff, customers, or store operations.',
        example:
          'The espresso machine is leaking and cannot be used safely.'
      };

    case MESSAGE_TYPES.CONCERN:
      return {
        label: 'Concern',
        description:
          'An issue that should be reviewed but does not currently require immediate action.',
        example:
          'The espresso machine is taking longer than usual to heat up.'
      };

    default:
      return {
        label: 'General',
        description:
          'A routine update, reminder, or information that does not require immediate attention.',
        example:
          'The coffee grinder was cleaned before the afternoon shift.'
      };
  }
};

const acknowledgeCardMotion = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.99
  },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    x: 56,
    scale: 0.98
  },
  transition: {
    duration: 0.42,
    ease: [0.22, 1, 0.36, 1] as const
  }
};

function ActionSpinner() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"
    />
  );
}

function wait(milliseconds: number) {
  return new Promise<void>(resolve => {
    window.setTimeout(resolve, milliseconds);
  });
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
}
export function AdminStaffBoard() {
  // API State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);
  const [confirmArchiveData, setConfirmArchiveData] = useState<any>(null);

  const [allShifts, setAllShifts] = useState<ShiftSummaryItem[]>([]);
  const [activeShifts, setActiveShifts] = useState<ActiveShiftItem[]>([]);
  const [staffNotes, setStaffNotes] = useState<Note[]>([]);
  const [inventoryRequests, setInventoryRequests] = useState<InventoryRequestListItem[]>([]);

  const [closingDay, setClosingDay] = useState(DEFAULT_CLOSING_DAY);
  const [staffPerformance, setStaffPerformance] = useState<StaffWeeklyPerformance[]>([]);
  const [showAllStaffPerformance, setShowAllStaffPerformance] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [currentWeekRange, setCurrentWeekRange] = useState(() =>
    getStoreWeekRange(new Date(), DEFAULT_CLOSING_DAY)
  );

  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const [acknowledgingNoteId, setAcknowledgingNoteId] = useState<number | null>(null);
  const [acknowledgingInventoryRequestId, setAcknowledgingInventoryRequestId] = useState<number | null>(null);

  // Error State
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [noteActionError, setNoteActionError] = useState<string | null>(null);
  const [inventoryActionError, setInventoryActionError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [expandedNoteIds, setExpandedNoteIds] = useState<number[]>([]);
  const [expandedInventoryRequestIds, setExpandedInventoryRequestIds] = useState<number[]>([]);
  const [expandedPanel, setExpandedPanel] = useState<'notes' | 'inventory' | null>(null);
  const [expandedNoteTypeInfoId, setExpandedNoteTypeInfoId] = useState<number | null>(null);

  useEffect(() => {
    setShowAllStaffPerformance(false);
    fetchDashboardData();
  }, [closingDay]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)');

    const handleChange = () => {
      setIsMobileView(mediaQuery.matches);
    };

    handleChange();

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoadingDashboard(true);
      setDashboardError(null);
      setNoteActionError(null);
      setInventoryActionError(null);

      const selectedWeek = getStoreWeekRange(new Date(), closingDay);
      setCurrentWeekRange(selectedWeek);

      const historyEnd = new Date(selectedWeek.endDate);
      const historyStart = new Date(selectedWeek.startDate);
      historyStart.setDate(historyStart.getDate() - 28);

      const shiftData = await shiftSummaryApi.getSummary(
        formatDateToYYYYMMDD(historyStart),
        formatDateToYYYYMMDD(historyEnd)
      );

      setAllShifts(shiftData);

      const performanceData = await shiftSummaryApi.getStaffWeeklyPerformance(
        selectedWeek.startDate,
        selectedWeek.endDate
      );

      setStaffPerformance(performanceData);


      const activeShifts = await shiftApi.getAllActiveShifts();
      setActiveShifts(activeShifts);

      const notes = await notesApi.getAllNotes();
      setStaffNotes(notes.filter((note) => note.messageStatus === MESSAGE_STATUS.NEW));

      const pendingInventoryRequests =
        await inventoryRequestApi.getPendingRequestsSimplified();

      setInventoryRequests(pendingInventoryRequests);
    } catch (error) {
      if (error instanceof Error) {
        setDashboardError(error.message);
      } else {
        setDashboardError('Failed to load staff board data.');
      }
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const handleAcknowledgeNote = async (messageId: number) => {
    if (acknowledgingNoteId !== null) return;

    try {
      setAcknowledgingNoteId(messageId);
      setNoteActionError(null);

      await Promise.all([
        notesApi.markNoteAsAcknowledged(messageId),
        wait(450)
      ]);

      setStaffNotes(prev =>
        prev.filter(note => note.messageId !== messageId)
      );

      setExpandedNoteIds(prev =>
        prev.filter(id => id !== messageId)
      );
      setExpandedNoteTypeInfoId(currentId =>
        currentId === messageId ? null : currentId
      );
    } catch (error) {
      if (error instanceof Error) {
        setNoteActionError(error.message);
      } else {
        setNoteActionError(
          'Failed to acknowledge staff note.'
        );
      }
    } finally {
      setAcknowledgingNoteId(null);
    }
  };

  const handleUpdateInventoryRequest = async (
    requestId: number,
    requestStatus: RequestStatus
  ) => {
    if (acknowledgingInventoryRequestId !== null) return;

    try {
      setAcknowledgingInventoryRequestId(requestId);
      setInventoryActionError(null);

      await Promise.all([
        inventoryRequestApi.updateRequestStatus(
          requestId,
          requestStatus
        ),
        wait(450)
      ]);

      setInventoryRequests(prev =>
        prev.filter(
          request => request.requestId !== requestId
        )
      );

      setExpandedInventoryRequestIds(prev =>
        prev.filter(id => id !== requestId)
      );
    } catch (error) {
      if (error instanceof Error) {
        setInventoryActionError(error.message);
      } else {
        setInventoryActionError(
          'Failed to update inventory request.'
        );
      }
    } finally {
      setAcknowledgingInventoryRequestId(null);
    }
  };

  // Group shifts by Employee -> by Week (Wednesday to Wednesday)
  const getEmployeeHistory = (empId: number) => {
    const empShifts = allShifts.filter(
      s => s.employeeId === empId && s.status === SHIFT_STATUS.COMPLETED
    );

    const grouped: Record<string, any> = {};

    empShifts.forEach(shift => {
      const dateObj = new Date(String(shift.shiftDate));
      dateObj.setHours(0, 0, 0, 0);

      const day = dateObj.getDay();

      const diffToWeekStart =
        day >= closingDay
          ? day - closingDay
          : day + (7 - closingDay);

      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - diffToWeekStart);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const closingDayShort = WEEKDAY_LABELS[closingDay].slice(0, 3);

      const weekLabel = `${closingDayShort}, ${weekStart.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      })} - ${closingDayShort}, ${weekEnd.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      })}`;

      const weekId = formatDateToYYYYMMDD(weekStart);

      if (!grouped[weekId]) {
        grouped[weekId] = {
          id: weekId,
          employeeId: empId,
          weekRange: weekLabel,
          startDate: formatDateToYYYYMMDD(weekStart),
          endDate: formatDateToYYYYMMDD(weekEnd),
          shifts: [],
          totalCash: 0
        };
      }

      grouped[weekId].shifts.push(shift);
      grouped[weekId].totalCash += Number(shift.closingCash || 0);
    });

    return Object.values(grouped).sort((a, b) => b.id.localeCompare(a.id));
  };

  const handleExportCSV = (weekData: any) => {
    const rows = [
      ["Date", "Start Time", "End Time", "Opening Cash", "Closing Cash", "Cash Variance"],
      ...weekData.shifts.map((s: ShiftSummaryItem) => [
        String(s.shiftDate),
        String(s.startTime),
        s.endTime ? String(s.endTime) : 'N/A',
        s.openingCash,
        s.closingCash,
        (s as any).cashVariance || 0
      ]),
      ["", "", "", "", "TOTAL REPORTED CASH", weekData.totalCash]
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Staff_Summary_${weekData.weekRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleArchiveWeek = async () => {
    if (!confirmArchiveData) return;

    try {
      setIsArchiving(true);
      setArchiveError(null);

      await shiftSummaryApi.archiveWeek(
        confirmArchiveData.employeeId,
        confirmArchiveData.startDate,
        confirmArchiveData.endDate
      );

      await fetchDashboardData();

      setExpandedWeekId(null);
      setConfirmArchiveData(null);
    } catch (error) {
      if (error instanceof Error) {
        setArchiveError(error.message);
      } else {
        setArchiveError('Failed to archive shifts.');
      }
    } finally {
      setIsArchiving(false);
    }
  };

  const selectedEmployee = staffPerformance.find(
    r => r.employeeId === selectedEmployeeId
  );

  const employeeHistory = selectedEmployeeId ? getEmployeeHistory(selectedEmployeeId) : [];

  const panelPreviewLimit = isMobileView ? 1 : 2;

  const visibleStaffPerformance = showAllStaffPerformance
    ? staffPerformance
    : staffPerformance.slice(0, panelPreviewLimit);

  const hiddenStaffCount = Math.max(
    staffPerformance.length - panelPreviewLimit,
    0
  );

  const getVisiblePanelItems = <T,>(items: T[]) =>
    items.slice(0, panelPreviewLimit);

  const getHiddenPanelItemCount = <T,>(items: T[]) =>
    Math.max(items.length - panelPreviewLimit, 0);

  const toggleExpandedNote = (messageId: number) => {
    setExpandedNoteIds(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const toggleExpandedInventoryRequest = (requestId: number) => {
    setExpandedInventoryRequestIds(prev =>
      prev.includes(requestId)
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const shouldShowViewMore = (text?: string | null, maxLength = 140) => {
    if (!text) return false;

    return text.includes('\n') || text.length > maxLength;
  };

  const getInventoryRequestReason = (request: InventoryRequestListItem) => {
    return request.reason?.trim() || '';
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-end items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-2">
          <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
            {activeShifts.length} Staff On Duty
          </span>
          <select
            title="Select Store Closing Day"
            value={closingDay}
            onChange={(e) => setClosingDay(Number(e.target.value))}
            className="cursor-pointer px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-bold border border-gray-200 outline-none focus:border-[#4a6741]"
          >
            {WEEKDAY_LABELS.map((label, index) => (
              <option key={label} value={index}>
                Closes: {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {dashboardError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {dashboardError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN (Active Shifts & Profit) ── */}
        <div className="xl:col-span-5 space-y-6">

          {/* Active Shifts */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
              <Clock size={18} className="text-[#4a6741]" />
              <h2 className="font-semibold text-gray-900">Currently Shifting</h2>
            </div>

            <div className="space-y-3">
              {isLoadingDashboard ? (
                <LoadingState label="Loading active shifts..." />
              ) : activeShifts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No staff currently clocked in.</p>
              ) : (
                activeShifts.map(staff => {
                  const hoursElapsed = getShiftProgressHours(staff.clockInTime);
                  return (
                    <div key={staff.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4a6741] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {staff.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
                          <p className="text-xs text-gray-500">{staff.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900">{hoursElapsed}</p>
                        <p className="text-[10px] text-gray-400">In at {formatIsoDateTimeToTime(String(staff.clockInTime))}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Profit Report */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: {
                duration: 0.3,
                delay: 0.2
              },
              y: {
                duration: 0.3,
                delay: 0.2
              }
            }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2 border-b border-gray-50 pb-3">
              <Banknote size={18} className="text-[#4a6741]" />
              <div className="ml-2">
                <h2 className="font-semibold text-gray-900">
                  Weekly Staff Sales Performance
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentWeekRange.startDate} to {currentWeekRange.endDate} · closes every {WEEKDAY_LABELS[closingDay]}
                </p>
              </div>

            </div>

            <div className="space-y-4">
              {isLoadingDashboard ? (
                <LoadingState label="Loading staff performance..." />
              ) : staffPerformance.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No staff performance records for this week.
                </p>
              ) : (
                <>
                  <div>
                    <AnimatePresence initial={false} mode="sync">
                      {visibleStaffPerformance.map((report, index) => (
                        <motion.div
                          key={report.employeeId}
                          initial={{
                            gridTemplateRows: '0fr',
                            paddingBottom: 0,
                            opacity: 0,
                            y: -8
                          }}
                          animate={{
                            gridTemplateRows: '1fr',
                            paddingBottom:
                              index < visibleStaffPerformance.length - 1
                                ? 12
                                : 0,
                            opacity: 1,
                            y: 0
                          }}
                          exit={{
                            gridTemplateRows: '0fr',
                            paddingBottom: 0,
                            opacity: 0,
                            y: -8
                          }}
                          transition={{
                            gridTemplateRows: {
                              duration: 0.36,
                              ease: [0.22, 1, 0.36, 1]
                            },
                            paddingBottom: {
                              duration: 0.36,
                              ease: [0.22, 1, 0.36, 1]
                            },
                            opacity: {
                              duration: 0.2,
                              ease: 'easeOut'
                            },
                            y: {
                              duration: 0.28,
                              ease: [0.22, 1, 0.36, 1]
                            }
                          }}
                          className="grid"
                        >
                          <div className="min-h-0 overflow-hidden">
                            <div
                              onClick={() => {
                                if (!isMobileView) {
                                  setSelectedEmployeeId(report.employeeId);
                                }
                              }}
                              className="w-full rounded-xl border border-gray-100 bg-white p-4 text-left transition-colors sm:-mx-2 sm:flex sm:cursor-pointer sm:items-center sm:justify-between sm:border-0 sm:p-2 sm:hover:bg-gray-50"
                            >
                              <div className="flex items-start justify-between gap-3 sm:flex-1 sm:items-center">
                                <div className="flex min-w-0 gap-3 sm:items-center">
                                  <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 sm:flex">
                                    <Users size={14} />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-gray-900 sm:font-semibold">
                                      {report.fullName}
                                    </p>

                                    <p className="mt-0.5 text-xs text-gray-500 sm:text-[11px]">
                                      {report.jobRole} · {report.completedShifts} completed{' '}
                                      {report.completedShifts === 1
                                        ? 'shift'
                                        : 'shifts'}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelectedEmployeeId(report.employeeId);
                                  }}
                                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#4a6741]/20 bg-green-50 px-3 py-1.5 text-[11px] font-bold text-[#4a6741] transition-colors hover:bg-[#4a6741] hover:text-white active:bg-[#3a5233] sm:hidden"
                                >
                                  View
                                </button>
                              </div>

                              <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-3 sm:mt-0 sm:bg-transparent sm:p-0 sm:text-right">
                                <div className="flex items-center justify-between gap-3 sm:hidden">
                                  <span className="text-xs font-medium text-gray-500">
                                    Completed Shifts
                                  </span>

                                  <span className="text-sm font-bold text-gray-900">
                                    {report.completedShifts}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-3 sm:block">
                                  <span className="text-xs font-medium text-gray-500 sm:hidden">
                                    Weekly Cash
                                  </span>

                                  <div>
                                    <p className="text-sm font-bold text-gray-900">
                                      ₱{' '}
                                      {Number(report.totalCash).toLocaleString(
                                        'en-PH',
                                        {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        }
                                      )}
                                    </p>

                                    <p className="hidden text-[10px] text-gray-400 sm:block">
                                      Weekly cash
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {hiddenStaffCount > 0 && (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      aria-label={
                        showAllStaffPerformance
                          ? 'Show fewer staff performance records'
                          : `Show ${hiddenStaffCount} more staff performance records`
                      }
                      onClick={() =>
                        setShowAllStaffPerformance(prev => !prev)
                      }
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100"
                    >
                      {showAllStaffPerformance ? (
                        <>
                          <ChevronUp size={14} />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown size={14} />
                          Show {hiddenStaffCount} more
                        </>
                      )}
                    </motion.button>
                  )}
                </>
              )}
            </div>

          </motion.div>

        </div>

        {/* ── RIGHT COLUMN (Notes & Inventory) ── */}
        <div className="xl:col-span-7 space-y-6">

          {/* Staff Notes Inbox */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            {/* Header */}
            <div className="mb-4 flex shrink-0 items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <MessageSquare
                  size={18}
                  className="shrink-0 text-[#4a6741]"
                />

                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-900">
                    Staff Notes Inbox
                  </h2>

                  <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                    {staffNotes.length} new{' '}
                    {staffNotes.length === 1 ? 'note' : 'notes'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {getHiddenPanelItemCount(staffNotes) > 0 && (
                  <span className="text-[11px] font-bold text-gray-500">
                    {getHiddenPanelItemCount(staffNotes)} more
                  </span>
                )}

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setExpandedPanel('notes')}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors ${getHiddenPanelItemCount(staffNotes) > 0
                      ? 'border-[#4a6741]/20 bg-[#4a6741]/10 text-[#4a6741] hover:bg-[#4a6741] hover:text-white'
                      : 'border-transparent text-gray-400 hover:bg-gray-50 hover:text-[#4a6741]'
                    }`}
                  title={
                    getHiddenPanelItemCount(staffNotes) > 0
                      ? `View ${getHiddenPanelItemCount(staffNotes)} more staff notes`
                      : 'Expand staff notes'
                  }
                  aria-label={
                    getHiddenPanelItemCount(staffNotes) > 0
                      ? `View ${getHiddenPanelItemCount(staffNotes)} more staff notes`
                      : 'Expand staff notes'
                  }
                >
                  <Maximize size={15} />
                </motion.button>
              </div>
            </div>

            {/* Action error */}
            {noteActionError && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {noteActionError}
              </div>
            )}

            {/* Notes list */}
            <div className="max-h-[250px] overflow-x-hidden overflow-y-auto pr-2">
              {isLoadingDashboard ? (
                <LoadingState label="Loading staff notes..." />
              ) : staffNotes.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No new messages from staff.
                </p>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence initial={false} mode="sync">
                    {getVisiblePanelItems(staffNotes).map(note => {
                      const style = getNoteStyle(note.messageType);
                      const Icon = style.icon;
                      const typeInfo = getNoteTypeInfo(note.messageType);

                      const isAcknowledging =
                        acknowledgingNoteId === note.messageId;

                      const isTypeInfoOpen =
                        expandedNoteTypeInfoId === note.messageId;


                      return (
                        <motion.div
                          layout
                          key={note.messageId}
                          {...acknowledgeCardMotion}
                        >

                          {/* Mobile note */}
                          <div
                            className={`rounded-xl border p-4 sm:hidden ${style.bg} ${style.border}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <Icon
                                  size={14}
                                  className={`shrink-0 ${style.text}`}
                                />

                                <span className="truncate text-xs font-bold uppercase tracking-wider text-gray-900">
                                  {note.employeeName}
                                </span>
                              </div>

                              <span
                                className={`shrink-0 rounded-md border bg-white/60 px-2 py-1 text-[10px] font-bold ${style.text} ${style.border}`}
                              >
                                {note.messageType === MESSAGE_TYPES.URGENT
                                  ? 'Urgent'
                                  : note.messageType === MESSAGE_TYPES.CONCERN
                                    ? 'Concern'
                                    : 'General'}
                              </span>
                            </div>

                            <p className="mt-2 text-[11px] font-medium text-gray-500">
                              {formatIsoDateTimeToRelativeDateTime(note.postedAt)}
                            </p>

                            <p className="mt-3 break-words text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                              {note.subject || 'No subject'}
                            </p>

                            <p
                              className={`mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-gray-700 [overflow-wrap:anywhere] ${expandedNoteIds.includes(note.messageId)
                                  ? ''
                                  : 'line-clamp-3'
                                }`}
                            >
                              {note.messageText}
                            </p>

                            {shouldShowViewMore(note.messageText) && (
                              <button
                                type="button"
                                disabled={isAcknowledging}
                                onClick={() =>
                                  toggleExpandedNote(note.messageId)
                                }
                                className="mt-2 text-[11px] font-bold text-[#4a6741] transition-colors hover:text-[#3a5233] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {expandedNoteIds.includes(note.messageId)
                                  ? 'View less'
                                  : 'View more'}
                              </button>
                            )}

                            <motion.button
                              type="button"
                              whileTap={
                                isAcknowledging
                                  ? undefined
                                  : { scale: 0.97 }
                              }
                              disabled={acknowledgingNoteId !== null}
                              onClick={() =>
                                handleAcknowledgeNote(note.messageId)
                              }
                              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#4a6741] px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#3a5233] disabled:cursor-wait disabled:opacity-80"
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {isAcknowledging ? (
                                  <motion.span
                                    key="acknowledging-mobile-note"
                                    initial={{
                                      opacity: 0,
                                      y: 3
                                    }}
                                    animate={{
                                      opacity: 1,
                                      y: 0
                                    }}
                                    exit={{
                                      opacity: 0,
                                      y: -3
                                    }}
                                    className="inline-flex items-center gap-2"
                                  >
                                    <ActionSpinner />

                                    Acknowledging...
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="idle-mobile-note"
                                    initial={{
                                      opacity: 0,
                                      y: 3
                                    }}
                                    animate={{
                                      opacity: 1,
                                      y: 0
                                    }}
                                    exit={{
                                      opacity: 0,
                                      y: -3
                                    }}
                                    className="inline-flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 size={14} />

                                    Acknowledge Note
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          </div>

                          {/* Desktop note */}
                          <div
                            className={`hidden rounded-xl border p-4 sm:block ${style.bg} ${style.border}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() =>
                                      setExpandedNoteTypeInfoId(currentId =>
                                        currentId === note.messageId
                                          ? null
                                          : note.messageId
                                      )
                                    }
                                    aria-expanded={isTypeInfoOpen}
                                    aria-label={`View ${typeInfo.label} note information`}
                                    title={`About ${typeInfo.label} notes`}
                                    className={`inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-white/70 transition-colors ${style.text} ${style.border} ${
                                      isTypeInfoOpen
                                        ? 'ring-2 ring-current/15'
                                        : 'hover:bg-white'
                                    }`}
                                  >
                                    <Icon size={13} />
                                  </motion.button>

                                  <span className="truncate text-xs font-bold uppercase tracking-wider text-gray-900">
                                    {note.employeeName}
                                  </span>
                                </div>

                                <span className="mt-1 block text-[10px] font-medium text-gray-500">
                                  {formatIsoDateTimeToRelativeDateTime(note.postedAt)}
                                </span>
                                <AnimatePresence initial={false}>
                                  {isTypeInfoOpen && (
                                    <motion.div
                                      initial={{
                                        opacity: 0,
                                        height: 0,
                                        y: -4
                                      }}
                                      animate={{
                                        opacity: 1,
                                        height: 'auto',
                                        y: 0
                                      }}
                                      exit={{
                                        opacity: 0,
                                        height: 0,
                                        y: -4
                                      }}
                                      transition={{
                                        duration: 0.24,
                                        ease: [0.22, 1, 0.36, 1]
                                      }}
                                      className="overflow-hidden"
                                    >
                                      <div
                                        className={`mt-3 rounded-xl border bg-white/70 p-3 ${style.border}`}
                                      >
                                        <p className={`text-xs font-bold ${style.text}`}>
                                          {typeInfo.label} Note
                                        </p>

                                        <p className="mt-1 text-[11px] leading-relaxed text-gray-600">
                                          {typeInfo.description}
                                        </p>

                                        <div className="mt-2 rounded-lg bg-white/80 px-3 py-2">
                                          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                            Example
                                          </p>

                                          <p className="mt-1 text-[11px] italic leading-relaxed text-gray-600">
                                            “{typeInfo.example}”
                                          </p>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <motion.button
                                type="button"
                                whileHover={
                                  isAcknowledging
                                    ? undefined
                                    : { scale: 1.02 }
                                }
                                whileTap={
                                  isAcknowledging
                                    ? undefined
                                    : { scale: 0.95 }
                                }
                                disabled={acknowledgingNoteId !== null}
                                onClick={() =>
                                  handleAcknowledgeNote(note.messageId)
                                }
                                className="inline-flex min-w-[112px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#4a6741]/20 px-3 py-2 text-[11px] font-bold text-[#4a6741] transition-colors hover:bg-[#4a6741] hover:text-white disabled:cursor-wait disabled:bg-[#4a6741] disabled:text-white disabled:opacity-80"
                              >
                                <AnimatePresence mode="wait" initial={false}>
                                  {isAcknowledging ? (
                                    <motion.span
                                      key="acknowledging-desktop-note"
                                      initial={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1
                                      }}
                                      exit={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      className="inline-flex items-center gap-1.5"
                                    >
                                      <ActionSpinner />

                                      Saving...
                                    </motion.span>
                                  ) : (
                                    <motion.span
                                      key="idle-desktop-note"
                                      initial={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1
                                      }}
                                      exit={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      className="inline-flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 size={14} />

                                      Acknowledge
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                            </div>

                            <p className="mt-3 break-words text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                              {note.subject || 'No subject'}
                            </p>

                            <p
                              className={`mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-gray-700 [overflow-wrap:anywhere] ${expandedNoteIds.includes(note.messageId)
                                  ? ''
                                  : 'line-clamp-2'
                                }`}
                            >
                              {note.messageText}
                            </p>

                            {shouldShowViewMore(note.messageText) && (
                              <button
                                type="button"
                                disabled={isAcknowledging}
                                onClick={() =>
                                  toggleExpandedNote(note.messageId)
                                }
                                className="mt-2 text-[11px] font-bold text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {expandedNoteIds.includes(note.messageId)
                                  ? 'View less'
                                  : 'View more'}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* Pending Inventory Requests */}
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: {
                duration: 0.3,
                delay: 0.4
              },
              y: {
                duration: 0.3,
                delay: 0.4
              },
              layout: {
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1]
              }
            }}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex shrink-0 items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                <Package
                  size={18}
                  className="shrink-0 text-[#4a6741]"
                />

                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-gray-900">
                    Inventory Requests
                  </h2>

                  <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                    {inventoryRequests.length} pending{' '}
                    {inventoryRequests.length === 1
                      ? 'request'
                      : 'requests'}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {getHiddenPanelItemCount(inventoryRequests) > 0 && (
                  <span className="text-[11px] font-bold text-gray-500">
                    {getHiddenPanelItemCount(inventoryRequests)} more
                  </span>
                )}

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setExpandedPanel('inventory')}
                  className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors ${
                    getHiddenPanelItemCount(inventoryRequests) > 0
                      ? 'border-[#4a6741]/20 bg-[#4a6741]/10 text-[#4a6741] hover:bg-[#4a6741] hover:text-white'
                      : 'border-transparent text-gray-400 hover:bg-gray-50 hover:text-[#4a6741]'
                  }`}
                  title={
                    getHiddenPanelItemCount(inventoryRequests) > 0
                      ? `View ${getHiddenPanelItemCount(inventoryRequests)} more inventory requests`
                      : 'Expand inventory requests'
                  }
                  aria-label={
                    getHiddenPanelItemCount(inventoryRequests) > 0
                      ? `View ${getHiddenPanelItemCount(inventoryRequests)} more inventory requests`
                      : 'Expand inventory requests'
                  }
                >
                  <Maximize size={15} />
                </motion.button>
              </div>
            </div>

            {inventoryActionError && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {inventoryActionError}
              </div>
            )}

            <div className="max-h-[250px] overflow-x-hidden overflow-y-auto pr-2">
              {isLoadingDashboard ? (
                <LoadingState label="Loading inventory requests..." />
              ) : (
                <motion.div
                  layout
                  transition={{
                    layout: {
                      duration: 0.42,
                      ease: [0.22, 1, 0.36, 1]
                    }
                  }}
                  className="space-y-3"
                >
                  <AnimatePresence initial={false} mode="sync">
                    {getVisiblePanelItems(inventoryRequests).map(req => {
                      const reason = getInventoryRequestReason(req);

                      const isAcknowledging =
                        acknowledgingInventoryRequestId === req.requestId;

                      return (
                        <motion.div
                          layout
                          key={req.requestId}
                          {...acknowledgeCardMotion}
                        >
                          {/* Mobile inventory request */}
                          <div className="rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#4a6741]/40 hover:shadow-md sm:hidden">
                            <div className="flex items-start gap-3.5">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                                <Package size={18} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <p className="min-w-0 flex-1 break-words text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                                    {req.itemName}
                                  </p>

                                  <span className="max-w-[45%] shrink-0 break-words text-right text-[11px] font-medium text-gray-500 [overflow-wrap:anywhere]">
                                    {req.requestedBy}
                                  </span>
                                </div>

                                {req.postedAt && (
                                  <p className="mt-1 text-[10px] font-medium text-gray-400">
                                    {formatIsoDateTimeToRelativeDateTime(
                                      req.postedAt
                                    )}
                                  </p>
                                )}

                                <div className="mt-2">
                                  <span className="inline-flex rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                    Qty: {req.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <motion.button
                              type="button"
                              whileTap={
                                isAcknowledging
                                  ? undefined
                                  : { scale: 0.97 }
                              }
                              disabled={
                                acknowledgingInventoryRequestId !== null
                              }
                              onClick={() =>
                                handleUpdateInventoryRequest(
                                  req.requestId,
                                  REQUEST_STATUS.ACKNOWLEDGED
                                )
                              }
                              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#4a6741] px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-[#3a5233] disabled:cursor-wait disabled:opacity-80"
                              title={
                                isAcknowledging
                                  ? 'Acknowledging request...'
                                  : 'Acknowledge Request'
                              }
                              aria-label={
                                isAcknowledging
                                  ? 'Acknowledging inventory request'
                                  : 'Acknowledge inventory request'
                              }
                            >
                              <AnimatePresence mode="wait" initial={false}>
                                {isAcknowledging ? (
                                  <motion.span
                                    key="acknowledging-mobile-request"
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -3 }}
                                    className="inline-flex items-center gap-2"
                                  >
                                    <ActionSpinner />
                                    Acknowledging...
                                  </motion.span>
                                ) : (
                                  <motion.span
                                    key="idle-mobile-request"
                                    initial={{ opacity: 0, y: 3 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -3 }}
                                    className="inline-flex items-center gap-1.5"
                                  >
                                    <CheckCircle2 size={16} />
                                    Acknowledge Request
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                          </div>

                          {/* Desktop inventory request */}
                          <div className="hidden rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-[#4a6741]/40 hover:shadow-md sm:block">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex min-w-0 flex-1 items-start gap-3.5">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                                  <Package size={18} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-baseline gap-1.5">
                                    <p className="break-words text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                                      {req.itemName}
                                    </p>

                                    <span className="text-[11px] text-gray-300">
                                      •
                                    </span>

                                    <span className="break-words text-[11px] font-medium text-gray-500 [overflow-wrap:anywhere]">
                                      {req.requestedBy}
                                    </span>
                                  </div>

                                  {req.postedAt && (
                                    <p className="mt-1 text-[10px] font-medium text-gray-400">
                                      {formatIsoDateTimeToRelativeDateTime(
                                        req.postedAt
                                      )}
                                    </p>
                                  )}
                                  <div className="mt-2">
                                    <span className="inline-flex rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                                      Qty: {req.quantity}
                                    </span>
                                  </div>

                                  {reason && (
                                    <div className="mt-3 w-full">
                                      <p
                                        className={`whitespace-pre-line break-words text-xs leading-relaxed text-gray-600 [overflow-wrap:anywhere] ${expandedInventoryRequestIds.includes(
                                          req.requestId
                                        )
                                            ? ''
                                            : 'line-clamp-2'
                                          }`}
                                      >
                                        {reason}
                                      </p>

                                      {shouldShowViewMore(reason, 90) && (
                                        <button
                                          type="button"
                                          disabled={isAcknowledging}
                                          onClick={() =>
                                            toggleExpandedInventoryRequest(
                                              req.requestId
                                            )
                                          }
                                          className="mt-2 text-[11px] font-bold text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {expandedInventoryRequestIds.includes(
                                            req.requestId
                                          )
                                            ? 'View less'
                                            : 'View more'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <motion.button
                                type="button"
                                whileHover={
                                  isAcknowledging
                                    ? undefined
                                    : { scale: 1.02 }
                                }
                                whileTap={
                                  isAcknowledging
                                    ? undefined
                                    : { scale: 0.95 }
                                }
                                disabled={
                                  acknowledgingInventoryRequestId !== null
                                }
                                onClick={() =>
                                  handleUpdateInventoryRequest(
                                    req.requestId,
                                    REQUEST_STATUS.ACKNOWLEDGED
                                  )
                                }
                                className="inline-flex min-w-[112px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#4a6741]/20 px-3 py-2 text-[11px] font-bold text-[#4a6741] transition-colors hover:bg-[#4a6741] hover:text-white disabled:cursor-wait disabled:bg-[#4a6741] disabled:text-white disabled:opacity-80"
                                title={
                                  isAcknowledging
                                    ? 'Acknowledging request...'
                                    : 'Acknowledge Request'
                                }
                                aria-label={
                                  isAcknowledging
                                    ? 'Acknowledging inventory request'
                                    : 'Acknowledge inventory request'
                                }
                              >
                                <AnimatePresence mode="wait" initial={false}>
                                  {isAcknowledging ? (
                                    <motion.span
                                      key="acknowledging-desktop-request"
                                      initial={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1
                                      }}
                                      exit={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      className="inline-flex items-center gap-1.5"
                                    >
                                      <ActionSpinner />
                                      Saving...
                                    </motion.span>
                                  ) : (
                                    <motion.span
                                      key="idle-desktop-request"
                                      initial={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      animate={{
                                        opacity: 1,
                                        scale: 1
                                      }}
                                      exit={{
                                        opacity: 0,
                                        scale: 0.9
                                      }}
                                      className="inline-flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 size={14} />
                                      Acknowledge
                                    </motion.span>
                                  )}
                                </AnimatePresence>
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {inventoryRequests.length === 0 && (
                      <motion.p
                        layout
                        key="compact-inventory-empty"
                        initial={{
                          opacity: 0,
                          y: 6
                        }}
                        animate={{
                          opacity: 1,
                          y: 0
                        }}
                        exit={{
                          opacity: 0,
                          y: -6
                        }}
                        transition={{
                          duration: 0.28,
                          ease: [0.22, 1, 0.36, 1]
                        }}
                        className="py-4 text-center text-sm text-gray-500"
                      >
                        No pending inventory requests.
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </motion.div>

        </div>
      </div>
      {/* ── EXPANDED NOTES / INVENTORY PANEL ── */}
      <AnimatePresence>
        {expandedPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setExpandedPanel(null)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          >
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.94, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 14 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 24,
                layout: {
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1]
                }
              }}
              onClick={e => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl"
            >
              <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4a6741]/10 text-[#4a6741] flex items-center justify-center">
                    {expandedPanel === 'notes' ? (
                      <MessageSquare size={20} />
                    ) : (
                      <Package size={20} />
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {expandedPanel === 'notes'
                        ? 'Staff Notes Inbox'
                        : 'Inventory Requests'}
                    </h3>

                    <p className="text-xs text-gray-500 font-medium">
                      {expandedPanel === 'notes'
                        ? `${staffNotes.length} new ${staffNotes.length === 1 ? 'note' : 'notes'}`
                        : `${inventoryRequests.length} pending ${inventoryRequests.length === 1 ? 'request' : 'requests'}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Minimize expanded panel"
                  title="Minimize expanded panel"
                  onClick={() => setExpandedPanel(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <Minimize size={16} />
                </button>
              </div>

              <div className="overflow-x-hidden overflow-y-auto bg-gray-50/50 p-6">
                {expandedPanel === 'notes' ? (
                  <motion.div layout className="space-y-3">
                    {staffNotes.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-4 text-center text-sm text-gray-500"
                      >
                        No new messages from staff.
                      </motion.p>
                    ) : (
                      <AnimatePresence initial={false} mode="sync">
                        {staffNotes.map(note => {
                          const style = getNoteStyle(note.messageType);
                          const Icon = style.icon;

                          const isAcknowledging =
                            acknowledgingNoteId === note.messageId;

                          return (
                            <motion.div
                              layout
                              key={note.messageId}
                              {...acknowledgeCardMotion}
                              className={`rounded-xl border p-4 ${style.bg} ${style.border}`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="truncate text-xs font-bold uppercase tracking-wider text-gray-900">
                                      {note.employeeName}
                                    </span>

                                    <span
                                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border bg-white/60 px-2 py-1 text-[10px] font-bold ${style.text} ${style.border}`}
                                    >
                                      <Icon size={11} />

                                      {note.messageType === MESSAGE_TYPES.URGENT
                                        ? 'Urgent'
                                        : note.messageType === MESSAGE_TYPES.CONCERN
                                          ? 'Concern'
                                          : 'General'}
                                    </span>
                                  </div>

                                  <span className="mt-1 block text-[10px] font-medium text-gray-500">
                                    {formatIsoDateTimeToRelativeDateTime(
                                      note.postedAt
                                    )}
                                  </span>
                                </div>

                                <motion.button
                                  type="button"
                                  whileHover={
                                    isAcknowledging
                                      ? undefined
                                      : { scale: 1.02 }
                                  }
                                  whileTap={
                                    isAcknowledging
                                      ? undefined
                                      : { scale: 0.95 }
                                  }
                                  disabled={acknowledgingNoteId !== null}
                                  onClick={() =>
                                    handleAcknowledgeNote(note.messageId)
                                  }
                                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#4a6741] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#3a5233] disabled:cursor-wait disabled:opacity-80 sm:w-auto sm:min-w-[160px] sm:shrink-0"
                                >
                                  <AnimatePresence mode="wait" initial={false}>
                                    {isAcknowledging ? (
                                      <motion.span
                                        key="acknowledging-expanded-note"
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -3 }}
                                        className="inline-flex items-center gap-2"
                                      >
                                        <ActionSpinner />
                                        Acknowledging...
                                      </motion.span>
                                    ) : (
                                      <motion.span
                                        key="idle-expanded-note"
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -3 }}
                                        className="inline-flex items-center gap-1.5"
                                      >
                                        <CheckCircle2 size={14} />
                                        Acknowledge Note
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              </div>

                              <p className="mt-3 break-words text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                                {note.subject || 'No subject'}
                              </p>

                              <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-gray-700 [overflow-wrap:anywhere]">
                                {note.messageText}
                              </p>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    layout
                    transition={{
                      layout: {
                        duration: 0.42,
                        ease: [0.22, 1, 0.36, 1]
                      }
                    }}
                    className="space-y-3"
                  >
                    <AnimatePresence initial={false} mode="sync">
                        {inventoryRequests.map(req => {
                          const isAcknowledging =
                            acknowledgingInventoryRequestId === req.requestId;

                          return (
                            <motion.div
                              layout
                              key={req.requestId}
                              {...acknowledgeCardMotion}
                              className="rounded-xl border border-gray-200 bg-white p-4"
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 flex-1 items-start gap-3.5">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                                    <Package size={18} />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="break-words text-sm font-bold text-gray-900 [overflow-wrap:anywhere]">
                                      {req.itemName}
                                    </p>

                                    {req.postedAt && (
                                      <p className="mt-1 text-[10px] font-medium text-gray-400">
                                        {formatIsoDateTimeToRelativeDateTime(
                                          req.postedAt
                                        )}
                                      </p>
                                    )}

                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-gray-500">
                                      <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-gray-700">
                                        Qty: {req.quantity}
                                      </span>

                                      <span className="text-gray-300">
                                        •
                                      </span>

                                      <span className="break-words [overflow-wrap:anywhere]">
                                        {req.requestedBy}
                                      </span>
                                    </div>

                                    {getInventoryRequestReason(req) && (
                                      <p className="mt-3 whitespace-pre-line break-words text-xs leading-relaxed text-gray-600 [overflow-wrap:anywhere]">
                                        {getInventoryRequestReason(req)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <motion.button
                                  type="button"
                                  whileHover={
                                    isAcknowledging
                                      ? undefined
                                      : { scale: 1.02 }
                                  }
                                  whileTap={
                                    isAcknowledging
                                      ? undefined
                                      : { scale: 0.95 }
                                  }
                                  disabled={
                                    acknowledgingInventoryRequestId !== null
                                  }
                                  onClick={() =>
                                    handleUpdateInventoryRequest(
                                      req.requestId,
                                      REQUEST_STATUS.ACKNOWLEDGED
                                    )
                                  }
                                  className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-[#4a6741] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#3a5233] disabled:cursor-wait disabled:opacity-80 sm:w-auto sm:min-w-[174px] sm:shrink-0"
                                >
                                  <AnimatePresence mode="wait" initial={false}>
                                    {isAcknowledging ? (
                                      <motion.span
                                        key="acknowledging-expanded-inventory"
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -3 }}
                                        className="inline-flex items-center gap-2"
                                      >
                                        <ActionSpinner />
                                        Acknowledging...
                                      </motion.span>
                                    ) : (
                                      <motion.span
                                        key="idle-expanded-inventory"
                                        initial={{ opacity: 0, y: 3 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -3 }}
                                        className="inline-flex items-center gap-1.5"
                                      >
                                        <CheckCircle2 size={14} />
                                        Acknowledge Request
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}

                        {inventoryRequests.length === 0 && (
                          <motion.p
                            layout
                            key="expanded-inventory-empty"
                            initial={{
                              opacity: 0,
                              y: 6
                            }}
                            animate={{
                              opacity: 1,
                              y: 0
                            }}
                            exit={{
                              opacity: 0,
                              y: -6
                            }}
                            transition={{
                              duration: 0.28,
                              ease: [0.22, 1, 0.36, 1]
                            }}
                            className="py-8 text-center text-sm text-gray-500"
                          >
                            No pending inventory requests.
                          </motion.p>
                        )}
                      </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL OVERLAY ── */}
      <AnimatePresence>
        {selectedEmployeeId && selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedEmployeeId(null); setExpandedWeekId(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
              >
                {/* Modal Header */}
                <div className="p-6 pb-4 border-b border-gray-100 flex items-start justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4a6741]/10 text-[#4a6741] flex items-center justify-center">
                      <Receipt size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{selectedEmployee.fullName}'s History</h3>
                      <p className="text-xs text-gray-500 font-medium">Physical Cash Reporting</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Close staff history modal"
                    title="Close staff history modal"
                    onClick={() => { setSelectedEmployeeId(null); setExpandedWeekId(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 bg-gray-50/50 overflow-y-auto">
                  {isLoadingDashboard ? (
                    <LoadingState label="Loading employee history..." />
                  ) : employeeHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                        <Receipt size={20} className="text-gray-400" />
                      </div>
                      <p className="text-sm font-semibold text-gray-600">No shift history</p>
                      <p className="text-xs text-gray-400 mt-1 max-w-[160px]">This employee hasn't completed any shifts yet, or they have all been archived.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employeeHistory.map((weekData: any) => {
                        const isExpanded = expandedWeekId === weekData.id;

                        return (
                          <div key={weekData.id} className="space-y-3">
                            <div className="sm:hidden bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                              <div className="p-4 border-b border-gray-100">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900">
                                      {weekData.weekRange}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-gray-500 font-medium">
                                      {weekData.shifts.length} Shifts Recorded
                                    </p>
                                  </div>

                                  <div className="shrink-0 text-right">
                                    <p className="text-sm font-bold text-[#4a6741]">
                                      ₱ {weekData.totalCash.toLocaleString('en-US', {
                                        minimumFractionDigits: 2
                                      })}
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                      Total cash
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 space-y-3 bg-gray-50/40">
                                {weekData.shifts.map((shift: ShiftSummaryItem) => (
                                  <div
                                    key={shift.shiftId}
                                    className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm"
                                  >
                                    <div className="flex items-start justify-between gap-3 border-b border-gray-50 pb-2">
                                      <div>
                                        <p className="text-sm font-bold text-gray-900">
                                          {formatIsoDateTimeToDate(String(shift.shiftDate))}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-400">
                                          {formatIsoDateTimeToTime(String(shift.startTime))}
                                          <span>
                                            {' '}–{' '}
                                            {shift.endTime
                                              ? formatIsoDateTimeToTime(String(shift.endTime))
                                              : '—'}
                                          </span>
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                      <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                          Opening Cash
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-gray-900">
                                          ₱ {Number(shift.openingCash).toLocaleString('en-US', {
                                            minimumFractionDigits: 2
                                          })}
                                        </p>
                                      </div>

                                      <div className="rounded-lg bg-gray-50 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                          Closing Cash
                                        </p>
                                        <p className="mt-1 text-sm font-bold text-gray-900">
                                          ₱ {Number(shift.closingCash).toLocaleString('en-US', {
                                            minimumFractionDigits: 2
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                <div className="flex flex-col gap-2 pt-2">
                                  <button
                                    onClick={() => handleExportCSV(weekData)}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-white bg-[#4a6741] hover:bg-[#3a5233] shadow-sm rounded-xl transition-colors"
                                  >
                                    <Download size={14} />
                                    Export to CSV
                                  </button>
                                  <button
                                    disabled={isArchiving}
                                    onClick={() => {
                                      setArchiveError(null);
                                      setConfirmArchiveData(weekData);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 size={14} />
                                    Clear Week
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-[#4a6741]/30">
                              <button
                                type="button"
                                onClick={() => setExpandedWeekId(isExpanded ? null : weekData.id)}
                                className="w-full cursor-pointer flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex items-center gap-4 text-left">
                                  <div className={`w-1.5 h-10 rounded-full transition-colors ${isExpanded ? 'bg-[#4a6741]' : 'bg-gray-200'}`} />
                                  <div>
                                    <p className="text-sm font-bold text-gray-900">
                                      {weekData.weekRange}
                                    </p>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                      {weekData.shifts.length} Shifts Recorded
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  <span className={`text-sm font-bold transition-colors ${isExpanded ? 'text-[#4a6741]' : 'text-gray-900'}`}>
                                    ₱ {weekData.totalCash.toLocaleString('en-US', {
                                      minimumFractionDigits: 2
                                    })}
                                  </span>
                                  <div className={`transition-transform duration-200 ${isExpanded ? 'text-[#4a6741]' : 'text-gray-400'}`}>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </div>
                                </div>
                              </button>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-gray-100 bg-gray-50/30"
                                  >
                                    <div className="p-5 space-y-4">
                                      <div className="space-y-2">
                                        {weekData.shifts.map((shift: ShiftSummaryItem) => (
                                          <div
                                            key={shift.shiftId}
                                            className="flex flex-col p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:border-[#4a6741]/20 transition-colors"
                                          >
                                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
                                              <span className="text-sm font-bold text-gray-800">
                                                {String(shift.shiftDate)}
                                                <span className="text-xs font-normal text-gray-400 ml-1">
                                                  {formatIsoDateTimeToTime(String(shift.startTime))}
                                                </span>
                                              </span>
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-gray-500">
                                              <span>
                                                In: ₱ {Number(shift.openingCash).toLocaleString('en-US', {
                                                  minimumFractionDigits: 2
                                                })}
                                              </span>
                                              <span>
                                                Out: ₱ {Number(shift.closingCash).toLocaleString('en-US', {
                                                  minimumFractionDigits: 2
                                                })}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="flex items-center justify-end gap-2 pt-2">
                                        <button
                                          disabled={isArchiving}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setArchiveError(null);
                                            setConfirmArchiveData(weekData);
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                          <Trash2 size={14} />
                                          Clear Week
                                        </button>

                                        <button
                                          onClick={() => handleExportCSV(weekData)}
                                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#4a6741] hover:bg-[#3a5233] shadow-sm rounded-lg transition-colors"
                                        >
                                          <Download size={14} />
                                          Export to CSV
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── CONFIRM ARCHIVE MODAL ── */}
      <AnimatePresence>
        {confirmArchiveData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[20px] shadow-xl w-full max-w-[320px] p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1.5 tracking-tight">Archive records?</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                This will remove the selected shifts from your current view.
              </p>

              {archiveError && (
                <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {archiveError}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleArchiveWeek}
                  disabled={isArchiving}
                  className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isArchiving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Archive'
                  )}
                </button>
                <button
                  onClick={() => {
                    setArchiveError(null);
                    setConfirmArchiveData(null);
                  }}
                  disabled={isArchiving}
                  className="w-full py-2.5 bg-transparent hover:bg-gray-50 text-gray-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
