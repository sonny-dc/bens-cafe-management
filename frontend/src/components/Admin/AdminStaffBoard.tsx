import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Clock, Banknote, TrendingUp, TrendingDown, 
  MessageSquare, AlertTriangle, Info, Package, CheckCircle2, XCircle, Search, X, Receipt, ChevronDown, ChevronUp, Download, Trash2
} from 'lucide-react';

// --- MOCK DATA ---

const ACTIVE_SHIFTS = [
  { id: 1, name: 'Maria Santos', role: 'Head Barista', clockIn: '06:00 AM', hours: '4.5 hrs', avatar: 'MS' },
  { id: 2, name: 'Juan Dela Cruz', role: 'Cashier', clockIn: '07:30 AM', hours: '3 hrs', avatar: 'JD' },
];

const PROFIT_REPORT = [
  { id: 1, name: 'Maria Santos', totalSales: 4500.50, transactions: 32, trend: 'up', percentage: '+12%' },
  { id: 2, name: 'Juan Dela Cruz', totalSales: 3200.00, transactions: 45, trend: 'up', percentage: '+5%' },
  { id: 3, name: 'Elena Gomez', totalSales: 2100.75, transactions: 18, trend: 'down', percentage: '-2%' },
];

const WEEKLY_SUMMARY_HISTORY: Record<number, any[]> = {
  1: [
    { 
      id: 1001, 
      weekRange: 'Wed, Jun 10 - Wed, Jun 17', 
      totalWeekSales: 8400.50,
      isExported: false,
      shifts: [
        { id: 101, date: 'Jun 17 (Wed)', time: '2:30 PM', cash: 2000.00, gcash: 1500.50, total: 3500.50 },
        { id: 102, date: 'Jun 16 (Tue)', time: '3:00 PM', cash: 1800.00, gcash: 1200.00, total: 3000.00 },
        { id: 103, date: 'Jun 15 (Mon)', time: '4:15 PM', cash: 1100.00, gcash: 800.00, total: 1900.00 }
      ]
    },
    { 
      id: 1002, 
      weekRange: 'Wed, Jun 3 - Wed, Jun 10', 
      totalWeekSales: 12500.00,
      isExported: true,
      shifts: [
        { id: 104, date: 'Jun 10 (Wed)', time: '5:00 PM', cash: 3000.00, gcash: 2500.00, total: 5500.00 },
        { id: 105, date: 'Jun 8 (Mon)', time: '2:00 PM', cash: 4000.00, gcash: 3000.00, total: 7000.00 }
      ]
    }
  ],
  2: [
    { 
      id: 2001, 
      weekRange: 'Wed, Jun 10 - Wed, Jun 17', 
      totalWeekSales: 6100.00,
      isExported: false,
      shifts: [
        { id: 201, date: 'Jun 17 (Wed)', time: '4:00 PM', cash: 1200.00, gcash: 1000.00, total: 2200.00 },
        { id: 202, date: 'Jun 14 (Sun)', time: '5:30 PM', cash: 2500.00, gcash: 1400.00, total: 3900.00 }
      ]
    }
  ],
  3: [
    { 
      id: 3001, 
      weekRange: 'Wed, Jun 10 - Wed, Jun 17', 
      totalWeekSales: 2100.75,
      isExported: false,
      shifts: [
        { id: 301, date: 'Jun 16 (Tue)', time: '8:00 PM', cash: 1600.75, gcash: 500.00, total: 2100.75 }
      ]
    }
  ]
};

const STAFF_NOTES = [
  { id: 101, author: 'Maria Santos', type: 'urgent', time: '10:15 AM', subject: 'Coffee beans running low', text: 'We only have 1 bag of Arabica left for the morning rush.' },
  { id: 102, author: 'Juan Dela Cruz', type: 'concern', time: '09:30 AM', subject: 'Register Drawer Issue', text: 'The cash register drawer is getting stuck when opening.' },
  { id: 103, author: 'Elena Gomez', type: 'general', time: 'Yesterday', subject: 'Shift Swap Request', text: 'Can I swap my Friday shift with Mark?' },
];

