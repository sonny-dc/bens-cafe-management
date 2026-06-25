import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, X, CheckCircle2, Calculator, AlertTriangle } from 'lucide-react';
import { inventoryApi, type InventoryItem, type PurchasePlan, getAllottedBudget } from '../../api/inventoryApi';
import type { PurchasePlanItem } from 'shared/models';

type FilterTab = 'All' | 'Low Stock' | 'Out of Stock';

const ITEMS_PER_PAGE = 8;

export function AdminInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchasePlans, setPurchasePlans] = useState<PurchasePlan[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCalculator, setShowCalculator] = useState(false);
  
  const [restockQuantities, setRestockQuantities] = useState<Record<number, number>>(() => {
    try { const saved = localStorage.getItem('draftRestockQuantities'); return saved ? JSON.parse(saved) : {}; } catch { return {}; }
  });

  const [autoSuggestEnabled, setAutoSuggestEnabled] = useState(true);

  useEffect(() => {
    localStorage.setItem('draftRestockQuantities', JSON.stringify(restockQuantities));
  }, [restockQuantities]);

  const [calculatorSearchQuery, setCalculatorSearchQuery] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [overBudgetWarning, setOverBudgetWarning] = useState(false);
  const [fulfillingId, setFulfillingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // -- Quick Restock State --
  const [quickRestockItem, setQuickRestockItem] = useState<InventoryItem | null>(null);
  const [quickRestockQty, setQuickRestockQty] = useState<number>(1);
  const [isQuickRestocking, setIsQuickRestocking] = useState(false);

  const handleQuickRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockItem || quickRestockQty <= 0) return;
    setIsQuickRestocking(true);
    try {
      const cost = quickRestockItem.unitPrice * quickRestockQty;
      await inventoryApi.quickRestockItem(quickRestockItem.itemId, quickRestockQty, cost);
      setQuickRestockItem(null);
      fetchInventory();
    } catch (err) {
      console.error(err);
      alert("Failed to quick restock item via XML.");
    } finally {
      setIsQuickRestocking(false);
    }
  };

  // -- Item Modal State --
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemFormData, setItemFormData] = useState<Omit<InventoryItem, 'itemId'>>({
    itemName: '', category: 'Dairy', unit: 'qty', stockQuantity: 0, reorderAt: 5, unitPrice: 0
  });

  const fetchInventory = () => {
    inventoryApi.getInventoryItems().then(setItems);
    inventoryApi.getPurchasePlans().then(setPurchasePlans);
  };

  useEffect(() => { fetchInventory(); }, []);

  const openAddItemModal = () => {
    setEditingItem(null);
    setItemFormData({ itemName: '', category: 'Dairy', unit: 'qty', stockQuantity: 0, reorderAt: 5, unitPrice: 0 });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: InventoryItem) => {
    setEditingItem(item);
    setItemFormData({
      itemName: item.itemName, category: item.category, unit: item.unit,
      stockQuantity: item.stockQuantity, reorderAt: item.reorderAt, unitPrice: item.unitPrice
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await inventoryApi.updateItem(editingItem.itemId, itemFormData);
    } else {
      await inventoryApi.createItem(itemFormData);
    }
    setIsItemModalOpen(false);
    fetchInventory();
  };

  const handleDeleteItem = async (itemId: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await inventoryApi.deleteItem(itemId);
      fetchInventory();
    }
  };

  const totalItems = items.length;
  const lowStockCount = items.filter(i => i.stockQuantity > 0 && i.stockQuantity <= i.reorderAt).length;
  const outOfStockCount = items.filter(i => i.stockQuantity === 0).length;
  const pendingPlansCount = purchasePlans.filter(p => p.status === 'pending').length;

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch =
        item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeTab === 'Low Stock') return item.stockQuantity > 0 && item.stockQuantity <= item.reorderAt;
      if (activeTab === 'Out of Stock') return item.stockQuantity === 0;
      return true;
    });
  }, [items, activeTab, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filteredCalculatorItems = useMemo(() => {
    let result = items;
    if (calculatorSearchQuery) {
      result = result.filter(i => i.itemName.toLowerCase().includes(calculatorSearchQuery.toLowerCase()));
    }
    return result;
  }, [items, calculatorSearchQuery]);

  const groupedCalculatorItems = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    filteredCalculatorItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredCalculatorItems]);

  useEffect(() => {
    if (!showCalculator) return;
    const quantities: Record<number, number> = {};
    items.forEach(item => {
      if (item.stockQuantity <= item.reorderAt) {
        if (autoSuggestEnabled) {
          const toBuy = item.reorderAt * 2 - item.stockQuantity;
          quantities[item.itemId] = toBuy > 0 ? toBuy : 1;
        } else {
          quantities[item.itemId] = 0;
        }
      } else {
        quantities[item.itemId] = 0;
      }
    });
    setRestockQuantities(quantities);
  }, [showCalculator, autoSuggestEnabled, items]);

  const calculatorTotalCost = items.reduce((sum, item) => {
    return sum + (restockQuantities[item.itemId] || 0) * item.unitPrice;
  }, 0);

  const allottedBudget = getAllottedBudget();
  const remainingBudget = allottedBudget - calculatorTotalCost;
  const isOverBudget = calculatorTotalCost > allottedBudget;
  const budgetPct = Math.min((calculatorTotalCost / allottedBudget) * 100, 100);

  const handleSavePurchasePlan = async () => {
    setIsSaving(true);
    setOverBudgetWarning(false);
    
    // Only include items that have a quantity > 0
    const planItems = items
      .filter(item => (restockQuantities[item.itemId] || 0) > 0)
      .map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: restockQuantities[item.itemId],
        unitPrice: item.unitPrice,
        subtotal: restockQuantities[item.itemId] * item.unitPrice
      }));

    if (planItems.length === 0) {
      setIsSaving(false);
      return;
    }

    if (allottedBudget > 0 && calculatorTotalCost > allottedBudget) {
      setOverBudgetWarning(true);
      setIsSaving(false);
      return;
    }

    if (allottedBudget === 0) {
      // Just warn visually but allow saving since budget isn't hooked up
      setOverBudgetWarning(true);
    }

    const newPlanData = {
      totalCost: calculatorTotalCost,
      items: planItems
    };

    try {
      await inventoryApi.savePurchasePlan(newPlanData);
      setRestockQuantities({});
      setSaveSuccess(true);
      fetchInventory();
      setTimeout(() => { setSaveSuccess(false); setOverBudgetWarning(false); }, 3000);
    } catch (err) {
      console.error('Failed to save plan', err);
      alert('Failed to save purchase plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFulfillPlan = async (planId: number) => {
    setFulfillingId(planId);
    await inventoryApi.fulfillPurchasePlan(planId);
    fetchInventory();
    setFulfillingId(null);
  };

  const handleDeletePlan = async (planId: number) => {
    setDeletingId(planId);
    await inventoryApi.deletePurchasePlan(planId);
    fetchInventory();
    setDeletingId(null);
  };

  const tabs: { id: FilterTab; count: number }[] = [
    { id: 'All', count: totalItems },
    { id: 'Low Stock', count: lowStockCount },
    { id: 'Out of Stock', count: outOfStockCount },
  ];

  return (
    <div className="w-full flex flex-col gap-6 font-sans">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Inventory</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage stock levels and purchase plans</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCalculator(true)}
            className="relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            <Calculator size={15} />
            Purchase Calculator
            {pendingPlansCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold text-white bg-amber-500 rounded-full flex items-center justify-center">
                {pendingPlansCount}
              </span>
            )}
          </button>
          <button onClick={openAddItemModal} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#4a6741] rounded-xl hover:bg-[#3d5836] transition-all shadow-sm">
            <Plus size={15} strokeWidth={2.5} />
            Add Item
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems, sub: 'in inventory', color: 'text-gray-900' },
          { label: 'Low Stock', value: lowStockCount, sub: 'need attention', color: 'text-amber-600' },
          { label: 'Out of Stock', value: outOfStockCount, sub: 'urgent restock', color: 'text-red-500' },
          { label: 'Budget Allotted', value: `₱${allottedBudget.toLocaleString()}`, sub: '50% of net profit', color: 'text-[#4a6741]' },
        ].map(stat => (
          <div key={stat.label} className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</p>
            <p className="text-sm font-medium text-gray-700">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.id}
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${
                activeTab === tab.id ? 'bg-gray-100 text-gray-700' : 'text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/10 w-60 transition-all"
          />
        </div>
      </div>

      {/* ── Inventory Table ── */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Item</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Reorder At</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <AnimatePresence>
              {paginatedItems.map(item => {
                const isOut = item.stockQuantity === 0;
                const isLow = !isOut && item.stockQuantity <= item.reorderAt;
                return (
                  <motion.tr
                    key={item.itemId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 text-gray-500">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">{item.stockQuantity}</span>
                      <span className="text-gray-400 text-xs ml-1">qty</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {item.reorderAt} <span className="text-xs">qty</span>
                    </td>
                    <td className="px-6 py-4">
                      {isOut ? (
                        <span className="inline-flex items-center text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">Out of stock</span>
                      ) : isLow ? (
                        <span className="inline-flex items-center text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">Low stock</span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">In stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setQuickRestockItem(item); setQuickRestockQty(1); }} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#4a6741] bg-[#4a6741]/10 hover:bg-[#4a6741]/20 rounded-lg transition-colors">
                          <Plus size={12} strokeWidth={2.5} /> Restock
                        </button>
                        <button onClick={() => openEditItemModal(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 size={15} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.itemId)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-sm text-gray-400">
                  No items found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Showing <span className="text-gray-700 font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)}</span> of <span className="text-gray-700 font-medium">{filteredItems.length}</span>
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${currentPage === i + 1 ? 'bg-[#4a6741] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Purchase Calculator Modal ── */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setShowCalculator(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[88vh] flex overflow-hidden"
            >
              {/* ── LEFT: Item Checklist ── */}
              <div className="flex-1 flex flex-col border-r border-gray-100 min-w-0">
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col gap-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Purchase Calculator</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Plan your inventory restock within budget</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs text-gray-500 font-medium">Smart Stock (Auto-suggest)</span>
                      <div
                        onClick={() => setAutoSuggestEnabled(!autoSuggestEnabled)}
                        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${autoSuggestEnabled ? 'bg-[#4a6741]' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${autoSuggestEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search items..."
                        value={calculatorSearchQuery}
                        onChange={e => setCalculatorSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4a6741]/20 focus:border-[#4a6741] transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {Object.keys(groupedCalculatorItems).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <p className="text-sm font-semibold text-gray-700">No items found</p>
                    </div>
                  ) : (
                    Object.entries(groupedCalculatorItems).map(([category, catItems]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">{category}</h4>
                        <div className="space-y-2">
                          {catItems.map(item => {
                            const qty = restockQuantities[item.itemId] || 0;
                            const subtotal = qty * item.unitPrice;
                            const isOut = item.stockQuantity === 0;
                            const isLow = item.stockQuantity <= item.reorderAt;
                            return (
                              <div key={item.itemId} className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${qty > 0 ? 'border-[#4a6741]/30 bg-[#4a6741]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-gray-300'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Stock: {item.stockQuantity} qty · Reorder at: {item.reorderAt} qty · ₱{item.unitPrice}/qty
                                  </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <button onClick={() => setRestockQuantities(p => ({ ...p, [item.itemId]: Math.max(0, (p[item.itemId] || 0) - 1) }))} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium transition-colors">−</button>
                                    <input 
                                      type="number" 
                                      value={qty} 
                                      onChange={e => {
                                        let val = parseInt(e.target.value) || 0;
                                        if (val > 1000) val = 1000;
                                        setRestockQuantities(p => ({ ...p, [item.itemId]: Math.max(0, val) }));
                                      }} 
                                      className="w-12 text-center text-sm font-semibold bg-transparent outline-none text-gray-900" 
                                    />
                                    <button onClick={() => setRestockQuantities(p => ({ ...p, [item.itemId]: (p[item.itemId] || 0) + 1 }))} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 text-sm font-medium transition-colors">+</button>
                                  </div>
                                  <div className="text-right w-20">
                                    <p className="text-xs text-gray-400">Subtotal</p>
                                    <p className="text-sm font-semibold text-gray-900">₱{subtotal.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ── RIGHT: Summary + Plans ── */}
              <div className="w-[420px] flex flex-col shrink-0 border-l border-gray-100">

                {/* Summary */}
                <div className="px-7 py-6 border-b border-gray-100 shrink-0">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-semibold text-gray-900">Summary</h4>
                    <button onClick={() => setShowCalculator(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <X size={15} />
                    </button>
                  </div>

                  {saveSuccess ? (
                    <div className="py-4">
                      <div className={`flex items-start gap-3 rounded-xl p-3.5 mb-4 ${overBudgetWarning ? 'bg-red-50 border border-red-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                        {overBudgetWarning
                          ? <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                          : <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                        }
                        <div>
                          <p className={`text-xs font-semibold ${overBudgetWarning ? 'text-red-700' : 'text-emerald-700'}`}>
                            {overBudgetWarning ? 'Plan saved — over budget!' : 'Plan saved!'}
                          </p>
                          <p className={`text-xs mt-0.5 ${overBudgetWarning ? 'text-red-600' : 'text-emerald-600'}`}>
                            {overBudgetWarning
                              ? `Exceeds budget by ₱${(calculatorTotalCost - allottedBudget).toLocaleString()}.`
                              : 'Your purchase plan was recorded below.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5">
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-gray-400 font-medium">Budget used</span>
                          <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-gray-700'}`}>
                            ₱{calculatorTotalCost.toLocaleString()} / ₱{allottedBudget.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isOverBudget ? 'bg-red-400' : budgetPct > 80 ? 'bg-amber-400' : 'bg-[#4a6741]'}`}
                            style={{ width: `${budgetPct}%` }}
                          />
                        </div>
                        {isOverBudget ? (
                          <p className="text-xs text-red-500 font-medium mt-2 flex items-center gap-1">
                            <AlertTriangle size={11} /> Over budget by ₱{Math.abs(remainingBudget).toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-2">₱{remainingBudget.toLocaleString()} remaining</p>
                        )}
                      </div>

                      {/* Plan Total */}
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-5">
                        <p className="text-xs text-gray-400 mb-1.5">Plan Total</p>
                        <p className={`text-3xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                          ₱{calculatorTotalCost.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Items to restock</span>
                        <span className="font-medium text-gray-800">{filteredCalculatorItems.length}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-6">
                        <span className="text-gray-500">Total qty</span>
                        <span className="font-medium text-gray-800">
                          {Object.values(restockQuantities).reduce((a, b) => a + b, 0)}
                        </span>
                      </div>

                      <button
                        onClick={handleSavePurchasePlan}
                        disabled={isSaving || calculatorTotalCost === 0}
                        className={`w-full py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                          isOverBudget
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-[#4a6741] hover:bg-[#3d5836] text-white'
                        }`}
                      >
                        {isSaving
                          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : isOverBudget ? (
                            <><AlertTriangle size={14} /> Save Anyway</>
                          ) : 'Save Purchase Plan'
                        }
                      </button>
                      <button onClick={() => setShowCalculator(false)} className="w-full mt-2.5 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
                        Cancel
                      </button>
                    </>
                  )}
                </div>

                {/* ── Purchase Plan History ── */}
                <div className="flex-1 overflow-y-auto">
                  <div className="px-7 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Saved Plans</p>
                    {pendingPlansCount > 0 && (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {pendingPlansCount} pending
                      </span>
                    )}
                  </div>

                  {purchasePlans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center px-6">
                      <p className="text-xs text-gray-400 leading-relaxed">
                        No saved plans yet. Save a plan above — when fulfilled, it will auto-restock inventory and be removed from this list.
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 space-y-4">
                      {purchasePlans.map(plan => (
                        <div key={plan.planId} className="rounded-xl border border-gray-200 bg-white p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-xs font-semibold text-gray-700">Plan #{plan.planId.toString().padStart(4, '0')}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(plan.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              Pending
                            </span>
                          </div>

                          {/* Line items */}
                          <div className="space-y-1 mb-3">
                            {plan.items.map((item: PurchasePlanItem, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 truncate mr-2">{item.itemName}</span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-gray-400">×{item.quantity}</span>
                                  <span className="font-medium text-gray-700">₱{item.subtotal.toLocaleString()}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                            <div>
                              <span className="text-xs text-gray-400">Total </span>
                              <span className={`text-sm font-bold ${plan.totalCost > allottedBudget ? 'text-red-600' : 'text-gray-900'}`}>
                                ₱{plan.totalCost.toLocaleString()}
                                {plan.totalCost > allottedBudget && (
                                  <span className="ml-1 text-[10px] font-semibold text-red-500">over budget</span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDeletePlan(plan.planId)}
                                disabled={deletingId === plan.planId || fulfillingId === plan.planId}
                                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                                title="Delete plan"
                              >
                                {deletingId === plan.planId
                                  ? <span className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                                  : <Trash2 size={12} />
                                }
                              </button>
                              <button
                                onClick={() => handleFulfillPlan(plan.planId)}
                                disabled={fulfillingId === plan.planId || deletingId === plan.planId}
                                className="flex items-center gap-1 text-xs font-semibold text-[#4a6741] hover:text-[#3d5836] bg-[#4a6741]/10 hover:bg-[#4a6741]/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {fulfillingId === plan.planId
                                  ? <span className="w-3 h-3 border-2 border-[#4a6741]/30 border-t-[#4a6741] rounded-full animate-spin" />
                                  : <CheckCircle2 size={12} />
                                }
                                Mark as Done
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ── ADD / EDIT ITEM MODAL ── */}
      <AnimatePresence>
        {isItemModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans"
            onClick={() => setIsItemModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button
                  onClick={() => setIsItemModalOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveItem} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name</label>
                    <input
                      type="text" required
                      value={itemFormData.itemName}
                      onChange={e => setItemFormData({ ...itemFormData, itemName: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                      placeholder="e.g. Fresh Milk"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <input
                      type="text" required
                      value={itemFormData.category}
                      onChange={e => setItemFormData({ ...itemFormData, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                      placeholder="e.g. Dairy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit Price (₱)</label>
                    <input
                      type="number" min="0" step="0.01" required
                      value={itemFormData.unitPrice}
                      onChange={e => setItemFormData({ ...itemFormData, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unit Measure</label>
                    <input
                      type="text" required
                      value={itemFormData.unit}
                      onChange={e => setItemFormData({ ...itemFormData, unit: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                      placeholder="e.g. qty, kg, liters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reorder Threshold</label>
                    <input
                      type="number" min="0" required
                      value={itemFormData.reorderAt}
                      onChange={e => setItemFormData({ ...itemFormData, reorderAt: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Current Stock</label>
                    <input
                      type="number" min="0" required
                      value={itemFormData.stockQuantity}
                      onChange={e => setItemFormData({ ...itemFormData, stockQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsItemModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4a6741] hover:bg-[#3d5836] rounded-xl transition-colors"
                  >
                    {editingItem ? 'Save Changes' : 'Add Item'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── QUICK RESTOCK MODAL ── */}
      <AnimatePresence>
        {quickRestockItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans"
            onClick={() => setQuickRestockItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-lg">Quick Restock</h3>
                <button onClick={() => setQuickRestockItem(null)} className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleQuickRestockSubmit} className="p-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{quickRestockItem.itemName}</p>
                  <p className="text-xs text-gray-500">Unit Price: ₱{quickRestockItem.unitPrice}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantity to Order</label>
                  <input
                    type="number" min="1" required
                    value={quickRestockQty}
                    onChange={e => setQuickRestockQty(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Total Cost</span>
                    <span className="text-lg font-bold text-gray-900">₱{(quickRestockItem.unitPrice * quickRestockQty).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button type="button" onClick={() => setQuickRestockItem(null)} className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isQuickRestocking} className="px-5 py-2.5 text-sm font-semibold text-white bg-[#4a6741] hover:bg-[#3d5836] rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                    {isQuickRestocking && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Confirm Restock
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
