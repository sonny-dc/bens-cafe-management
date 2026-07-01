import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Send, Package, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { inventoryRequestApi } from '../../api/inventoryRequestApi';
import { inventoryItemApi } from '../../api/inventoryItemApi';
import { REQUEST_STATUS } from 'shared/constants';
import type { StaffInventoryRequest, InventoryItemOption } from 'shared/models';
import { formatIsoDateTimeToTime } from '../../utils/datetime.utils';


export function InventoryManager() {
  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [requests, setRequests] = useState<StaffInventoryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous error before loading data
      const [fetchedItems, fetchedRequests] = await Promise.all([
        inventoryItemApi.getOptions(),
        inventoryRequestApi.getMyRequests()
      ]);
      setItems(fetchedItems);
      setRequests(fetchedRequests);
    } catch (err: any) {
      setError('Could not load inventory data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setError(null); // Clear any previous error when selecting an item
    setSelectedItemId(val === '' ? '' : Number(val));
    
    // Auto-fill unit based on item
    if (val !== '') {
      const selectedItem = items.find(i => i.itemId === Number(val));
      if (selectedItem) {
        setUnit(selectedItem.unit);
      }
    } else {
      setUnit('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItemId === '' || !quantity.trim() || !unit.trim() || !reason.trim()) return;
    
    try {
      setIsSending(true);
      setError(null);
      
      const newReq = await inventoryRequestApi.createRequest({
          itemId: selectedItemId,
          requestedQuantity: quantity,
          requestedUnit: unit,
          reason
        });
      
      const selectedItem = items.find(item => item.itemId === selectedItemId);

      const newReqWithItemName: StaffInventoryRequest = {
        ...newReq,
        itemName: selectedItem?.itemName || `Item #${newReq.itemId ?? 'N/A'}`
      };

      setRequests(prev => [newReqWithItemName, ...prev]);


      
      // Reset form
      setSelectedItemId('');
      setQuantity('');
      setUnit('');
      setReason('');
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
      {/* ── Left: Request Form ── */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6">
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">New Request</p>
          <h2 className="text-2xl font-bold font-poppins text-gray-900">Request Supplies</h2>
          <p className="text-sm text-gray-500 mt-1">Ask the admin to restock items that are running low.</p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-semibold text-red-700 mb-0.5">Inventory Request Error</p>
                <p className="text-red-600">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-sm text-emerald-700 font-semibold"
            >
              <CheckCircle2 size={16} />
              Request submitted! The admin will review it soon.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Item Selection */}
          <div>
            <label htmlFor="item" className="block text-sm font-semibold text-gray-700 mb-2">Item</label>
            <select
              id="item"
              title="Select an item"
              value={selectedItemId}
              onChange={handleItemSelect}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
            >
              <option value="" disabled>Select an item...</option>
              {items.map(item => (
                <option key={item.itemId} value={item.itemId}>
                  {item.itemName} ({item.stockQuantity} {item.unit} left)
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity Needed</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={
                  e => {
                    setQuantity(e.target.value);
                    setError(null);
                  }
                }
                placeholder="e.g. 2"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={e => {
                  setUnit(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. Cartons"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm text-black"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="e.g. We ran out during the morning rush..."
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all text-sm text-black placeholder:text-gray-400 resize-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSending || selectedItemId === '' || !quantity.trim() || !unit.trim() || !reason.trim()}
            className="flex items-center justify-center gap-2 w-full bg-[#4a6741] hover:bg-[#3d5836] disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
          >
            {isSending
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Send size={16} /> Submit Request</>
            }
          </motion.button>
        </form>
      </div>

      {/* ── Right: History ── */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package size={15} className="text-[#4a6741]" />
              Your Requests
            </p>
            {requests.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-500 font-medium px-2 py-0.5 rounded-full">{requests.length}</span>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading requests...</p>
            </div>
          )}

          {!isLoading && requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                <ShoppingCart size={20} className="text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-600">No requests yet</p>
              <p className="text-xs text-gray-400 mt-1 max-w-[160px]">Submit a request when you notice items running low.</p>
            </div>
          )}

          <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-0.5">
            <AnimatePresence>
              {requests.map(req => {
                const isPending = req.requestStatus === REQUEST_STATUS.PENDING;

                return (
                  <motion.div
                    key={req.requestId}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-gray-200 p-4 bg-white"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md
                          ${isPending ? 'bg-orange-100 text-orange-700' : 
                            'bg-emerald-100 text-emerald-700'}`}>
                          {req.requestStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock size={11} />
                        {formatIsoDateTimeToTime(String(req.postedAt))}
                      </div>
                    </div>
                    
                    <p className="text-sm font-bold text-gray-900 mb-0.5">
                      {req.itemName || `Item #${req.itemId ?? 'N/A'}`} <span className="text-gray-500 font-normal">x {req.requestedQuantity} {req.requestedUnit}</span>
                    </p>
                    <p className="text-xs text-gray-600 italic">"{req.reason}"</p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