const INVENTORY_REQUESTS = [
  { id: 201, item: 'Oat Milk (Barista Ed.)', quantity: '2 Boxes', requestedBy: 'Maria Santos', status: 'pending' },
  { id: 202, item: 'Large Paper Cups', quantity: '5 Sleeves', requestedBy: 'Elena Gomez', status: 'pending' },
  { id: 203, item: 'Vanilla Syrup', quantity: '3 Bottles', requestedBy: 'Juan Dela Cruz', status: 'approved' },
];

// --- HELPERS ---

const getNoteStyle = (type: string) => {
  switch (type) {
    case 'urgent': return { bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-700', icon: AlertTriangle };
    case 'concern': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: MessageSquare };
    default: return { bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', icon: Info };
  }
};

export function AdminStaffBoard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [expandedWeekId, setExpandedWeekId] = useState<number | null>(null);

  const selectedEmployee = PROFIT_REPORT.find(r => r.id === selectedEmployeeId);
  const employeeHistory = selectedEmployeeId ? WEEKLY_SUMMARY_HISTORY[selectedEmployeeId] || [] : [];

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
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold border border-green-100">
             {ACTIVE_SHIFTS.length} Staff On Duty
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
              {ACTIVE_SHIFTS.map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#4a6741] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {staff.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{staff.name}</p>
                      <p className="text-xs text-gray-500">{staff.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-900">{staff.hours}</p>
                    <p className="text-[10px] text-gray-400">In at {staff.clockIn}</p>
                  </div>
                </div>
              ))}
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
                      <p className="text-[11px] text-gray-500">{report.transactions} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₱ {report.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <div className={`flex items-center justify-end gap-1 text-[11px] font-bold ${report.trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
                      {report.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                      {report.percentage}
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
              <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-1 rounded-full">1 Urgent</span>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {STAFF_NOTES.map(note => {
                const style = getNoteStyle(note.type);
                const Icon = style.icon;
                return (
                  <div key={note.id} className={`p-4 rounded-xl border ${style.bg} ${style.border}`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className={style.text} />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-900">{note.author}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium">{note.time}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1">{note.subject}</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{note.text}</p>
                    <div className="mt-3 flex justify-end">
                      <button className="text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors">
                        Mark as Acknowledged
                      </button>
                    </div>
                  </div>
                )
              })}
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
              {INVENTORY_REQUESTS.map(req => (
                <div key={req.id} className="group flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#4a6741]/40 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3.5">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${req.status === 'pending' ? 'bg-gray-100 text-gray-500' : 'bg-[#4a6741]/10 text-[#4a6741]'}`}>
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
                  
                  {req.status === 'pending' ? (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm hover:shadow" title="Deny">
                        <XCircle size={16} />
                      </button>
                      <button className="flex items-center justify-center w-8 h-8 text-[#4a6741] hover:text-white hover:bg-[#4a6741] rounded-lg transition-all shadow-sm hover:shadow" title="Approve">
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-[#4a6741] bg-[#4a6741]/10 border border-[#4a6741]/20 px-2.5 py-1 rounded-md uppercase tracking-widest">
                      Approved
                    </span>
                  )}
                </div>
              ))}
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
              onClick={() => { setSelectedEmployeeId(null); setExpandedShiftId(null); }}
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
                      <p className="text-xs text-gray-500 font-medium">{employeeHistory.length} Weeks Recorded</p>
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
                                ₱ {weekData.totalWeekSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                                    {weekData.shifts.map((shift: any) => (
                                      <div key={shift.id} className="flex flex-col p-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:border-[#4a6741]/20 transition-colors">
                                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-50">
                                          <span className="text-sm font-bold text-gray-800">{shift.date} <span className="text-xs font-normal text-gray-400 ml-1">{shift.time}</span></span>
                                          <span className="text-sm font-bold text-[#4a6741]">₱ {shift.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                          <span>Cash: ₱ {shift.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                          <span>GCash: ₱ {shift.gcash.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center justify-end gap-2 pt-2">
                                    {weekData.isExported && (
                                      <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                        Clear Week
                                      </button>
                                    )}
                                    <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#4a6741] hover:bg-[#3a5233] shadow-sm rounded-lg transition-colors">
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
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
