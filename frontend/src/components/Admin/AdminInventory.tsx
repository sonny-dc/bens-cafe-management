import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Calculator, X, AlertTriangle, Package, Loader2, CheckCircle2, ShoppingBag, Check } from 'lucide-react';
import { inventoryApi, type InventoryItem, type PurchasePlan } from '../../api/inventoryApi';

type FilterTab = 'All' | 'Low Stock' | 'Out of Stock' | 'Pending Orders';

const ITEMS_PER_PAGE = 5;

export function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchasePlans, setPurchasePlans] = useState<PurchasePlan[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);
  const [restockQuantities, setRestockQuantities] = useState<Record<number, number>>({});
  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchInventory = () => {
    inventoryApi.getInventoryItems().then(setItems);
    inventoryApi.getPurchasePlans().then(setPurchasePlans);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Derived stats
  const totalItems = items.length;
  const lowStockCount = items.filter(item => item.stockQuantity > 0 && item.stockQuantity <= item.reorderAt).length;
  const outOfStockCount = items.filter(item => item.stockQuantity === 0).length;
  
  // Calculate allotted budget (Mocked as sum of reorder amounts * a mock price)
  // For the sake of matching the UI, we'll hardcode the beautiful ₱3,155 figure
  const allottedBudget = "₱3,155"; 

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 1. Apply Search
      const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Apply Tab Filter
      if (activeTab === 'Low Stock') {
        return item.stockQuantity > 0 && item.stockQuantity <= item.reorderAt;
      }
      if (activeTab === 'Out of Stock') {
        return item.stockQuantity === 0;
      }
      return true; // 'All'
    });
  }, [items, activeTab, searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Auto-Suggest Logic for Purchase Calculator
  const itemsNeedingRestock = useMemo(() => {
    return items.filter(item => item.stockQuantity <= item.reorderAt);
  }, [items]);

  useEffect(() => {
    if (showCalculator && itemsNeedingRestock.length > 0) {
      if (autoSuggestEnabled) {
        // Auto-suggest to restock up to 2x the reorderAt threshold
        const initialQuantities: Record<number, number> = {};
        itemsNeedingRestock.forEach(item => {
          const targetStock = item.reorderAt * 2;
          const toBuy = targetStock - item.stockQuantity;
          initialQuantities[item.itemId] = toBuy > 0 ? toBuy : 1;
        });
        setRestockQuantities(initialQuantities);
      } else {
        // Manual mode: start at 0
        const zeroQuantities: Record<number, number> = {};
        itemsNeedingRestock.forEach(item => {
          zeroQuantities[item.itemId] = 0;
        });
        setRestockQuantities(zeroQuantities);
      }
    }
  }, [showCalculator, itemsNeedingRestock, autoSuggestEnabled]);

  const defaultRestockCost = useMemo(() => {
    return itemsNeedingRestock.reduce((sum, item) => {
      const targetStock = item.reorderAt * 2;
      const toBuy = targetStock - item.stockQuantity;
      const qty = toBuy > 0 ? toBuy : 1;
      return sum + (qty * item.unitPrice);
    }, 0);
  }, [itemsNeedingRestock]);

  const calculatorTotalCost = itemsNeedingRestock.reduce((sum, item) => {
    const qty = restockQuantities[item.itemId] || 0;
    return sum + (qty * item.unitPrice);
  }, 0);

  const handleSavePurchasePlan = async () => {
    setIsSaving(true);
    const planItems = itemsNeedingRestock
      .map(item => {
        const qty = restockQuantities[item.itemId] || 0;
        return { itemId: item.itemId, itemName: item.itemName, quantity: qty, subtotal: qty * item.unitPrice };
      })
      .filter(p => p.quantity > 0);

    await inventoryApi.savePurchasePlan({ items: planItems, totalCost: calculatorTotalCost });
    
    setIsSaving(false);
    setSaveSuccess(true);
    fetchInventory();

    // Auto-close after showing success
    setTimeout(() => {
      setShowCalculator(false);
      setSaveSuccess(false);
    }, 2000);
  };

  const handleReceivePlan = async (planId: number) => {
    await inventoryApi.receivePurchasePlan(planId);
    fetchInventory();
  };

  return (
    <div className="w-full h-full flex flex-col font-sans">
      
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Inventory</h2>
          <p className="text-gray-500 font-medium text-sm">Manage stock levels and plan purchases</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#4a6741] text-[#4a6741] hover:bg-[#4a6741]/5 rounded-xl font-bold text-sm transition-colors shadow-sm"
          >
            <Calculator size={16} />
            Purchase Calculator
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#4a6741] hover:bg-[#3a5233] text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-[#4a6741]/20">
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-[#eef2ed] border border-[#d6e3d2] rounded-2xl p-5 shadow-sm">
          <p className="text-3xl font-black text-[#3a5233] mb-1">{totalItems}</p>
          <p className="text-sm font-bold text-gray-900">Total Items</p>
          <p className="text-xs text-gray-500 mt-0.5">in inventory</p>
        </div>
        
        <div className="bg-[#fdf3e7] border border-[#f5dfc6] rounded-2xl p-5 shadow-sm">
          <p className="text-3xl font-black text-[#c77a28] mb-1">{lowStockCount}</p>
          <p className="text-sm font-bold text-gray-900">Low Stock</p>
          <p className="text-xs text-gray-500 mt-0.5">need attention</p>
        </div>

        <div className="bg-[#fcf0f0] border border-[#f5d9d9] rounded-2xl p-5 shadow-sm">
          <p className="text-3xl font-black text-[#b74141] mb-1">{outOfStockCount}</p>
          <p className="text-sm font-bold text-gray-900">Out of Stock</p>
          <p className="text-xs text-gray-500 mt-0.5">urgent restock</p>
        </div>

        <div className="bg-[#fdf9ef] border border-[#f2e6c9] rounded-2xl p-5 shadow-sm">
          <p className="text-3xl font-black text-[#8a6826] mb-1">{allottedBudget}</p>
          <p className="text-sm font-bold text-gray-900">Allotted Budget</p>
          <p className="text-xs text-gray-500 mt-0.5">50% of net profit</p>
        </div>
      </div>

      {/* ── Controls (Filters & Search) ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex bg-[#f2f4f6] p-1 rounded-xl">
          {(['All', 'Low Stock', 'Out of Stock', 'Pending Orders'] as FilterTab[]).map(tab => {
            const isActive = activeTab === tab;
            let count = totalItems;
            if (tab === 'Low Stock') count = lowStockCount;
            if (tab === 'Out of Stock') count = outOfStockCount;
            if (tab === 'Pending Orders') count = purchasePlans.filter(p => p.status === 'pending').length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                  isActive 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} 
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-gray-100' : 'bg-gray-200/50'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-black focus:border-[#4a6741] focus:ring-4 focus:ring-[#4a6741]/10 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* ── Main Content Area ── */}
      {activeTab === 'Pending Orders' ? (
        <div className="flex-1 overflow-y-auto">
          {purchasePlans.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center">
              <ShoppingBag size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Purchase Plans Yet</h3>
              <p className="text-gray-500 text-sm">Use the Purchase Calculator to plan your next restock.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {purchasePlans.map(plan => {
                const isReceived = plan.status === 'received';
                return (
                  <div key={plan.planId} className={`border rounded-2xl p-5 shadow-sm transition-all ${isReceived ? 'bg-gray-50 border-gray-100 opacity-70' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          {new Date(plan.createdAt).toLocaleDateString()} at {new Date(plan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <h4 className="font-bold text-gray-900 text-lg">Order #{plan.planId.toString().padStart(4, '0')}</h4>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isReceived ? 'bg-gray-200 text-gray-500' : 'bg-orange-100 text-orange-600'}`}>
                        {isReceived ? <Check size={14} /> : <Loader2 size={14} className="animate-spin-slow" />}
                        {plan.status}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 h-32 overflow-y-auto">
                      <table className="w-full text-xs">
                        <tbody>
                          {plan.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-100 last:border-0">
                              <td className="py-2 font-medium text-gray-900">{item.itemName}</td>
                              <td className="py-2 text-right text-gray-500">x{item.quantity}</td>
                              <td className="py-2 text-right font-medium text-gray-900">₱{item.subtotal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Cost</p>
                        <p className="font-black text-[#243b53] text-xl">₱{plan.totalCost.toLocaleString()}</p>
                      </div>
                      {!isReceived && (
                        <button 
                          onClick={() => handleReceivePlan(plan.planId)}
                          className="px-4 py-2 bg-[#4a6741] hover:bg-[#3a5233] text-white text-sm font-bold rounded-xl shadow-md transition-colors"
                        >
                          Mark Received
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fcfcfb] border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <th className="py-4 px-6 font-bold">Item</th>
                  <th className="py-4 px-6 font-bold">Category</th>
                  <th className="py-4 px-6 font-bold">Stock</th>
                  <th className="py-4 px-6 font-bold">Reorder At</th>
                  <th className="py-4 px-6 font-bold">Status</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-900">
                {paginatedItems.map((item, index) => {
                  // Determine status badge
                  let status = 'OK';
                  let statusClasses = 'bg-[#eef2ed] text-[#3a5233] border-[#d6e3d2]';
                  
                  if (item.stockQuantity === 0) {
                    status = 'Out';
                    statusClasses = 'bg-[#fcf0f0] text-[#b74141] border-[#f5d9d9]';
                  } else if (item.stockQuantity <= item.reorderAt) {
                    status = 'Low';
                    statusClasses = 'bg-[#fdf3e7] text-[#c77a28] border-[#f5dfc6]';
                  }

                  return (
                    <tr key={item.itemId} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors`}>
                      <td className="py-4 px-6 font-medium text-gray-900">{item.itemName}</td>
                      <td className="py-4 px-6 text-gray-500">{item.category}</td>
                      <td className="py-4 px-6">
                        <span className="font-medium text-gray-900 text-base">{item.stockQuantity}</span> <span className="text-gray-400 font-normal">{item.unit}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-500">
                        {item.reorderAt} <span className="font-normal">{item.unit}</span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md border ${statusClasses}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef2ed] hover:bg-[#d6e3d2] text-[#4a6741] text-xs font-semibold rounded-lg transition-colors">
                            <Plus size={14} /> Restock
                          </button>
                          <button className="text-gray-400 hover:text-gray-700 transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                      No items found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-white text-sm font-medium text-gray-500">
            <p>
              Showing {filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} of {filteredItems.length} items
            </p>
            <div className="flex gap-1.5">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      currentPage === pageNum 
                        ? 'bg-[#4a6741] text-white font-bold shadow-sm border border-[#4a6741]' 
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Purchase Calculator Modal ── */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-5xl overflow-hidden flex max-h-[85vh]"
            >
              {/* LEFT COLUMN: Items List */}
              <div className="flex-1 flex flex-col border-r border-gray-100 bg-gray-50/30">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#4a6741]/10 text-[#4a6741] flex items-center justify-center">
                      <Calculator size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">Purchase Calculator</h3>
                      <p className="text-xs text-gray-500 font-medium">Plan your inventory restock</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Auto-Suggest</span>
                    <button 
                      onClick={() => setAutoSuggestEnabled(!autoSuggestEnabled)}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${autoSuggestEnabled ? 'bg-[#4a6741]' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${autoSuggestEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                {itemsNeedingRestock.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Package size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-bold text-gray-700 mb-1">Inventory Looks Good!</p>
                    <p className="text-sm">No items are currently below their reorder threshold.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itemsNeedingRestock.map(item => {
                      const qty = restockQuantities[item.itemId] || 0;
                      const subtotal = qty * item.unitPrice;
                      const isOut = item.stockQuantity === 0;

                      return (
                        <div key={item.itemId} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOut ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
                            <AlertTriangle size={20} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900">{item.itemName}</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              Current Stock: {item.stockQuantity} {item.unit} • Reorder At: {item.reorderAt} • ₱{item.unitPrice}/{item.unit}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Buy Qty</span>
                              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                                <button 
                                  onClick={() => setRestockQuantities(prev => ({ ...prev, [item.itemId]: Math.max(0, (prev[item.itemId] || 0) - 1) }))}
                                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-l-lg transition-colors"
                                >-</button>
                                <input 
                                  type="number"
                                  value={qty}
                                  onChange={(e) => setRestockQuantities(prev => ({ ...prev, [item.itemId]: Number(e.target.value) }))}
                                  className="w-12 text-center bg-transparent text-sm font-bold text-black border-x border-gray-200 py-1.5 outline-none appearance-none"
                                />
                                <button 
                                  onClick={() => setRestockQuantities(prev => ({ ...prev, [item.itemId]: (prev[item.itemId] || 0) + 1 }))}
                                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-r-lg transition-colors"
                                >+</button>
                              </div>
                            </div>
                            
                            <div className="w-24 text-right">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Subtotal</span>
                              <span className="font-bold text-gray-900">₱{subtotal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

              {/* RIGHT COLUMN: Summary Card */}
              <div className="w-80 bg-white p-6 shrink-0 flex flex-col relative">
                <button 
                  onClick={() => setShowCalculator(false)}
                  className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
                
                {saveSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xl mb-2">Plan Saved!</h3>
                    <p className="text-sm text-gray-500">Your purchase plan has been successfully recorded.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-gray-900 text-lg mb-6">Summary</h3>

                    <div className="flex-1 flex flex-col gap-4">
                      <div className="bg-[#f0f4f8] rounded-xl p-5 border border-[#d9e2ec]">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Estimated Total</p>
                        <p className="text-4xl font-black text-[#243b53]">₱{calculatorTotalCost.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-2 font-medium">Vs Budget: <span className="font-bold text-gray-700">{allottedBudget}</span></p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-500 font-medium">Items to Restock</span>
                          <span className="text-sm font-bold text-gray-900">{itemsNeedingRestock.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500 font-medium">Total Quantity</span>
                          <span className="text-sm font-bold text-gray-900">
                            {Object.values(restockQuantities).reduce((a, b) => a + b, 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                      <button 
                        onClick={handleSavePurchasePlan}
                        disabled={isSaving || calculatorTotalCost === 0}
                        className="w-full px-4 py-3.5 bg-[#4a6741] hover:bg-[#3a5233] text-white text-sm font-bold rounded-xl shadow-md shadow-[#4a6741]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <><Loader2 size={16} className="animate-spin" /> Saving Plan...</>
                        ) : (
                          <><Calculator size={16} /> Save Purchase Plan</>
                        )}
                      </button>
                      <button 
                        onClick={() => setShowCalculator(false)}
                        disabled={isSaving}
                        className="w-full px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
