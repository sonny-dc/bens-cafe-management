import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, Calculator,
  ArrowUpRight, ArrowDownRight, RefreshCw, Plus,
  Trash2, Search, ChevronLeft, ChevronRight, X, Calendar, Edit2, ChevronDown
} from 'lucide-react';
import { inventoryItemApi } from '../../api/inventoryItemApi';
import { restockCalculationApi } from '../../api/restockCalculationApi';
import { inventoryBudgetAccountApi } from '../../api/inventoryBudgetAccountApi';
import { inventoryBudgetLogApi } from '../../api/inventoryBudgetLogApi';
import { formatIsoDateTimeToTime } from '../../utils/datetime.utils';

import {
  INVENTORY_ITEM_CATEGORIES,
  INVENTORY_ITEM_CATEGORY_LABELS,
  INVENTORY_BUDGET_TRANSACTION_TYPES,
  INVENTORY_BUDGET_SOURCE_TYPES,
  type InventoryItemCategory
} from 'shared/constants';
import type { InventoryItemListItem, InventoryBudgetLog, CreateRestockCalculationInput, InventoryBudgetAccount } from 'shared/models';
import { ApiError } from '../../api/apiError';

const ROWS_PER_PAGE = 6;

type Tab = 'stock' | 'restock' | 'audit';

function getBudgetLogDescription(log: InventoryBudgetLog): string {
  if (log.sourceType === INVENTORY_BUDGET_SOURCE_TYPES.SALES_ENTRY) {
    return log.salesEntryId
      ? `Restock budget allocation from Sales Entry #${log.salesEntryId}`
      : 'Restock budget allocation from sales';
  }

  if (log.sourceType === INVENTORY_BUDGET_SOURCE_TYPES.RESTOCK_CALCULATION) {
    return log.restockCalculationId
      ? `Inventory restock expense from Calculation #${log.restockCalculationId}`
      : 'Inventory restock expense';
  }

  return 'Inventory budget transaction';
}


