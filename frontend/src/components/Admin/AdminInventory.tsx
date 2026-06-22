import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, MagnifyingGlass as Search, PencilSimple as Edit2, Trash as Trash2, 
  CaretLeft as ChevronLeft, CaretRight as ChevronRight, Calculator, X, 
  Warning as AlertTriangle, Package, Spinner as Loader2, CheckCircle as CheckCircle2, 
  Tote as ShoppingBag, Check 
} from '@phosphor-icons/react';
import { inventoryApi, type InventoryItem, type PurchasePlan } from '../../api/inventoryApi';

type FilterTab = 'All' | 'Low Stock' | 'Out of Stock' | 'Saved Plans';

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
  const allottedBudget = "₱3,155"; 

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (activeTab === 'Low Stock') {
        return item.stockQuantity > 0 && item.stockQuantity <= item.reorderAt;
      }
      if (activeTab === 'Out of Stock') {
        return item.stockQuantity === 0;
      }
      return true; 
    });
  }, [items, activeTab, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const itemsNeedingRestock = useMemo(() => {
    return items.filter(item => item.stockQuantity <= item.reorderAt);
  }, [items]);

  useEffect(() => {
    if (showCalculator && itemsNeedingRestock.length > 0) {
      if (autoSuggestEnabled) {
        const initialQuantities: Record<number, number> = {};
        itemsNeedingRestock.forEach(item => {
          const targetStock = item.reorderAt * 2;
          const toBuy = targetStock - item.stockQuantity;
          initialQuantities[item.itemId] = toBuy > 0 ? toBuy : 1;
        });
        setRestockQuantities(initialQuantities);
      } else {
        const zeroQuantities: Record<number, number> = {};
        itemsNeedingRestock.forEach(item => {
          zeroQuantities[item.itemId] = 0;
        });
        setRestockQuantities(zeroQuantities);
      }
    }
  }, [showCalculator, itemsNeedingRestock, autoSuggestEnabled]);

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
          <h2 className="text-3xl font-bold text-base-content mb-1">Inventory</h2>
          <p className="text-base-content/60 font-medium text-sm">Manage stock levels and plan purchases</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowCalculator(true)}
            className="btn btn-outline btn-primary"
          >
            <Calculator weight="duotone" size={20} />
            Purchase Calculator
          </button>
          <button className="btn btn-primary shadow-md">
            <Plus weight="bold" size={20} />
            Add Item
          </button>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <div className="card bg-success/10 border border-success/20 shadow-sm">
          <div className="card-body p-5">
            <p className="text-4xl font-black text-success mb-1">{totalItems}</p>
            <p className="text-sm font-bold text-base-content">Total Items</p>
            <p className="text-xs text-base-content/60 mt-0.5">in inventory</p>
          </div>
        </div>
        
        <div className="card bg-warning/10 border border-warning/20 shadow-sm">
          <div className="card-body p-5">
            <p className="text-4xl font-black text-warning mb-1">{lowStockCount}</p>
            <p className="text-sm font-bold text-base-content">Low Stock</p>
            <p className="text-xs text-base-content/60 mt-0.5">need attention</p>
          </div>
        </div>

        <div className="card bg-error/10 border border-error/20 shadow-sm">
          <div className="card-body p-5">
            <p className="text-4xl font-black text-error mb-1">{outOfStockCount}</p>
            <p className="text-sm font-bold text-base-content">Out of Stock</p>
            <p className="text-xs text-base-content/60 mt-0.5">urgent restock</p>
          </div>
        </div>

        <div className="card bg-info/10 border border-info/20 shadow-sm">
          <div className="card-body p-5">
            <p className="text-4xl font-black text-info mb-1">{allottedBudget}</p>
            <p className="text-sm font-bold text-base-content">Allotted Budget</p>
            <p className="text-xs text-base-content/60 mt-0.5">50% of net profit</p>
          </div>
        </div>
      </div>

      {/* ── Controls (Filters & Search) ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="tabs tabs-box bg-base-200/50 p-1 rounded-xl">
          {(['All', 'Low Stock', 'Out of Stock', 'Saved Plans'] as FilterTab[]).map(tab => {
            const isActive = activeTab === tab;
            let count = totalItems;
            if (tab === 'Low Stock') count = lowStockCount;
            if (tab === 'Out of Stock') count = outOfStockCount;
            if (tab === 'Saved Plans') count = purchasePlans.filter(p => p.status === 'pending').length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab tab-sm md:tab-md transition-all font-bold ${isActive ? 'tab-active shadow-sm bg-base-100 rounded-lg' : 'text-base-content/50'}`}
              >
                {tab} 
                <span className={`badge badge-sm ml-2 font-bold ${isActive ? 'badge-neutral' : 'badge-ghost opacity-50'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <label className="input input-bordered flex items-center gap-2 rounded-xl focus-within:outline-primary w-72 shadow-sm">
          <Search weight="bold" className="text-base-content/40" />
          <input 
            type="text" 
            className="grow" 
            placeholder="Search items..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      {/* ── Main Content Area ── */}
      {activeTab === 'Saved Plans' ? (
        <div className="flex-1 overflow-y-auto">
          {purchasePlans.length === 0 ? (
            <div className="card bg-base-100 border border-base-200 shadow-sm min-h-[300px] flex items-center justify-center">
              <ShoppingBag weight="duotone" size={64} className="text-base-300 mb-4" />
              <h3 className="text-xl font-bold text-base-content mb-2">No Purchase Plans Yet</h3>
              <p className="text-base-content/50 text-sm">Use the Purchase Calculator to plan your next restock.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {purchasePlans.map(plan => {
                const isReceived = plan.status === 'received';
                return (
                  <div key={plan.planId} className={`card bg-base-100 border transition-all ${isReceived ? 'border-base-200 opacity-60' : 'border-base-300 shadow-md'}`}>
                    <div className="card-body p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-1">
                            {new Date(plan.createdAt).toLocaleDateString()} at {new Date(plan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <h4 className="card-title text-xl">Plan #{plan.planId.toString().padStart(4, '0')}</h4>
                        </div>
                        <div className={`badge badge-lg font-bold gap-1.5 uppercase text-xs ${isReceived ? 'badge-ghost' : 'badge-warning'}`}>
                          {isReceived ? <Check weight="bold" /> : <Loader2 weight="bold" className="animate-spin" />}
                          {plan.status}
                        </div>
                      </div>
                      
                      <div className="bg-base-200/50 rounded-xl p-4 my-4 h-32 overflow-y-auto border border-base-200">
                        <table className="table table-xs">
                          <tbody>
                            {plan.items.map((item, idx) => (
                              <tr key={idx} className="border-base-200/50">
                                <td className="font-medium">{item.itemName}</td>
                                <td className="text-right text-base-content/60">x{item.quantity}</td>
                                <td className="text-right font-bold">₱{item.subtotal.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div>
                          <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider">Total Cost</p>
                          <p className="font-black text-2xl">₱{plan.totalCost.toLocaleString()}</p>
                        </div>
                        {!isReceived && (
                          <button 
                            onClick={() => handleReceivePlan(plan.planId)}
                            className="btn btn-primary shadow-sm"
                          >
                            Mark Restocked
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card bg-base-100 border border-base-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="table table-zebra table-pin-rows">
              <thead>
                <tr className="bg-base-200/50 text-base-content/60 font-bold uppercase tracking-widest text-xs">
                  <th className="py-5">Item</th>
                  <th className="py-5">Category</th>
                  <th className="py-5">Stock</th>
                  <th className="py-5">Reorder At</th>
                  <th className="py-5">Status</th>
                  <th className="py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedItems.map((item) => {
                    let status = 'OK';
                    let badgeClass = 'badge-success badge-outline';
                    
                    if (item.stockQuantity === 0) {
                      status = 'Out';
                      badgeClass = 'badge-error';
                    } else if (item.stockQuantity <= item.reorderAt) {
                      status = 'Low';
                      badgeClass = 'badge-warning';
                    }

                    return (
                      <motion.tr 
                        key={item.itemId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover"
                      >
                        <td className="font-bold text-base">{item.itemName}</td>
                        <td className="text-base-content/60 font-medium">{item.category}</td>
                        <td>
                          <span className="font-black text-lg">{item.stockQuantity}</span> <span className="text-base-content/50 text-xs font-bold">{item.unit}</span>
                        </td>
                        <td className="text-base-content/60 font-bold">
                          {item.reorderAt} <span className="font-normal">{item.unit}</span>
                        </td>
                        <td>
                          <div className={`badge badge-sm font-bold uppercase tracking-wider ${badgeClass}`}>
                            {status}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button className="btn btn-sm btn-success btn-outline gap-1">
                              <Plus weight="bold" /> Restock
                            </button>
                            <button className="btn btn-sm btn-ghost btn-square text-base-content/50 hover:text-base-content">
                              <Edit2 weight="duotone" size={18} />
                            </button>
                            <button className="btn btn-sm btn-ghost btn-square text-base-content/50 hover:text-error">
                              <Trash2 weight="duotone" size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
                
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-base-content/40 font-bold text-lg">
                      No items found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="bg-base-200/30 border-t border-base-200 p-4 flex items-center justify-between text-sm font-medium text-base-content/60">
            <p>
              Showing <strong className="text-base-content">{filteredItems.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</strong>–
              <strong className="text-base-content">{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</strong> of <strong className="text-base-content">{filteredItems.length}</strong> items
            </p>
            <div className="join shadow-sm border border-base-200">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || totalPages === 0}
                className="join-item btn btn-sm bg-base-100 hover:bg-base-200"
              >
                <ChevronLeft weight="bold" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`join-item btn btn-sm ${currentPage === pageNum ? 'btn-active btn-neutral' : 'bg-base-100 hover:bg-base-200'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="join-item btn btn-sm bg-base-100 hover:bg-base-200"
              >
                <ChevronRight weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Purchase Calculator Modal ── */}
      <AnimatePresence>
        {showCalculator && (
          <div className="modal modal-open modal-bottom sm:modal-middle backdrop-blur-sm bg-base-content/20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="modal-box p-0 max-w-5xl rounded-[24px] overflow-hidden flex max-h-[85vh] shadow-2xl"
            >
              {/* LEFT COLUMN: Items List */}
              <div className="flex-1 flex flex-col border-r border-base-200 bg-base-200/30">
                <div className="p-6 border-b border-base-200 flex items-center justify-between bg-base-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Calculator weight="duotone" size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-base-content">Purchase Calculator</h3>
                      <p className="text-sm text-base-content/60 font-medium">Plan your inventory restock</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-base-200/50 py-2 px-4 rounded-xl border border-base-200">
                    <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Auto-Suggest</span>
                    <input 
                      type="checkbox" 
                      className="toggle toggle-primary toggle-sm" 
                      checked={autoSuggestEnabled}
                      onChange={() => setAutoSuggestEnabled(!autoSuggestEnabled)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                {itemsNeedingRestock.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-base-content/40">
                    <Package weight="duotone" size={64} className="mb-4 opacity-50" />
                    <p className="text-xl font-bold text-base-content/70 mb-1">Inventory Looks Good!</p>
                    <p className="text-sm font-medium">No items are currently below their reorder threshold.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itemsNeedingRestock.map(item => {
                      const qty = restockQuantities[item.itemId] || 0;
                      const subtotal = qty * item.unitPrice;
                      const isOut = item.stockQuantity === 0;

                      return (
                        <div key={item.itemId} className="card bg-base-100 border border-base-200 shadow-sm flex-row items-center gap-5 p-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isOut ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                            <AlertTriangle weight="duotone" size={32} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-base-content">{item.itemName}</h4>
                            <p className="text-xs text-base-content/60 font-bold mt-1">
                              Stock: <span className="text-base-content">{item.stockQuantity}</span> • Reorder At: <span className="text-base-content">{item.reorderAt}</span> • <span className="text-base-content">₱{item.unitPrice}</span>/{item.unit}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-6">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider mb-2">Buy Qty</span>
                              <div className="join border border-base-200 shadow-sm">
                                <button 
                                  onClick={() => setRestockQuantities(prev => ({ ...prev, [item.itemId]: Math.max(0, (prev[item.itemId] || 0) - 1) }))}
                                  className="join-item btn btn-sm bg-base-100 px-3 hover:bg-base-200"
                                >-</button>
                                <input 
                                  type="number"
                                  value={qty}
                                  onChange={(e) => setRestockQuantities(prev => ({ ...prev, [item.itemId]: Number(e.target.value) }))}
                                  className="join-item w-14 text-center bg-base-100 text-sm font-black border-x border-base-200 outline-none"
                                />
                                <button 
                                  onClick={() => setRestockQuantities(prev => ({ ...prev, [item.itemId]: (prev[item.itemId] || 0) + 1 }))}
                                  className="join-item btn btn-sm bg-base-100 px-3 hover:bg-base-200"
                                >+</button>
                              </div>
                            </div>
                            
                            <div className="w-28 text-right bg-base-200/30 p-3 rounded-xl border border-base-200/50">
                              <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider block mb-1">Subtotal</span>
                              <span className="font-black text-lg text-base-content">₱{subtotal.toLocaleString()}</span>
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
              <div className="w-[340px] bg-base-100 p-8 shrink-0 flex flex-col relative border-l border-base-200">
                <button 
                  onClick={() => setShowCalculator(false)}
                  className="btn btn-sm btn-circle btn-ghost absolute top-6 right-6"
                >
                  <X weight="bold" />
                </button>
                
                {saveSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center mb-5">
                      <CheckCircle2 weight="duotone" size={48} />
                    </div>
                    <h3 className="font-black text-2xl mb-2 text-base-content">Plan Saved!</h3>
                    <p className="text-sm font-medium text-base-content/60">Your purchase plan has been successfully recorded.</p>
                  </div>
                ) : (
                  <>
                    <h3 className="font-black text-xl mb-8 flex items-center gap-2">
                      <ShoppingBag weight="duotone" className="text-primary" />
                      Summary
                    </h3>

                    <div className="flex-1 flex flex-col gap-5">
                      <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20 shadow-inner">
                        <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-2">Estimated Total</p>
                        <p className="text-5xl font-black text-primary mb-3">₱{calculatorTotalCost.toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-base-content/50 bg-base-100/50 px-3 py-1.5 rounded-lg w-fit">
                          <span>Vs Budget:</span>
                          <span className="text-base-content">{allottedBudget}</span>
                        </div>
                      </div>

                      <div className="card bg-base-100 border border-base-200 shadow-sm">
                        <div className="card-body p-5 gap-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-base-content/60 font-bold">Items to Restock</span>
                            <span className="text-sm font-black bg-base-200 px-2 py-0.5 rounded">{itemsNeedingRestock.length}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-base-content/60 font-bold">Total Quantity</span>
                            <span className="text-sm font-black bg-base-200 px-2 py-0.5 rounded">
                              {Object.values(restockQuantities).reduce((a, b) => a + b, 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-col gap-3">
                      <button 
                        onClick={handleSavePurchasePlan}
                        disabled={isSaving || calculatorTotalCost === 0}
                        className="btn btn-primary btn-lg shadow-md font-bold text-base w-full"
                      >
                        {isSaving ? (
                          <><Loader2 weight="bold" className="animate-spin" /> Saving Plan...</>
                        ) : (
                          <><Calculator weight="duotone" /> Save Purchase Plan</>
                        )}
                      </button>
                      <button 
                        onClick={() => setShowCalculator(false)}
                        disabled={isSaving}
                        className="btn btn-ghost btn-lg font-bold text-base-content/60 hover:text-base-content w-full"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
