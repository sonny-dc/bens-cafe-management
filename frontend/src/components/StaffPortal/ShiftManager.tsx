import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, CheckCircle2, AlertCircle, Clock, TrendingUp } from 'lucide-react';
import { shiftApi, type Shift } from '../../api/shiftApi';
import { parseSQLDate } from '../../utils/datetime.utils';

export function ShiftManager() {

  const [shift, setShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEndingShift, setIsEndingShift] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');

  useEffect(() => { fetchActiveShift(); }, []);

  const fetchActiveShift = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setShift(await shiftApi.getMyActiveShift());
    } catch (err: any) {
      setError(err.message || 'Failed to load shift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingCash) return;
    try {
      setIsLoading(true);
      setError(null);
      setShift(await shiftApi.startShift(openingCash));
      setOpeningCash('');
    } catch (err: any) {
      setError(err.message || 'Failed to start shift');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndShiftFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift || !closingCash) return;
    // Show confirmation if there's a variance
    const variance = Number(closingCash) - Number(shift.openingCash);
    if (variance !== 0) {
      setShowConfirm(true);
      return;
    }
    void submitEndShift();
  };

  const submitEndShift = async () => {
    if (!shift || !closingCash) return;
    try {
      setIsLoading(true);
      setError(null);
      await shiftApi.endShift(shift.shiftId, closingCash);
      setShift(null);
      setIsEndingShift(false);
      setShowConfirm(false);
      setClosingCash('');
    } catch (err: any) {
      setError(err.message || 'Failed to end shift');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Loader ── */
  if (isLoading && !shift && !error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 h-56 flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading shift data…</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

      {/* ── Left card — action ── */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 overflow-hidden">

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-4 mb-5 text-sm text-red-600"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* State 1 — Start */}
          {!shift && !isEndingShift && (
            <motion.form
              key="start"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleStartShift}
              className="flex flex-col gap-6"
            >
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Ready to work?</p>
                <h2 className="text-2xl font-bold font-poppins text-gray-900">Start your shift</h2>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Opening Cash
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">₱</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingCash}
                    onChange={e => setOpeningCash(e.target.value)}
                    placeholder="0.00"
                    required
                    className="w-full pl-9 pr-4 py-3 text-base font-semibold border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all placeholder:font-normal placeholder:text-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Count the bills in the cash drawer first.</p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || !openingCash}
                className="flex items-center justify-center gap-2 w-full bg-[#4a6741] hover:bg-[#3d5836] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
              >
                {isLoading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Play size={16} fill="currentColor" /> Start Shift</>
                }
              </motion.button>
            </motion.form>
          )}

          {/* State 2 — In progress */}
          {shift && !isEndingShift && (
            <motion.div
              key="active"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">On duty</p>
                  <h2 className="text-2xl font-bold font-poppins text-gray-900">Shift in progress</h2>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500 flex items-center gap-2"><Clock size={14} /> Started</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {parseSQLDate(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-500">Opening cash</span>
                  <span className="text-sm font-bold text-gray-800">₱{Number(shift.openingCash).toFixed(2)}</span>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEndingShift(true)}
                className="flex items-center justify-center gap-2 w-full bg-orange-50 border border-orange-200 hover:bg-orange-100 text-orange-700 font-semibold py-3.5 rounded-xl transition-colors"
              >
                <Square size={16} fill="currentColor" /> End Shift
              </motion.button>
            </motion.div>
          )}

          {/* State 3 — End form */}
          {shift && isEndingShift && (() => {
            const variance = closingCash ? Number(closingCash) - Number(shift.openingCash) : null;
            const isShort = variance !== null && variance < 0;
            const isOver  = variance !== null && variance > 0;

            return (
              <motion.form
                key="end"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleEndShiftFormSubmit}
                className="flex flex-col gap-6"
              >
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Almost done</p>
                  <h2 className="text-2xl font-bold font-poppins text-gray-900">End your shift</h2>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Opening cash</span>
                  <span className="text-sm font-bold text-gray-800">₱{Number(shift.openingCash).toFixed(2)}</span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Closing Cash
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium select-none">₱</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={closingCash}
                      onChange={e => { setClosingCash(e.target.value); setShowConfirm(false); }}
                      placeholder="0.00"
                      required
                      className={`w-full pl-9 pr-4 py-3 text-base font-semibold border rounded-xl bg-gray-50 focus:bg-white outline-none transition-all placeholder:font-normal placeholder:text-gray-400
                        ${ isShort ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
                          : isOver  ? 'border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'
                          : 'border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20'}`}
                    />
                  </div>

                  {/* Live variance badge */}
                  <AnimatePresence>
                    {variance !== null && variance !== 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={`mt-3 flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium
                          ${ isShort
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                      >
                        <span>{isShort ? 'Short by' : 'Profit'}</span>
                        <span className="font-bold">₱{Math.abs(variance).toFixed(2)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirmation prompt */}
                <AnimatePresence>
                  {showConfirm && variance !== null && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className={`rounded-xl border p-4 text-sm
                        ${ isShort
                          ? 'bg-red-50 border-red-200'
                          : 'bg-emerald-50 border-emerald-200'}`}
                    >
                      <p className={`font-semibold mb-1 ${ isShort ? 'text-red-800' : 'text-emerald-800'}`}>
                        {isShort
                          ? `Cash is short by ₱${Math.abs(variance).toFixed(2)}.`
                          : `Awesome! Extra profit of ₱${Math.abs(variance).toFixed(2)}.`
                        }
                      </p>
                      <p className={`mb-4 ${ isShort ? 'text-red-600' : 'text-emerald-700'}`}>
                        Are you sure you want to submit this?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowConfirm(false)}
                          className="flex-none px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Go back
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => void submitEndShift()}
                          disabled={isLoading}
                          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
                        >
                          {isLoading
                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <><CheckCircle2 size={15} /> Yes, submit</>}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main actions */}
                {!showConfirm && (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setIsEndingShift(false); setClosingCash(''); setShowConfirm(false); }}
                      disabled={isLoading}
                      className="flex-none px-5 py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || !closingCash}
                      className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
                    >
                      {isLoading
                        ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><CheckCircle2 size={16} /> Confirm End Shift</>
                      }
                    </motion.button>
                  </div>
                )}
              </motion.form>
            );
          })()}

        </AnimatePresence>
      </div>

      {/* ── Right card — tips / info ── */}
      <div className="lg:col-span-2 flex flex-col gap-4">

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={15} className="text-[#4a6741]" />
            <span className="text-sm font-semibold text-gray-700">Cash Tip</span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Opening cash is your <span className="font-medium text-gray-700">change fund</span> — set aside for making change. It's usually between ₱500 and ₱2,000.
          </p>
        </div>

        {shift && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-emerald-800">Shift Active</span>
            </div>
            <p className="text-sm text-emerald-700 leading-relaxed">
              Your shift started at <span className="font-bold">{parseSQLDate(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>. Great work today!
            </p>
          </motion.div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Today</p>
          <p className="text-sm text-gray-500">{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

      </div>
    </div>
  );
}
