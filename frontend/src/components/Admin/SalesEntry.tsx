import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { salesApi } from '../../api/salesApi';
import { employeeApi } from '../../api/employeeApi';
import type { EmployeeProfile, EmployeePayroll, ExpenseFormItem } from 'shared/models';
import { EMPLOYMENT_STATUS, EXPENSE_CATEGORIES, type ExpenseCategory } from 'shared/constants';

type Step = 1 | 2 | 3 | 4;

const expenseCategoryOptions = Object.values(EXPENSE_CATEGORIES);

function toTitleCaseFromEnum(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const defaultExpenseFormItems: ExpenseFormItem[] = [
    {
      formItemId: 1,
      expenseCategory: EXPENSE_CATEGORIES.UTILITIES,
      amount: '',
      description: null,
      isCustom: false
    },
    {
      formItemId: 2,
      expenseCategory: EXPENSE_CATEGORIES.MISCELLANEOUS,
      amount: '',
      description: null,
      isCustom: false
    }
  ];

export function SalesEntry() {
  const [step, setStep] = useState<Step>(1);

  const [cashSales, setCashSales] = useState<number | ''>('');
  const [cardSales, setCardSales] = useState<number | ''>('');
  const parsedCash = cashSales || 0;
  const parsedCard = cardSales || 0;
  const totalRevenue = parsedCash + parsedCard;

  const [payroll, setPayroll] = useState<EmployeePayroll[]>([]);

  useEffect(() => {
    employeeApi.getEmployeeProfiles().then(data => {
      setPayroll(data.filter((e: EmployeeProfile) => e.employmentStatus === EMPLOYMENT_STATUS.ACTIVE).map((e: EmployeeProfile) => ({
        id: e.employeeId,
        name: e.fullName,
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
  const [expenses, setExpenses] = useState<ExpenseFormItem[]>(defaultExpenseFormItems);

  const [isCustomExpenseModalOpen, setIsCustomExpenseModalOpen] = useState(false);
  const [customExpenseCategory, setCustomExpenseCategory] = useState<ExpenseCategory>(
    EXPENSE_CATEGORIES.MISCELLANEOUS
  );
  const [customExpenseDescription, setCustomExpenseDescription] = useState('');
  const [customExpenseAmount, setCustomExpenseAmount] = useState('');

  const updateExpense = (formItemId: number, amount: string) => {
    setExpenses(prev =>
      prev.map(exp =>
        exp.formItemId === formItemId ? { ...exp, amount } : exp
      )
    );
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
        physicalCashCount: null,
        userId: null,
        payrollEntries: payroll.filter(p => p.isChecked).map(p => ({
          employeeId: p.id,
          grossPay: String(p.dailyRate),
        })),
        expenses: expenses
          .filter(exp => exp.amount)
          .map(exp => ({
            description: exp.description,
            amount: Number(exp.amount).toFixed(2),
            expenseCategory: exp.expenseCategory
          }))
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setStep(1);
        setCashSales(''); setCardSales('');
        setPayroll(prev => prev.map(p => ({ ...p, isChecked: false })));
        setExpenses(defaultExpenseFormItems);
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
      
      {/* Desktop Progress Indicator */}
      <div className="hidden sm:flex items-center justify-center mb-10 overflow-x-auto hide-scrollbar py-2 w-full px-4">
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

      {/* Mobile Progress Indicator */}
      <div className="sm:hidden mb-8 px-2 overflow-x-auto hide-scrollbar">
        <div className="flex gap-2">
          {(['Revenue', 'Payroll', 'Expenses', 'Summary'] as const).map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isCurrent = step === stepNum;
            const textColor = (isCompleted || isCurrent) ? 'text-[#4a6741]' : 'text-gray-300';
            const barColor = (isCompleted || isCurrent) ? 'bg-[#4a6741]' : 'bg-gray-200';

            return (
              <div key={label} className="flex-1 min-w-[70px] flex flex-col items-center gap-2">
                <span className={`text-[11px] font-bold tracking-wide whitespace-nowrap transition-colors ${textColor}`}>
                  {label}
                </span>
                <div className={`h-1.5 w-full rounded-full transition-colors duration-300 ${barColor}`} />
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); setStep((s) => (s + 1) as Step); }} className="bg-transparent sm:bg-white rounded-none sm:rounded-[24px] border-none sm:border sm:border-[#e8dccb] p-2 sm:p-10 shadow-none sm:shadow-sm relative overflow-hidden pb-24 sm:pb-10">
        
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
                    <div
                      key={exp.formItemId}
                      className="flex items-center justify-between gap-4 p-3.5 bg-white rounded-xl border border-[#e8dccb]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {toTitleCaseFromEnum(exp.expenseCategory)}
                          </span>

                          {exp.isCustom && (
                            <span className="text-[10px] font-bold text-[#8e7a63] bg-[#fef9f2] border border-[#f5e3cd] px-2 py-0.5 rounded-md">
                              Custom
                            </span>
                          )}
                        </div>

                        {exp.description && (
                          <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            {exp.description}
                          </p>
                        )}
                      </div>

                      <div className="relative w-32 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none text-sm">
                          ₱
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={exp.amount}
                          onChange={e => updateExpense(exp.formItemId, e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-[#fcfaf8] border border-gray-200 rounded-lg focus:bg-white focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all text-sm font-medium placeholder-gray-500 text-gray-900"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <button type="button" onClick={() => setIsCustomExpenseModalOpen(true)} className="w-full py-4 border border-dashed border-[#d2c2ad] text-[#8e7a63] rounded-xl text-sm font-medium hover:bg-[#fcfaf8] transition-colors flex items-center justify-center gap-2">
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

        {/* Desktop Actions */}
        <div className="hidden sm:flex mt-12 pt-6 items-center justify-between">
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

        {/* Mobile Fixed Bottom Actions */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-20 flex items-center justify-between pb-safe">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 py-3 pr-4"
            >
              <ChevronLeft size={16} /> Back
            </button>
          ) : <div />}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting || isSuccess || (step === 1 && !cashSales && !cardSales)}
            className={`px-6 py-4 rounded-xl font-semibold text-sm flex items-center justify-center transition-all flex-1 ml-auto max-w-[200px]
              ${isSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-[#4a6741] hover:bg-[#3d5535] text-white'}
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
              'Save Entry'
            ) : (
              <>
                Continue <ChevronRight size={16} className="ml-1" />
              </>
            )}
          </motion.button>
        </div>

      </form>

      {/* Custom Expense Modal */}
      {isCustomExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 font-poppins">Add Custom Expense</h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Expense Category
                </label>

                <select
                  title="Expense Category"
                  value={customExpenseCategory}
                  onChange={e => setCustomExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-4 py-3 bg-[#fcfaf8] border border-[#e8dccb] rounded-xl focus:bg-white focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all text-gray-900"
                >
                  {expenseCategoryOptions.map(category => (
                    <option key={category} value={category}>
                      {toTitleCaseFromEnum(category)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Description
                </label>

                <textarea
                  value={customExpenseDescription}
                  onChange={e => setCustomExpenseDescription(e.target.value)}
                  placeholder="Optional details, e.g. supply pickup fare, extra mop, boosted post..."
                  rows={3}
                  maxLength={255}
                  className="w-full px-4 py-3 bg-[#fcfaf8] border border-[#e8dccb] rounded-xl focus:bg-white focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all placeholder-gray-400 text-gray-900 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customExpenseAmount}
                    onChange={e => setCustomExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-3 bg-[#fcfaf8] border border-[#e8dccb] rounded-xl focus:bg-white focus:border-[#4a6741] focus:ring-1 focus:ring-[#4a6741] outline-none transition-all placeholder-gray-400 text-gray-900"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsCustomExpenseModalOpen(false);
                  setCustomExpenseCategory(EXPENSE_CATEGORIES.MISCELLANEOUS);
                  setCustomExpenseDescription('');
                  setCustomExpenseAmount('');
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!customExpenseAmount}
                onClick={() => {
                  setExpenses(prev => [
                    ...prev,
                    {
                      formItemId: Date.now(),
                      expenseCategory: customExpenseCategory,
                      amount: customExpenseAmount,
                      description: customExpenseDescription.trim() || null,
                      isCustom: true
                    }
                  ]);

                  setIsCustomExpenseModalOpen(false);
                  setCustomExpenseCategory(EXPENSE_CATEGORIES.MISCELLANEOUS);
                  setCustomExpenseDescription('');
                  setCustomExpenseAmount('');
                }}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#4a6741] hover:bg-[#3d5535] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Expense
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
