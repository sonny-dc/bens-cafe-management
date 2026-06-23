import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, Banknote, TrendingUp, TrendingDown, 
  MessageSquare, AlertTriangle, Info, Package, CheckCircle2, XCircle, Search, X, Receipt, ChevronDown, ChevronUp, Download, Trash2
} from 'lucide-react';
import { shiftSummaryApi } from '../../api/shiftSummaryApi';
import { type ShiftSession } from 'shared/models';

const API_BASE_URL = 'http://localhost:3000/api';

// --- MOCK DATA FOR PROFIT REPORT (Still mock since we haven't built sales summary per employee) ---
const PROFIT_REPORT = [
  { id: 1, name: 'Maria Santos', totalSales: 4500.50, transactions: 32, trend: 'up', percentage: '+12%' },
];

// --- HELPERS ---
const getNoteStyle = (type: string) => {
  switch (type) {
    case 'urgent': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: AlertTriangle };
    case 'concern': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: MessageSquare };
    default: return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: Info };
  }
};

const formatDateToYYYYMMDD = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export function AdminStaffBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [expandedWeekId, setExpandedWeekId] = useState<string | null>(null);
  const [confirmArchiveData, setConfirmArchiveData] = useState<any>(null);
  
  // API State
  const [allShifts, setAllShifts] = useState<ShiftSession[]>([]);
  const [activeShifts, setActiveShifts] = useState<any[]>([]);
  const [staffNotes, setStaffNotes] = useState<any[]>([]);
  const [inventoryRequests, setInventoryRequests] = useState<any[]>([]);
  
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoadingShifts(true);
      // 1. Fetch History Summary
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      const shiftData = await shiftSummaryApi.getSummary(formatDateToYYYYMMDD(start), formatDateToYYYYMMDD(end));
      setAllShifts(shiftData);

      // 2. Fetch Active Shifts
      const activeRes = await fetch(`${API_BASE_URL}/shifts/active/all`);
      const activeJson = await activeRes.json();
      setActiveShifts(activeJson.data || []);

      // 3. Fetch Staff Notes
      const notesRes = await fetch(`${API_BASE_URL}/staff-messages`);
      const notesJson = await notesRes.json();
      setStaffNotes((notesJson.data || []).filter((n: any) => n.messageStatus === 'new'));

      // 4. Fetch Inventory Requests
      const invRes = await fetch(`${API_BASE_URL}/inventory-requests`);
      const invJson = await invRes.json();
      setInventoryRequests((invJson.data || []).filter((r: any) => r.status === 'pending'));

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingShifts(false);
    }
  };

  const handleAcknowledgeNote = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/staff-messages/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'acknowledged' })
      });
      setStaffNotes(prev => prev.filter(n => n.messageId !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInventoryRequest = async (id: number, status: string) => {
    try {
      await fetch(`${API_BASE_URL}/inventory-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setInventoryRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  // Group shifts by Employee -> by Week (Wednesday to Wednesday)
  const getEmployeeHistory = (empId: number) => {
    const empShifts = allShifts.filter(s => s.employeeId === empId && s.status === 'completed');
    
    // Simple grouping by exact week string for display
    const grouped: Record<string, any> = {};
    
    empShifts.forEach(shift => {
      const dateObj = new Date(shift.shiftDate);
      const day = dateObj.getDay();
      const diffToWed = day >= 3 ? day - 3 : day + 4;
      
      const wedStart = new Date(dateObj);
      wedStart.setDate(dateObj.getDate() - diffToWed);
      
      const wedEnd = new Date(wedStart);
      wedEnd.setDate(wedStart.getDate() + 7);
      
      const weekLabel = `Wed, ${wedStart.toLocaleDateString([], { month:'short', day:'numeric' })} - Wed, ${wedEnd.toLocaleDateString([], { month:'short', day:'numeric' })}`;
      const weekId = wedStart.toISOString();

      if (!grouped[weekId]) {
        grouped[weekId] = {
          id: weekId,
          weekRange: weekLabel,
          startDate: formatDateToYYYYMMDD(wedStart),
          endDate: formatDateToYYYYMMDD(wedEnd),
          shifts: [],
          totalCash: 0
        };
      }
      
      grouped[weekId].shifts.push(shift);
      grouped[weekId].totalCash += Number(shift.closingCash);
    });
    
    return Object.values(grouped).sort((a, b) => b.id.localeCompare(a.id)); // Newest first
  };

  const handleExportCSV = (weekData: any) => {
    const rows = [
      ["Date", "Start Time", "End Time", "Opening Cash", "Closing Cash", "Cash Variance"],
      ...weekData.shifts.map((s: ShiftSession) => [
        new Date(s.shiftDate).toLocaleDateString(),
        new Date(s.startTime).toLocaleTimeString(),
        s.endTime ? new Date(s.endTime).toLocaleTimeString() : 'N/A',
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
      await shiftSummaryApi.archiveWeek(confirmArchiveData.startDate, confirmArchiveData.endDate);
      await fetchDashboardData(); // Refresh everything
      setExpandedWeekId(null);
      setConfirmArchiveData(null);
    } catch (err) {
      alert("Failed to archive shifts.");
    } finally {
      setIsArchiving(false);
    }
  };

  const selectedEmployee = PROFIT_REPORT.find(r => r.id === selectedEmployeeId);
  const employeeHistory = selectedEmployeeId ? getEmployeeHistory(selectedEmployeeId) : [];

  return (
    <div className="space-y-6">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search staff members, notes, or requests..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
             {activeShifts.length} Staff On Duty
           </span>
        </div>
      </div>

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
              {activeShifts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No staff currently clocked in.</p>
              ) : (
                activeShifts.map(staff => {
                  const hoursElapsed = ((new Date().getTime() - new Date(staff.clockInTime).getTime()) / (1000 * 60 * 60)).toFixed(1);
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
                        <p className="text-xs font-bold text-gray-900">{hoursElapsed} hrs</p>
                        <p className="text-[10px] text-gray-400">In at {new Date(staff.clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
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
              <h2 className="font-semibold text-gray-900">Staff Sales Performance</h2>
            </div>
            
            <div className="space-y-4">
              {PROFIT_REPORT.map(report => (
                <div 
                  key={report.id} 
                  onClick={() => setSelectedEmployeeId(report.id)}
                  className="flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                      <Users size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-[#4a6741]">{report.name}</p>
                      <p className="text-[11px] text-gray-500">Click to view shift history</p>
                    </div>
                  </div>
                </div>
              ))}
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
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {staffNotes.length === 0 ? (
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
                        <span className="text-[10px] text-gray-500 font-medium">{new Date(note.postedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
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
            
            <div className="space-y-3">
              {inventoryRequests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No pending inventory requests.</p>
              ) : (
                inventoryRequests.map(req => (
                  <div key={req.id} className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#4a6741]/40 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3.5">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500">
                        <Package size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-0.5">{req.item}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 text-gray-700">{req.quantity}</span>
                          <span>•</span>
                          <span>{req.requestedBy}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleUpdateInventoryRequest(req.id, 'fulfilled')}
                        className="flex items-center justify-center w-8 h-8 text-[#4a6741] hover:text-white hover:bg-[#4a6741] rounded-lg transition-all shadow-sm border border-[#4a6741]/20" 
                        title="Approve"
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
                      <h3 className="font-bold text-gray-900 text-lg">{selectedEmployee.name}'s History</h3>
                      <p className="text-xs text-gray-500 font-medium">Physical Cash Reporting</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setSelectedEmployeeId(null); setExpandedWeekId(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Modal Body - Scrollable */}
                <div className="p-6 bg-gray-50/50 overflow-y-auto">
                  {isLoadingShifts ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-gray-400">Loading history...</p>
                    </div>
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
                                      {weekData.shifts.map((shift: ShiftSession) => (
                                        <div key={shift.shiftId} className="flex flex-col p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:border-[#4a6741]/20 transition-colors">
                                          <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
                                            <span className="text-sm font-bold text-gray-800">
                                              {new Date(shift.shiftDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                              <span className="text-xs font-normal text-gray-400 ml-1">
                                                {new Date(shift.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
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
                                        Export to Excel
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
                  onClick={() => setConfirmArchiveData(null)}
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
