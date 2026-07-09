import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, Banknote, 
  MessageSquare, AlertTriangle, Info, Package, CheckCircle2, X, Receipt, ChevronDown, ChevronUp, Download, Trash2
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
import { getShiftProgressHours, formatIsoDateTimeToTime, formatIsoDateTimeToDateTime } from '../../utils/datetime.utils';

// --- HELPERS ---
const getNoteStyle = (type: MessageType) => {
  switch (type) {
    case MESSAGE_TYPES.URGENT: return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: AlertTriangle };
    case MESSAGE_TYPES.CONCERN: return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: MessageSquare };
    default: return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: Info };
  }
};

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
  const [currentWeekRange, setCurrentWeekRange] = useState(() =>
    getStoreWeekRange(new Date(), DEFAULT_CLOSING_DAY)
  );
  
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  // Error State
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [noteActionError, setNoteActionError] = useState<string | null>(null);
  const [inventoryActionError, setInventoryActionError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);


  useEffect(() => {
    setShowAllStaffPerformance(false);
    fetchDashboardData();
  }, [closingDay]);


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
    try {
      setNoteActionError(null);

      await notesApi.markNoteAsAcknowledged(messageId);

      setStaffNotes((prev) =>
        prev.filter((note) => note.messageId !== messageId)
      );
    } catch (error) {
      if (error instanceof Error) {
        setNoteActionError(error.message);
      } else {
        setNoteActionError('Failed to acknowledge staff note.');
      }
    }
  };

  
  const handleUpdateInventoryRequest = async (
    requestId: number,
    requestStatus: RequestStatus
  ) => {
    try {
      setInventoryActionError(null);

      await inventoryRequestApi.updateRequestStatus(requestId, requestStatus);

      setInventoryRequests(prev =>
        prev.filter(request => request.requestId !== requestId)
      );
    } catch (error) {
      if (error instanceof Error) {
        setInventoryActionError(error.message);
      } else {
        setInventoryActionError('Failed to update inventory request.');
      }
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

  const visibleStaffPerformance = showAllStaffPerformance
    ? staffPerformance
    : staffPerformance.slice(0, 3);

  const hiddenStaffCount = Math.max(staffPerformance.length - 3, 0);

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
              className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-bold border border-gray-200 outline-none focus:border-[#4a6741]"
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
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
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
                  {visibleStaffPerformance.map(report => (
                    <div 
                      key={report.employeeId}
                      onClick={() => setSelectedEmployeeId(report.employeeId)}
                      className="flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                          <Users size={14} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900 group-hover:text-[#4a6741]">
                            {report.fullName}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {report.jobRole} · {report.completedShifts} completed {report.completedShifts === 1 ? 'shift' : 'shifts'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₱ {Number(report.totalCash).toLocaleString('en-PH', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Weekly cash
                        </p>
                      </div>
                    </div>
                  ))}

                  {hiddenStaffCount > 0 && (
                    <button
                      type="button"
                      aria-label={
                        showAllStaffPerformance
                          ? 'Show fewer staff performance records'
                          : `Show ${hiddenStaffCount} more staff performance records`
                      }
                      onClick={() => setShowAllStaffPerformance(prev => !prev)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
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
                    </button>
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
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-[340px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-[#4a6741]" />
                <h2 className="font-semibold text-gray-900">Staff Notes Inbox</h2>
              </div>
            </div>

            {noteActionError && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {noteActionError}
              </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {isLoadingDashboard ? (
                <LoadingState label="Loading staff notes..." />
              ) : staffNotes.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No new messages from staff.</p>
              ) : (
                staffNotes.map(note => {
                  const style = getNoteStyle(note.messageType);
                  const Icon = style.icon;
                  return (
                    <div key={note.messageId} className={`p-4 rounded-xl border ${style.bg} ${style.border}`}>
                      <div className="flex justify-between items-start mb-1.5">
                        <div className="flex items-center gap-2">
                          <Icon size={14} className={style.text} />
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-900">{note.employeeName}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">{formatIsoDateTimeToDateTime(String(note.postedAt))}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1">{note.subject}</p>
                      <p className="text-xs text-gray-700 leading-relaxed">{note.messageText}</p>
                      <div className="mt-3 flex justify-end">
                        <button 
                          onClick={() => handleAcknowledgeNote(note.messageId)}
                          className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Mark as Acknowledged
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* Pending Inventory Requests */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-50">
              <Package size={18} className="text-[#4a6741]" />
              <h2 className="font-semibold text-gray-900">Inventory Requests</h2>
            </div>

            {inventoryActionError && (
              <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
                {inventoryActionError}
              </div>
            )}
            
            <div className="space-y-3">
              {isLoadingDashboard ? (
                <LoadingState label="Loading inventory requests..." />
              ) : inventoryRequests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No pending inventory requests.</p>
              ) : (
                inventoryRequests.map(req => (
                  <div key={req.requestId} className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#4a6741]/40 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{req.itemName}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 text-gray-700">{req.quantity}</span>
                          <span>•</span>
                          <span>{req.requestedBy}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateInventoryRequest(req.requestId, REQUEST_STATUS.ACKNOWLEDGED)}
                        className="flex items-center justify-center w-8 h-8 text-[#4a6741] hover:text-white hover:bg-[#4a6741] rounded-lg transition-all shadow-sm border border-[#4a6741]/20" 
                        title="Acknowledge Request"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      </div>

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
                          <div key={weekData.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-all hover:border-[#4a6741]/30">
                            {/* Accordion Header */}
                            <button 
                              onClick={() => setExpandedWeekId(isExpanded ? null : weekData.id)}
                              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-4 text-left">
                                <div className={`w-1.5 h-10 rounded-full transition-colors ${isExpanded ? 'bg-[#4a6741]' : 'bg-gray-200'}`} />
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{weekData.weekRange}</p>
                                  <p className="text-[11px] text-gray-500 font-medium">{weekData.shifts.length} Shifts Recorded</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`text-sm font-bold transition-colors ${isExpanded ? 'text-[#4a6741]' : 'text-gray-900'}`}>
                                  ₱ {weekData.totalCash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                                <div className={`transition-transform duration-200 ${isExpanded ? 'text-[#4a6741]' : 'text-gray-400'}`}>
                                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                </div>
                              </div>
                            </button>

                            {/* Accordion Body */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-gray-100 bg-gray-50/30"
                                >
                                  <div className="p-5 space-y-4">
                                    {/* Daily Shifts List */}
                                    <div className="space-y-2">
                                      {weekData.shifts.map((shift: ShiftSummaryItem) => (
                                        <div key={shift.shiftId} className="flex flex-col p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:border-[#4a6741]/20 transition-colors">
                                          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
                                            <span className="text-sm font-bold text-gray-800">
                                              {String(shift.shiftDate)}
                                              <span className="text-xs font-normal text-gray-400 ml-1">
                                                {formatIsoDateTimeToTime(String(shift.startTime))}
                                              </span>
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>In: ₱ {Number(shift.openingCash).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            <span>Out: ₱ {Number(shift.closingCash).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Actions */}
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
                        )
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
