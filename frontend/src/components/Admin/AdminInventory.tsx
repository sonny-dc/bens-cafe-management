import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Calculator,
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus,
  Trash2, Search, ChevronLeft, ChevronRight, X, Calendar, Edit2
} from 'lucide-react';

// ─── Types ───
interface BudgetAuditLog {
  id: number;
  amount: number;
  type: 'IN' | 'OUT';
  description: string;
  createdAt: string;
}

interface RestockCartItem {
  itemId: number;
  itemName: string;
  unit: string;
  unitCost: number;
  quantity: number;
}

export type InventoryItem = {
  itemId: number;
  itemName: string;
  category: string;
  unit: string;
  stockQty: number;
  threshold: number;
  unitCost: number;
};

// ─── Mock data ───
const MOCK_ITEMS: InventoryItem[] = [
  // Beverage Ingredients
  { itemId: 1, itemName: 'Coffee Beans (Arabica)', category: 'Beverage Ingredients', unit: 'kg', stockQty: 12, threshold: 15, unitCost: 850 },
  { itemId: 2, itemName: 'Whole Milk', category: 'Beverage Ingredients', unit: 'L', stockQty: 45, threshold: 20, unitCost: 95 },
  { itemId: 3, itemName: 'Oat Milk', category: 'Beverage Ingredients', unit: 'L', stockQty: 3, threshold: 10, unitCost: 180 },
  { itemId: 4, itemName: 'Vanilla Syrup', category: 'Beverage Ingredients', unit: 'bottle', stockQty: 8, threshold: 10, unitCost: 450 },
  { itemId: 5, itemName: 'Caramel Sauce', category: 'Beverage Ingredients', unit: 'bottle', stockQty: 6, threshold: 8, unitCost: 380 },
  { itemId: 6, itemName: 'Matcha Powder', category: 'Beverage Ingredients', unit: 'kg', stockQty: 2, threshold: 3, unitCost: 1200 },
  { itemId: 7, itemName: 'Chocolate Powder', category: 'Beverage Ingredients', unit: 'kg', stockQty: 4, threshold: 5, unitCost: 320 },
  // Food Ingredients
  { itemId: 8, itemName: 'Rice', category: 'Food Ingredients', unit: 'kg', stockQty: 25, threshold: 10, unitCost: 55 },
  { itemId: 9, itemName: 'All-Purpose Flour', category: 'Food Ingredients', unit: 'kg', stockQty: 0, threshold: 5, unitCost: 65 },
  { itemId: 10, itemName: 'Eggs', category: 'Food Ingredients', unit: 'tray', stockQty: 3, threshold: 5, unitCost: 240 },
  { itemId: 11, itemName: 'Brown Sugar', category: 'Food Ingredients', unit: 'kg', stockQty: 0, threshold: 5, unitCost: 120 },
  // Packaging
  { itemId: 12, itemName: 'Paper Cups (12oz)', category: 'Packaging', unit: 'pcs', stockQty: 50, threshold: 500, unitCost: 2.5 },
  { itemId: 13, itemName: 'Plastic Lids', category: 'Packaging', unit: 'pcs', stockQty: 200, threshold: 300, unitCost: 1.8 },
  { itemId: 14, itemName: 'Straws', category: 'Packaging', unit: 'pack', stockQty: 80, threshold: 30, unitCost: 25 },
  { itemId: 15, itemName: 'Takeout Boxes', category: 'Packaging', unit: 'pcs', stockQty: 40, threshold: 100, unitCost: 8 },
  { itemId: 16, itemName: 'Napkins', category: 'Packaging', unit: 'pack', stockQty: 120, threshold: 50, unitCost: 45 },
];

const MOCK_LOGS: BudgetAuditLog[] = [
  { id: 1, amount: 15000, type: 'IN', description: 'Allotted Budget (Sales - Expenses - Payroll)', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 2, amount: 4250, type: 'OUT', description: 'Restock: Coffee Beans & Vanilla Syrup', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: 3, amount: 8000, type: 'IN', description: 'Allotted Budget (Sales - Expenses - Payroll)', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, amount: 1250, type: 'OUT', description: 'Restock: Paper Cups (500 pcs)', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 5, amount: 5000, type: 'IN', description: 'Additional allocation from Owner', createdAt: new Date(Date.now() - 21600000).toISOString() },
];