export function AdminInventory({ onSubTitleChange }: { onSubTitleChange?: (subtitle: string) => void }) {
  const [tab, setTab] = useState<Tab>('stock');
  const [search, setSearch] = useState('');
  const [stockPage, setStockPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  // Data State
  const [inventoryItems, setInventoryItems] = useState<InventoryItemListItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemListItem | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  const [budgetAccount, setBudgetAccount] = useState<InventoryBudgetAccount | null>(null);
  const [budgetLogs, setBudgetLogs] = useState<InventoryBudgetLog[]>([]);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const getFieldError = (field: string) => fieldErrors[field]?.[0];

  const [deletingItem, setDeletingItem] = useState<InventoryItemListItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [restockError, setRestockError] = useState<string | null>(null);


  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');
  const [auditDateFilter, setAuditDateFilter] = useState('');

  // Restock
  const [cart, setCart] = useState<CreateRestockCalculationInput['items']>([]);
  const [executing, setExecuting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [restockSearch, setRestockSearch] = useState('');
  const [restockCategoryFilter, setRestockCategoryFilter] = useState('all');

  const fetchInventoryItems = async () => {
    try {
      setIsLoadingItems(true);
      setInventoryError(null);

      const data = await inventoryItemApi.getList();
      setInventoryItems(data);
    } catch (err: any) {
      setInventoryError(err.message || 'Failed to load inventory items.');
    } finally {
      setIsLoadingItems(false);
    }
  };
  const fetchInventoryBudget = async () => {
    try {
      setIsLoadingBudget(true);
      setBudgetError(null);

      const [account, logs] = await Promise.all([
        inventoryBudgetAccountApi.getCurrent(),
        inventoryBudgetLogApi.getAll()
      ]);

      setBudgetAccount(account);
      setBudgetLogs(logs);
    } catch (err: any) {
      setBudgetError(err.message || 'Failed to load inventory budget.');
    } finally {
      setIsLoadingBudget(false);
    }
  };

  useEffect(() => {
    fetchInventoryItems();
    fetchInventoryBudget();
  }, []);
  const budget = Number(budgetAccount?.currentBalance || 0);

  const cartTotal = cart.reduce((sum, cartItem) => {
    const inventoryItem = inventoryItems.find(
      item => item.itemId === cartItem.itemId
    );

    if (!inventoryItem) return sum;

    return sum + inventoryItem.unitCost * Number(cartItem.quantityToBuy);
  }, 0);
  const lowCount = inventoryItems.filter(i => i.stockQty <= i.threshold).length;

  // Unique categories for filter
  const categories = Object.values(INVENTORY_ITEM_CATEGORIES) as InventoryItemCategory[];

  // Filtered + paginated stock
  const filteredStock = useMemo(() => {
    return inventoryItems.filter(item => {
      const q = search.toLowerCase();

      const categoryLabel =
        INVENTORY_ITEM_CATEGORY_LABELS[item.category]?.toLowerCase() || item.category;

      const matchesSearch =
        !q ||
        item.itemName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        categoryLabel.includes(q);

      const matchesCategory =
        categoryFilter === 'all' || item.category === categoryFilter;

      const isOut = item.stockQty === 0;
      const isLow = !isOut && item.stockQty <= item.threshold;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'ok' && !isOut && !isLow) ||
        (statusFilter === 'low' && isLow) ||
        (statusFilter === 'out' && isOut);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [inventoryItems, search, categoryFilter, statusFilter]);

  const stockPages = Math.ceil(filteredStock.length / ROWS_PER_PAGE);
  const pagedStock = filteredStock.slice((stockPage - 1) * ROWS_PER_PAGE, stockPage * ROWS_PER_PAGE);

  // Sorted + filtered + paginated audit
  const filteredLogs = useMemo(() => {
    const mappedLogs = budgetLogs.map(log => ({
      id: log.budgetLogId,
      amount: Number(log.amount),
      transactionType: log.transactionType,
      description: getBudgetLogDescription(log),
      postedAt: String(log.postedAt)
    }));

    const sorted = mappedLogs.sort((a, b) => b.id - a.id);

    return sorted.filter(log => {
      const logDate = new Date(log.postedAt).toISOString().split('T')[0];

      const matchesDate =
        !auditDateFilter || logDate === auditDateFilter;

      const matchesType =
        auditTypeFilter === 'all' || log.transactionType === auditTypeFilter;

      return matchesDate && matchesType;
    });
  }, [budgetLogs, auditDateFilter, auditTypeFilter]);


  const auditPages = Math.ceil(filteredLogs.length / ROWS_PER_PAGE);
  const pagedLogs = filteredLogs.slice((auditPage - 1) * ROWS_PER_PAGE, auditPage * ROWS_PER_PAGE);

  // Reset page on search/filter change
  const handleSearch = (val: string) => {
    setSearch(val);
    setStockPage(1);
    setAuditPage(1);
  };
  
  const handleDeleteItem = async () => {
    if (!deletingItem) return;

    try {
      setIsDeletingItem(true);
      setDeleteError(null);

      await inventoryItemApi.delete(deletingItem.itemId);

      setCart(prev => prev.filter(c => c.itemId !== deletingItem.itemId));
      setStockPage(1);

      await fetchInventoryItems();

      setDeletingItem(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete item.');
    } finally {
      setIsDeletingItem(false);
    }
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
  const addToCart = (item: InventoryItemListItem, qty: number) => {
    if (qty <= 0) return;

    setCart(prev => {
      const existing = prev.find(c => c.itemId === item.itemId);

      if (existing) {
        return prev.map(c =>
          c.itemId === item.itemId
            ? {
                ...c,
                quantityToBuy: String(Number(c.quantityToBuy) + qty)
              }
            : c
        );
      }

      return [
        ...prev,
        {
          itemId: item.itemId,
          quantityToBuy: String(qty)
        }
      ];
    });
  };


  const doRestock = async () => {
    if (!cart.length || cartTotal > budget) return;

    try {
      setExecuting(true);
      setRestockError(null);

      await restockCalculationApi.create({
        items: cart
      });

      setCart([]);
      setStockPage(1);
      setAuditPage(1);

      await Promise.all([
        fetchInventoryItems(),
        fetchInventoryBudget()
      ]);

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setRestockError(err.message || 'Failed to execute restock.');
    } finally {
      setExecuting(false);
    }
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
            {isLoadingBudget ? (
              <h2 className="text-lg font-bold font-poppins text-gray-400">
                Loading budget...
              </h2>
            ) : (
              <h2 className="text-2xl font-bold font-poppins text-gray-900">
                ₱{budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
            )}

            <span className="text-xs text-gray-400">available restock budget</span>

            {budgetError && (
              <span className="text-xs font-medium text-red-500">
                {budgetError}
              </span>
            )}
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
                title='Filter by category'
                value={categoryFilter}
                onChange={e => { setCategoryFilter(e.target.value); setStockPage(1); }}
                className="h-[38px] pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {INVENTORY_ITEM_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>

              <select
                title='Filter by status'
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
              title='Filter by type'
              value={auditTypeFilter}
              onChange={e => { setAuditTypeFilter(e.target.value); setAuditPage(1); }}
              className="h-[38px] pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all"
            >
              <option value="all">All Transactions</option>
              <option value={INVENTORY_BUDGET_TRANSACTION_TYPES.IN}>Income (IN)</option>
              <option value={INVENTORY_BUDGET_TRANSACTION_TYPES.OUT}>Expense (OUT)</option>
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
              onClick={() => {
               setEditingItem(null);
               setFormError(null);
               setFieldErrors({});
               setShowAddModal(true); 
              }}
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
                    {isLoadingItems && (
                      <tr>
                        <td colSpan={6}>
                          <LoadingState label="Loading inventory items..." />
                        </td>
                      </tr>
                    )}

                    {!isLoadingItems && inventoryError && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-red-500 text-sm">
                          {inventoryError}
                        </td>
                      </tr>
                    )}
                    {!isLoadingItems && !inventoryError && pagedStock.map(item => {
                      const isOut = item.stockQty === 0;
                      const isLow = !isOut && item.stockQty <= item.threshold;
                      return (
                        <tr key={item.itemId} className="hover:bg-gray-50/60">
                          <td className="px-5 py-3 font-medium text-gray-900">{item.itemName}</td>
                          <td className="px-5 py-3 text-gray-500">{INVENTORY_ITEM_CATEGORY_LABELS[item.category]}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md
                              ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {isOut ? <AlertTriangle size={10} /> : isLow ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                              {isOut ? 'Out' : isLow ? 'Low' : 'OK'}
                            </span>
                          </td>
                          <td className={`px-5 py-3 text-right font-medium ${isOut ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.stockQty} <span className="text-gray-400 font-normal">{item.unit}</span>
                          </td>
                          <td className="px-5 py-3 text-right text-gray-500">₱{item.unitCost.toFixed(2)}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(item); 
                                  setFormError(null); 
                                  setFieldErrors({}); 
                                  setShowAddModal(true); 
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#4a6741] hover:bg-[#4a6741]/10 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => {setDeletingItem(item); setDeleteError(null);}}
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
                    {!isLoadingItems && !inventoryError && pagedStock.length === 0 && (
                      <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No items found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!isLoadingItems && !inventoryError && filteredStock.length > 0 && stockPages > 1 && (
                <Pagination
                  current={stockPage}
                  total={stockPages}
                  onChange={setStockPage}
                  count={filteredStock.length}
                />
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
                        onChange={e => {setRestockSearch(e.target.value); setRestockError(null);}}
                        placeholder="Search items..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4a6741] text-black placeholder:text-gray-300 transition-colors"
                      />
                    </div>
                    <select
                      title='Filter by category'
                      value={restockCategoryFilter}
                      onChange={e => {setRestockCategoryFilter(e.target.value); setRestockError(null);}}
                      className="h-[38px] pl-3 pr-8 border border-gray-200 rounded-lg text-sm text-gray-500 bg-white cursor-pointer outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {INVENTORY_ITEM_CATEGORY_LABELS[category]}
                        </option>
                      ))}
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
                  {restockError && (
                    <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {restockError}
                    </div>
                  )}
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {isLoadingItems && (
                      <LoadingState label="Loading inventory items..." />
                    )}

                    {!isLoadingItems && inventoryError && (
                      <p className="text-sm text-red-500 text-center py-10">
                        {inventoryError}
                      </p>
                    )}

                    {!isLoadingItems && !inventoryError && restockFiltered.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-10">
                        No items match your search
                      </p>
                    )}
                    {!isLoadingItems && !inventoryError && restockFiltered.map(item => {
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
                              <span className="text-xs font-medium text-[#4a6741]">{inCart.quantityToBuy} {item.unit} added</span>
                              <button title="Remove from cart" onClick={() => setCart(prev => prev.filter(c => c.itemId !== item.itemId))}
                                className="text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                            </div>
                          ) : (
                            <form noValidate onSubmit={e => {
                              e.preventDefault();
                              const fd = new FormData(e.target as HTMLFormElement);
                              const parsedQty = parseFloat((fd.get('qty') as string).replace(/,/g, ''));
                              if (isNaN(parsedQty) || parsedQty <= 0) {
                                setRestockError('Please enter a valid numeric quantity greater than 0.');
                                return;
                              }

                              setRestockError(null);
                              addToCart(item, parsedQty);
                              (e.target as HTMLFormElement).reset();
                            }} className="flex items-center gap-2">
                              <input name="qty" type="text" placeholder="Qty" required
                                title="Enter quantity"
                                className="w-16 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#4a6741] text-black placeholder:text-gray-400" />
                              <button type="submit" title="Add to cart" className="p-1.5 text-[#4a6741] hover:bg-[#4a6741]/10 rounded-lg transition-colors">
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
                        <p className="text-xs text-gray-400 text-center py-6">
                          No items added yet
                        </p>
                      ) : cart.map(c => {
                        const inventoryItem = inventoryItems.find(
                          item => item.itemId === c.itemId
                        );

                        if (!inventoryItem) return null;

                        const quantity = Number(c.quantityToBuy);
                        const lineTotal = inventoryItem.unitCost * quantity;

                        return (
                          <div key={c.itemId} className="flex justify-between text-sm">
                            <div>
                              <p className="text-gray-800">{inventoryItem.itemName}</p>
                              <p className="text-xs text-gray-400">
                                {c.quantityToBuy} × ₱{inventoryItem.unitCost.toFixed(2)}
                              </p>
                            </div>

                            <span className="font-medium text-gray-900">
                              ₱{lineTotal.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-gray-200 pt-3 space-y-1.5 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Available Budget</span>
                        <span className="font-semibold text-[#4a6741]">
                          {isLoadingBudget
                            ? 'Loading...'
                            : `₱${budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Total Restock Cost</span>
                        <span className="font-bold text-gray-900">
                          ₱{cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Remaining After Restock</span>
                        <span className={cartTotal > budget ? 'text-red-500 font-medium' : 'text-emerald-600 font-medium'}>
                          ₱{(budget - cartTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {budgetError && (
                        <p className="text-[11px] text-red-500 text-center mt-1.5">
                          {budgetError}
                        </p>
                      )}
                    </div>

                    <button onClick={doRestock}
                      disabled={!cart.length || cartTotal > budget || executing || isLoadingBudget || !!budgetError}
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
                  onClick={() => {
                    if (isSavingItem) return;
                    setShowAddModal(false);
                    setEditingItem(null);
                    setFormError(null);
                    setFieldErrors({});
                  }}
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
                      title="Close"
                      disabled={isSavingItem}
                      onClick={() => {
                        if (isSavingItem) return;
                        setShowAddModal(false);
                        setEditingItem(null);
                        setFormError(null);
                        setFieldErrors({});
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form
                    noValidate
                    className="p-6 space-y-4"
                    onSubmit={async e => {
                      e.preventDefault();

                      setFormError(null);
                      setFieldErrors({});

                      const fd = new FormData(e.currentTarget);

                      const itemName = String(fd.get('name') || '').trim();
                      const category = fd.get('category') as InventoryItemCategory;
                      const unit = String(fd.get('unit') || '').trim();

                      const stockQty = parseFloat(String(fd.get('stock') || '').replace(/,/g, ''));
                      const threshold = parseFloat(String(fd.get('threshold') || '').replace(/,/g, ''));
                      const unitCost = parseFloat(String(fd.get('cost') || '').replace(/,/g, ''));

                      const inputs = { itemName, unit, stockQty, threshold, unitCost };

                      const areAllValuesEmpty = Object.values(inputs).every(value => !String(value || '').trim());
                      
                      if (areAllValuesEmpty) {
                        setFormError('Please fill in all required fields.');
                        return;
                      }

                      if (!itemName || !unit) {
                        setFormError('Please enter item name and unit.');
                        return;
                      }

                      if (isNaN(stockQty) || isNaN(threshold) || isNaN(unitCost)) {
                        setFormError('Please enter valid numbers for Initial Stock, Low Stock Alert At, and Unit Cost.');
                        return;
                      }

                      if (stockQty < 0 || threshold < 0 || unitCost < 0) {
                        setFormError('Stock, threshold, and unit cost must not be negative.');
                        return;
                      }

                      const payload = {
                        itemName,
                        category,
                        unit,
                        stockQuantity: String(stockQty),
                        lowThreshold: String(threshold),
                        unitCost: String(unitCost)
                      };

                      try {
                        setIsSavingItem(true);
                        setFormError(null);
                        setFieldErrors({});

                        if (editingItem) {
                          await inventoryItemApi.update(editingItem.itemId, payload);
                        } else {
                          await inventoryItemApi.create(payload);
                        }

                        setStockPage(1);
                        await fetchInventoryItems();
                        setCart([]);

                        setShowAddModal(false);
                        setEditingItem(null);
                      } catch (err: any) {
                        if (err instanceof ApiError) {
                          setFieldErrors(err.errors?.fieldErrors || {});

                          const firstFormError = err.errors?.formErrors?.[0];
                          setFormError(firstFormError || err.message || 'Failed to save inventory item.');
                          return;
                        }
                        setFormError(err.message || 'Failed to save inventory item.');
                      } finally {
                        setIsSavingItem(false);
                      }
                    }}
                  >
                    {formError && (
                      <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {formError}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                      <input name="name" type="text" placeholder="e.g. Almond Milk" defaultValue={editingItem?.itemName}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                        {getFieldError('itemName') && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {getFieldError('itemName')}
                          </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Category
                        </label>

                        <div className="relative">
                          <select
                            title="Category"
                            name="category"
                            defaultValue={editingItem?.category || INVENTORY_ITEM_CATEGORIES.BEVERAGE_INGREDIENTS}
                            className="w-full h-[38px] px-3 pr-9 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all bg-white appearance-none text-gray-900 cursor-pointer"
                          >
                            {categories.map(category => (
                              <option key={category} value={category}>
                                {INVENTORY_ITEM_CATEGORY_LABELS[category]}
                              </option>
                            ))}
                          </select>

                          <ChevronDown
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>

                        {getFieldError('category') && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {getFieldError('category')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                        <input name="unit" required type="text" placeholder="e.g. L, kg, pcs" defaultValue={editingItem?.unit}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                          {getFieldError('unit') && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              {getFieldError('unit')}
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Initial Stock</label>
                        <input name="stock" required type="text" placeholder="0" defaultValue={editingItem?.stockQty}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                        {getFieldError('stockQuantity') && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {getFieldError('stockQuantity')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Alert At</label>
                        <input name="threshold" required type="text" placeholder="0" defaultValue={editingItem?.threshold}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                          {getFieldError('lowThreshold') && (
                            <p className="mt-1 text-xs font-medium text-red-600">
                              {getFieldError('lowThreshold')}
                            </p>
                          )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Unit Cost (₱)</label>
                        <input name="cost" required type="text" placeholder="0.00" defaultValue={editingItem?.unitCost}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-[#4a6741]/30 focus:border-[#4a6741]/50 transition-all text-gray-900 placeholder:text-gray-400" />
                        {getFieldError('unitCost') && (
                          <p className="mt-1 text-xs font-medium text-red-600">
                            {getFieldError('unitCost')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                      <button 
                        type="button" 
                        disabled={isSavingItem} 
                        onClick={() => {
                          if (isSavingItem) return;
                          setShowAddModal(false);
                          setEditingItem(null);
                          setFormError(null);
                          setFieldErrors({});
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingItem}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#4a6741] hover:bg-[#3d5536] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSavingItem ? 'Saving...' : editingItem ? 'Save Changes' : 'Add Item'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ═══ DELETE ITEM CONFIRMATION MODAL ═══ */}
          <AnimatePresence>
            {deletingItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (isDeletingItem) return;
                  setDeleteError(null);
                  setDeletingItem(null);
                }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  onClick={e => e.stopPropagation()}
                  className="bg-white rounded-[20px] shadow-xl w-full max-w-[340px] p-6"
                >
                  <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                    <Trash2 size={20} />
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1.5 tracking-tight">
                    Delete inventory item?
                  </h3>

                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    Are you sure you want to delete{' '}
                    <strong className="text-gray-800">{deletingItem.itemName}</strong>?
                    Related historical records will remain, but their item reference may be cleared.
                  </p>
                  {deleteError && (
                    <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                      {deleteError}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleDeleteItem}
                      disabled={isDeletingItem}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeletingItem ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        'Yes, Delete'
                      )}
                    </button>

                    <button
                      onClick={() => {setDeletingItem(null); setDeleteError(null);}}
                      disabled={isDeletingItem}
                      className="w-full py-2.5 bg-transparent hover:bg-gray-50 text-gray-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
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
                    {isLoadingBudget && (
                      <tr>
                        <td colSpan={4}>
                          <LoadingState label="Loading budget logs..." />
                        </td>
                      </tr>
                    )}

                    {!isLoadingBudget && budgetError && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-red-500 text-sm">
                          {budgetError}
                        </td>
                      </tr>
                    )}
                    {!isLoadingBudget && !budgetError && pagedLogs.map(log => {
                      const isIn = log.transactionType === INVENTORY_BUDGET_TRANSACTION_TYPES.IN;
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/60">
                          <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                            {formatIsoDateTimeToTime(String(log.postedAt))}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md
                              ${isIn ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              {isIn ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                              {log.transactionType}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-700">{log.description}</td>
                          <td className={`px-5 py-3 text-right font-semibold ${isIn ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIn ? '+' : '-'}₱{log.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {!isLoadingBudget && !budgetError && pagedLogs.length === 0 && (
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
          title="Previous page"
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
          title="Next page"
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

// ── Loading State Component ───
function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
      <p className="text-xs text-gray-400 font-medium">{label}</p>
    </div>
  );
}

