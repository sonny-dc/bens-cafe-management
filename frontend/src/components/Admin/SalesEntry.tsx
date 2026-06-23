import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { salesApi } from '../../api/salesApi';
import { employeeApi } from '../../api/employeeApi';

type Step = 1 | 2 | 3 | 4;

interface EmployeePayroll {
  id: number;
  name: string;
  role: string;
  dailyRate: number;
  isChecked: boolean;
}

interface Expense {
  id: number;
  name: string;
  amount: string;
}

export function SalesEntry() {
  const [step, setStep] = useState<Step>(1);

  const [cashSales, setCashSales] = useState<number | ''>('');
  const [cardSales, setCardSales] = useState<number | ''>('');
  const [physicalCash, setPhysicalCash] = useState<number | ''>('');

  const parsedCash = cashSales || 0;
  const parsedCard = cardSales || 0;
  const totalRevenue = parsedCash + parsedCard;

  const [payroll, setPayroll] = useState<EmployeePayroll[]>([]);

  useEffect(() => {
    employeeApi.getEmployees().then(data => {
      setPayroll(data.filter((e: any) => e.employmentStatus === 'active').map((e: any) => ({
        id: e.employeeId,
        name: `Staff ${e.employeeCode}`,
        role: e.jobRole,
        dailyRate: Number(e.dailyPay),
        isChecked: false
      })));
    }).catch(console.error);
  }, []);

  const togglePayroll = (id: number) => {
    setPayroll(prev => prev.map(emp => emp.id === id ? { ...emp, isChecked: !emp.isChecked } : emp));
  };
  const totalPayroll = payroll.filter(e => e.isChecked).reduce((sum, e) => sum + e.dailyRate, 0);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, name: 'Supplies / Packaging', amount: '' },
    { id: 2, name: 'Utilities (daily est.)', amount: '' },
    { id: 3, name: 'Ingredients / Restocking', amount: '' },
    { id: 4, name: 'Miscellaneous', amount: '' },
  ]);

  const updateExpense = (id: number, amount: string) => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, amount } : exp));
  };
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const netProfit = totalRevenue - totalPayroll - totalExpenses;
  const restockingAllotment = netProfit > 0 ? netProfit * 0.5 : 0;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await salesApi.createSalesEntryTransaction({
        cashSales: String(parsedCash),
        onlineCardSales: String(parsedCard),
        physicalCashCount: physicalCash ? String(physicalCash) : null,
        userId: null,
        payrollEntries: payroll.filter(p => p.isChecked).map(p => ({
          employeeId: p.id,
          grossPay: String(p.dailyRate)
        })),
        expenses: expenses.filter(exp => exp.amount).map(exp => ({
          description: exp.name,
          amount: exp.amount,
          userId: null,
          expenseCategory: exp.name.includes('Supplies') ? 'supplies' : 'miscellaneous'
        }))
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setStep(1);
        setCashSales(''); setCardSales(''); setPhysicalCash('');
        setPayroll(prev => prev.map(p => ({ ...p, isChecked: false })));
        setExpenses(prev => prev.map(exp => ({ ...exp, amount: '' })));
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit sales entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto pb-20">
      
      <div className="flex items-center justify-center mb-12">
        {(['Revenue', 'Payroll', 'Expenses', 'Summary'] as const).map((label, idx) => {
          const stepNum = (idx + 1) as Step;
          const isCompleted = step > stepNum;
          const isActive = step === stepNum;
          
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center relative">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors z-10
                    ${isCompleted ? 'bg-[#4a6741] text-white' : isActive ? 'bg-[#5c7155] text-white ring-4 ring-[#5c7155]/20' : 'bg-white border-2 border-gray-200 text-gray-400'}`}
                >
                  {isCompleted ? <Check size={18} /> : stepNum}
                </div>
                <span className={`absolute top-12 text-[11px] font-medium ${isActive || isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {stepNum !== 4 && (
                <div className={`w-16 sm:w-24 h-0.5 mx-2 ${isCompleted ? 'bg-[#4a6741]' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep((s) => (s + 1) as Step); }} className="bg-white rounded-[24px] border border-[#e8dccb] p-8 sm:p-10 shadow-sm relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="min-h-[300px]"
          >
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold font-poppins text-gray-900">Step 1 — Revenue</h2>
                  <p className="text-gray-500 text-sm mt-1">Enter today's total cash and online/card sales.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Cash Sales</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">₱</span>
                      <input type="number" step="0.01" min="0" value={cashSales} onChange={e => setCashSales(e.target.value ? parseFloat(e.target.value) : '')} placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3.5 bg-white border border-[#e8dccb] rounded-xl focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all placeholder-gray-400 text-gray-900" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Online / Card Sales</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">₱</span>
                      <input type="number" step="0.01" min="0" value={cardSales} onChange={e => setCardSales(e.target.value ? parseFloat(e.target.value) : '')} placeholder="0.00"
                        className="w-full pl-9 pr-4 py-3.5 bg-white border border-[#e8dccb] rounded-xl focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all placeholder-gray-400 text-gray-900" />
                    </div>
                  </div>
                </div>

                <div className="bg-[#f9f7f4] rounded-xl p-6 border border-[#e8dccb]/60">
                  <label className="block text-sm font-semibold text-gray-800 mb-1">Physical Cash Count <span className="font-normal text-gray-500">(optional — count the bills in the drawer)</span></label>
                  <div className="relative mt-3">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">₱</span>
                    <input type="number" step="0.01" min="0" value={physicalCash} onChange={e => setPhysicalCash(e.target.value ? parseFloat(e.target.value) : '')} placeholder="Count the cash drawer..."
                      className="w-full pl-9 pr-4 py-3 bg-white border border-[#e8dccb] rounded-xl focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all text-sm placeholder-gray-400 text-gray-900" />
                  </div>
                </div>

                <div className="bg-[#f1f7ef] rounded-xl p-5 border border-[#d3e3cd] flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-[#4a6741]">Total Revenue Today</span>
                  <span className="text-2xl font-extrabold text-[#2a3c24]">₱{totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-poppins text-gray-900">Step 2 — Payroll</h2>
                  <p className="text-gray-500 text-sm mt-1">Check the box if the staff member had a shift today.</p>
                </div>

                <div className="space-y-3">
                  {payroll.map(emp => (
                    <label key={emp.id} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all
                      ${emp.isChecked ? 'bg-[#fcfaf8] border-[#e8dccb] shadow-sm' : 'bg-white border-gray-100 hover:border-[#e8dccb]'}`}>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{emp.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{emp.role} • ₱{emp.dailyRate}/day</p>
                      </div>
                      <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-colors
                        ${emp.isChecked ? 'bg-[#4a6741] border-[#4a6741]' : 'border-gray-300 bg-gray-50'}`}>
                        {emp.isChecked && <Check size={16} className="text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={emp.isChecked} onChange={() => togglePayroll(emp.id)} />
                    </label>
                  ))}
                </div>

                <div className="bg-[#fef9f2] rounded-xl p-5 border border-[#f5e3cd] flex justify-between items-center mt-8">
                  <span className="text-sm font-medium text-[#b0783a]">Total Payroll</span>
                  <span className="text-2xl font-extrabold text-[#8a5b28]">₱{totalPayroll.toFixed(2)}</span>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-poppins text-gray-900">Step 3 — Expenses</h2>
                  <p className="text-gray-500 text-sm mt-1">Enter other operational expenses for today.</p>
                </div>

                <div className="space-y-3">
                  {expenses.map(exp => (
                    <div key={exp.id} className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-[#e8dccb]">
                      <span className="text-sm font-semibold text-gray-800">{exp.name}</span>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none text-sm">₱</span>
                        <input type="number" step="0.01" min="0" value={exp.amount} onChange={e => updateExpense(exp.id, e.target.value)} placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-[#fcfaf8] border border-gray-200 rounded-lg focus:bg-white focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all text-sm font-medium placeholder-gray-500 text-gray-900" />
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" className="w-full py-4 border border-dashed border-[#d2c2ad] text-[#8e7a63] rounded-xl text-sm font-medium hover:bg-[#fcfaf8] transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} /> Add Custom Expense
                  </button>
                </div>

                <div className="bg-[#fef9f2] rounded-xl p-5 border border-[#f5e3cd] flex justify-between items-center mt-8">
                  <span className="text-sm font-medium text-[#b0783a]">Total Expenses</span>
                  <span className="text-2xl font-extrabold text-[#8a5b28]">₱{totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold font-poppins text-gray-900">Step 4 — Summary</h2>
                  <p className="text-gray-500 text-sm mt-1">Review your daily entry before saving.</p>
                </div>

                <div className="bg-white rounded-2xl border border-[#e8dccb] divide-y divide-[#e8dccb]/60">
                  <div className="p-5 flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium">Total Revenue</span>
                    <span className="text-sm font-bold text-[#4a6741]">+ ₱{totalRevenue.toFixed(2)}</span>
                  </div>
                  <div className="p-5 flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium">Payroll</span>
                    <span className="text-sm font-bold text-[#b0783a]">- ₱{totalPayroll.toFixed(2)}</span>
                  </div>
                  <div className="p-5 flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-medium">Other Expenses</span>
                    <span className="text-sm font-bold text-[#b0783a]">- ₱{totalExpenses.toFixed(2)}</span>
                  </div>
                </div>

                <div className={`rounded-xl p-5 border flex justify-between items-center mt-2
                  ${netProfit >= 0 ? 'bg-[#f1f7ef] border-[#d3e3cd]' : 'bg-red-50 border-red-200'}`}>
                  <span className={`text-sm font-medium ${netProfit >= 0 ? 'text-[#4a6741]' : 'text-red-700'}`}>Net Profit Today</span>
                  <span className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-[#2a3c24]' : 'text-red-800'}`}>
                    {netProfit < 0 && '-'}₱{Math.abs(netProfit).toFixed(2)}
                  </span>
                </div>

                <div className="bg-[#fef9f2] rounded-xl p-5 border border-[#f5e3cd] flex justify-between items-center mt-4">
                  <div>
                    <p className="text-sm font-semibold text-[#b0783a]">Allotted for Restocking</p>
                    <p className="text-[11px] text-[#b0783a]/70 mt-0.5">50% of net profit • auto-reserved</p>
                  </div>
                  <span className="text-xl font-bold text-[#8a5b28]">₱{restockingAllotment.toFixed(2)}</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 pt-6 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 px-3 py-2 -ml-3"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div />}

          <span className="text-[11px] font-medium text-gray-400 absolute left-1/2 -translate-x-1/2 bottom-10">
            Step {step} of 4
          </span>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting || isSuccess || (step === 1 && !cashSales && !cardSales)}
            className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center justify-center transition-all
              ${isSuccess 
                ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                : 'bg-[#4a6741] hover:bg-[#3d5535] text-white shadow-sm shadow-[#4a6741]/20'}
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSuccess ? (
              <>
                <Check size={18} className="mr-2" />
                Saved!
              </>
            ) : step === 4 ? (
              'Save Today\'s Entry'
            ) : (
              <>
                Continue <ChevronRight size={16} className="ml-1" />
              </>
            )}
          </motion.button>
        </div>

      </form>
    </div>
  );
}