const ROWS_PER_PAGE = 6;

type Tab = 'stock' | 'restock' | 'audit';

export function AdminInventory({ onSubTitleChange }: { onSubTitleChange?: (subtitle: string) => void }) {
  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  // Data State
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(MOCK_ITEMS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  // Restock
  const [cart, setCart] = useState<RestockCartItem[]>([]);
  const [executing, setExecuting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [restockSearch, setRestockSearch] = useState('');
  const [restockCategoryFilter, setRestockCategoryFilter] = useState('all');

  const budget = MOCK_LOGS.reduce((s, l) => l.type === 'IN' ? s + l.amount : s - l.amount, 0);
  const cartTotal = cart.reduce((s, c) => s + c.unitCost * c.quantity, 0);
  const lowCount = inventoryItems.filter(i => i.stockQty <= i.threshold).length;

  // Unique categories for filter
  const categories = useMemo(() => [...new Set(inventoryItems.map(i => i.category))], [inventoryItems]);

  // Filtered + paginated stock
  const filteredStock = useMemo(() => {
    return inventoryItems.filter(item => {
      const q = search.toLowerCase();
      const matchesSearch = !q || item.itemName.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const isOut = item.stockQty === 0;
      const isLow = !isOut && item.stockQty <= item.threshold;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'ok' && !isOut && !isLow) ||
        (statusFilter === 'low' && isLow) ||
        (statusFilter === 'out' && isOut);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [search, categoryFilter, statusFilter]);

  const stockPages = Math.ceil(filteredStock.length / ROWS_PER_PAGE);
  const pagedStock = filteredStock.slice((stockPage - 1) * ROWS_PER_PAGE, stockPage * ROWS_PER_PAGE);

  // Sorted + filtered + paginated audit
  const filteredLogs = useMemo(() => {
    const sorted = [...MOCK_LOGS].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return sorted.filter(log => {
      const logDate = new Date(log.createdAt).toISOString().split('T')[0];
      const matchesDate = !auditDateFilter || logDate === auditDateFilter;
      const matchesType = auditTypeFilter === 'all' || log.type === auditTypeFilter;
      return matchesDate && matchesType;
    });
  }, [auditDateFilter, auditTypeFilter]);

  const auditPages = Math.ceil(filteredLogs.length / ROWS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((auditPage - 1) * ROWS_PER_PAGE, auditPage * ROWS_PER_PAGE);

  // Reset page on search/filter change
  const handleSearch = (val: string) => {
    setSearch(val);
    setStockPage(1);
    setAuditPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setAuditTypeFilter('all');
    setAuditDateFilter('');
    setStockPage(1);
    setAuditPage(1);
  };

  // Restock helpers
  const addToCart = (item: InventoryItem, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => {
      const ex = prev.find(c => c.itemId === item.itemId);
      if (ex) return prev.map(c => c.itemId === item.itemId ? { ...c, quantity: c.quantity + qty } : c);
      return [...prev, { itemId: item.itemId, itemName: item.itemName, unit: item.unit, unitCost: item.unitCost, quantity: qty }];
    });
  };

  const doRestock = async () => {
    if (!cart.length || cartTotal > budget) return;
    setExecuting(true);
    await new Promise(r => setTimeout(r, 1000));
    setCart([]);
    setExecuting(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stock', label: 'Stock Overview' },
    { id: 'restock', label: 'Restock Planner' },
    { id: 'audit', label: 'Budget Log' },
  ];

  useEffect(() => {
    const label = tabs.find(t => t.id === tab)?.label || '';
    onSubTitleChange?.(label);
  }, [tab, onSubTitleChange]);

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Inventory Management</p>
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-bold font-poppins text-gray-900">
              ₱{budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <span className="text-xs text-gray-400">available restock budget</span>
            {lowCount > 0 && (
              <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                {lowCount} low stock
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSearch(''); }}
              className={`px-4 py-2 text-sm font-medium transition-all border-b-2 -mb-px
                ${tab === t.id
                  ? 'border-[#4a6741] text-[#4a6741]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search & Filters (stock & audit only) ── */}
      {(tab === 'stock' || tab === 'audit') && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {tab === 'stock' ? (
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search items..."
                className="w-56 pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4a6741] text-black placeholder:text-gray-300 transition-colors"
              />
            </div>
          ) : (
            <div className="relative flex items-center">
              <Calendar size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type={auditDateFilter ? "date" : "text"}
                placeholder="Filter by date..."
                onFocus={(e) => {
                  e.currentTarget.type = "date";
                  try { e.currentTarget.showPicker?.(); } catch (err) { }
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.value) e.currentTarget.type = "text";
                }}
                value={auditDateFilter}
                onChange={e => { setAuditDateFilter(e.target.value); setAuditPage(1); }}
                className="h-[38px] pl-9 pr-3 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all w-40 cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full text-gray-900 placeholder:text-gray-400"
              />
            </div>
          )}

          {tab === 'stock' && (
            <>
              <select
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setStockPage(1); }}
                className="h-[38px] pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all"
              >
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setStockPage(1); }}
                className="h-[38px] pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all"
              >
                <option value="all">All Status</option>
                <option value="ok">In Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
              </select>
            </>
          )}

          {tab === 'audit' && (
            <select
              value={auditTypeFilter}
              onChange={e => { setAuditTypeFilter(e.target.value); setAuditPage(1); }}
              className="h-[38px] pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all"
            >
              <option value="all">All Transactions</option>
              <option value="IN">Income (IN)</option>
              <option value="OUT">Expense (OUT)</option>
            </select>
          )}

          {(search || categoryFilter !== 'all' || statusFilter !== 'all' || auditTypeFilter !== 'all' || auditDateFilter) && (
            <button
              onClick={resetFilters}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear filters
            </button>
          )}

          {tab === 'stock' && (
            <button
              onClick={() => { setEditingItem(null); setShowAddModal(true); }}
              className="ml-auto flex items-center gap-2 bg-[#4a6741] text-white px-4 h-[38px] rounded-lg text-sm font-medium hover:bg-[#3d5536] transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >

          {/* ═══ STOCK OVERVIEW ═══ */}
          {tab === 'stock' && (
            <div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Item</th>
                      <th className="px-5 py-3 font-semibold">Category</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold text-right">Stock</th>
                      <th className="px-5 py-3 font-semibold text-right">Unit Cost</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedStock.map(item => {
                      const isOut = item.stockQty === 0;
                      const isLow = !isOut && item.stockQty <= item.threshold;
                      return (
                        <tr key={item.itemId} className="hover:bg-gray-50/60">
                          <td className="px-5 py-3 font-medium text-gray-900">{item.itemName}</td>
                          <td className="px-5 py-3 text-gray-500">{item.category}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md
                              ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {isOut ? <AlertTriangle size={10} /> : isLow ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                              {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                            </span>
                          </td>
                          <td className={`px-5 py-3 text-right font-medium ${isOut || isLow ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.stockQty} <span className="text-gray-400 font-normal">{item.unit}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500">₱{item.unitCost.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setEditingItem(item); setShowAddModal(true); }}
                                className="p-1.5 text-gray-400 hover:text-[#4a6741] hover:bg-[#4a6741]/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this item?')) {
                                    setInventoryItems(prev => prev.filter(i => i.itemId !== item.itemId));
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {pagedStock.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No items found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredStock.length > 0 && stockPages > 1 && (
                <Pagination current={stockPage} total={stockPages} onChange={setStockPage} count={filteredStock.length} />
              )}
            </div>
          )}

          {/* ═══ RESTOCK PLANNER ═══ */}
          {tab === 'restock' && (() => {
            const restockFiltered = inventoryItems.filter(item => {
              const q = restockSearch.toLowerCase();
              const matchesSearch = !q || item.itemName.toLowerCase().includes(q);
              const matchesCat = restockCategoryFilter === 'all' || item.category === restockCategoryFilter;
              return matchesSearch && matchesCat;
            });

            return (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3">
                  {/* Search + Filter */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1">
                      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text"
                        value={restockSearch}
                        onChange={e => setRestockSearch(e.target.value)}
                        placeholder="Search items..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4a6741] text-black placeholder:text-gray-300 transition-colors"
                      />
                    </div>
                    <select
                      value={restockCategoryFilter}
                      onChange={e => setRestockCategoryFilter(e.target.value)}
                      className="h-[38px] pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <AnimatePresence>
                    {showSuccess && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3 text-sm text-emerald-700 font-medium">
                        <CheckCircle2 size={15} /> Restock executed!
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Scrollable item list */}
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {restockFiltered.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">No items match your search</p>
                    )}
                    {restockFiltered.map(item => {
                      const inCart = cart.find(c => c.itemId === item.itemId);
                      const isOut = item.stockQty === 0;
                      const isLow = !isOut && item.stockQty <= item.threshold;
                      return (
                        <div key={item.itemId}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors
                          ${inCart ? 'border-[#4a6741]/30 bg-[#f7faf6]' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                              {isOut && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">OUT</span>}
                              {isLow && <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">LOW</span>}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {item.stockQty} {item.unit} left · ₱{item.unitCost}/{item.unit}
                            </p>
                          </div>
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[#4a6741]">{inCart.quantity} {item.unit} added</span>
                              <button onClick={() => setCart(prev => prev.filter(c => c.itemId !== item.itemId))}
                                className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          ) : (
                            <form onSubmit={e => {
                              e.preventDefault();
                              const fd = new FormData(e.target as HTMLFormElement);
                              const parsedQty = parseFloat((fd.get('qty') as string).replace(/,/g, ''));
                              if (isNaN(parsedQty) || parsedQty <= 0) {
                                alert('Please enter a valid numeric quantity greater than 0.');
                                return;
                              }
                              addToCart(item, parsedQty);
                              (e.target as HTMLFormElement).reset();
                            }} className="flex items-center gap-2">
                              <input name="qty" type="text" placeholder="Qty" required
                                className="w-16 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4a6741] text-black placeholder:text-gray-400" />
                              <button type="submit" className="p-1.5 text-[#4a6741] hover:bg-[#4a6741]/10 rounded-lg transition-colors">
                                <Plus size={16} />
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 sticky top-6">
                    <p className="text-sm font-semibold text-gray-900 mb-4">Summary</p>

                    <div className="space-y-2.5 mb-5 min-h-[100px]">
                      {cart.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-6">No items added yet</p>
                      ) : cart.map(c => (
                        <div key={c.itemId} className="flex justify-between text-sm">
                          <div>
                            <p className="text-gray-800">{c.itemName}</p>
                            <p className="text-xs text-gray-400">{c.quantity} × ₱{c.unitCost.toFixed(2)}</p>
                          </div>
                          <span className="font-medium text-gray-900">₱{(c.unitCost * c.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-200 pt-3 space-y-1.5 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total</span>
                        <span className="font-bold text-gray-900">₱{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Remaining</span>
                        <span className={cartTotal > budget ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
                          ₱{(budget - cartTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <button onClick={doRestock}
                      disabled={!cart.length || cartTotal > budget || executing}
                      className="w-full py-2.5 bg-[#4a6741] hover:bg-[#3d5836] text-white text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                      {executing ? <RefreshCw className="animate-spin" size={14} /> : <Calculator size={14} />}
                      Execute Restock
                    </button>
                    {cartTotal > budget && <p className="text-[11px] text-red-500 text-center mt-1.5">Exceeds budget</p>}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══ ADD ITEM MODAL ═══ */}
          <AnimatePresence>
            {showAddModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
                    <button
                      onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form
                    className="p-6 space-y-4"
                    onSubmit={e => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      const cat = fd.get('category') as string;
                      const newCat = fd.get('newCategory') as string;
                      const finalCategory = cat === 'New Category' ? newCat : cat;

                      const stockQty = parseFloat((fd.get('stock') as string).replace(/,/g, ''));
                      const threshold = parseFloat((fd.get('threshold') as string).replace(/,/g, ''));
                      const unitCost = parseFloat((fd.get('cost') as string).replace(/,/g, ''));

                      if (isNaN(stockQty) || isNaN(threshold) || isNaN(unitCost)) {
                        alert('Please enter valid numbers for Initial Stock, Low Stock Alert At, and Unit Cost.');
                        return;
                      }

                      if (editingItem) {
                        setInventoryItems(prev => prev.map(item => item.itemId === editingItem.itemId ? {
                          ...item,
                          itemName: fd.get('name') as string,
                          category: finalCategory,
                          unit: fd.get('unit') as string,
                          stockQty,
                          threshold,
                          unitCost
                        } : item));
                      } else {
                        const newItem: InventoryItem = {
                          itemId: Date.now(),
                          itemName: fd.get('name') as string,
                          category: finalCategory,
                          unit: fd.get('unit') as string,
                          stockQty,
                          threshold,
                          unitCost,
                        };
                        setInventoryItems(prev => [...prev, newItem]);
                      }
                      setShowAddModal(false);
                      setEditingItem(null);
                    }}
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                      <input name="name" required type="text" placeholder="e.g. Almond Milk" defaultValue={editingItem?.itemName}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                        <select name="category" required defaultValue={editingItem?.category}
                          onChange={e => {
                            const newCatInput = e.currentTarget.parentElement?.querySelector('.new-cat-input') as HTMLInputElement;
                            if (newCatInput) {
                              newCatInput.style.display = e.currentTarget.value === 'New Category' ? 'block' : 'none';
                              if (e.currentTarget.value === 'New Category') newCatInput.required = true;
                              else newCatInput.required = false;
                            }
                          }}
                          className="w-full h-[38px] px-3 pr-8 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all bg-white appearance-none text-gray-900">
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          {!categories.includes(editingItem?.category || '') && editingItem && (
                            <option value={editingItem.category}>{editingItem.category}</option>
                          )}
                          <option value="New Category">Add new category...</option>
                        </select>
                        <input name="newCategory" type="text" placeholder="Category name"
                          className="new-cat-input mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all hidden text-gray-900 placeholder:text-gray-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                        <input name="unit" required type="text" placeholder="e.g. L, kg, pcs" defaultValue={editingItem?.unit}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Initial Stock</label>
                        <input name="stock" required type="text" placeholder="0" defaultValue={editingItem?.stockQty}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Alert At</label>
                        <input name="threshold" required type="text" placeholder="0" defaultValue={editingItem?.threshold}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost (₱)</label>
                        <input name="cost" required type="text" placeholder="0.00" defaultValue={editingItem?.unitCost}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                      <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-[#4a6741] hover:bg-[#3d5536] rounded-lg transition-colors">
                        {editingItem ? 'Save Changes' : 'Add Item'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ═══ BUDGET AUDIT LOG ═══ */}
          {tab === 'audit' && (
            <div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Type</th>
                      <th className="px-5 py-3 font-semibold">Description</th>
                      <th className="px-5 py-3 font-semibold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pagedLogs.map(log => {
                      const isIn = log.type === 'IN';
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/60">
                          <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md
                              ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {isIn ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                              {log.type}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-700">{log.description}</td>
                          <td className={`px-5 py-3 text-right font-semibold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIn ? '+' : '-'}₱{log.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {pagedLogs.length === 0 && (
                      <tr><td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">No transactions found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredLogs.length > 0 && auditPages > 1 && (
                <Pagination current={auditPage} total={auditPages} onChange={setAuditPage} count={filteredLogs.length} />
              )}
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─── Pagination Component ───
function Pagination({ current, total, onChange, count }: { current: number; total: number; onChange: (p: number) => void; count: number }) {
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-gray-400">{count} total</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, current - 1))}
          disabled={current === 1}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: total }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors
              ${p === current ? 'bg-[#4a6741] text-white' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onChange(Math.min(total, current + 1))}
          disabled={current === total}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
