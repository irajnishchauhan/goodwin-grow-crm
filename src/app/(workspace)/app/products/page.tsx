"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Plus,
  Search,
  Tag,
  X,
  Edit2,
  Trash2,
  Save,
  CheckSquare,
  Square,
  Sparkles,
  CheckCircle2,
  Layers,
  Copy,
  Filter,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState<"ALL" | "FREE" | "PAID" | "ACTIVE">("ALL");

  // Selection state for "Select All at Once"
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [seedingLoading, setSeedingLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create Form State
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [currency, setCurrency] = useState("INR");
  const [isFreeService, setIsFreeService] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit Form State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/products", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // Load / Seed Market Standard Service Catalogue
  async function handleLoadMarketCatalog() {
    try {
      setSeedingLoading(true);
      setBannerMessage(null);
      const res = await fetch("/api/products/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBannerMessage({
          type: "success",
          text: data.message || "Market-standard product & service catalog loaded successfully!",
        });
        await fetchProducts();
      } else {
        setBannerMessage({
          type: "error",
          text: data.error || "Failed to load market catalog",
        });
      }
    } catch {
      setBannerMessage({ type: "error", text: "Network error loading market catalog" });
    } finally {
      setSeedingLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const finalPrice = isFreeService ? 0 : Number(unitPrice) || 0;
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          description,
          unitPrice: finalPrice,
          currency,
          isActive: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setModalOpen(false);
        setName("");
        setSku("");
        setDescription("");
        setUnitPrice(0);
        setIsFreeService(false);
        setBannerMessage({ type: "success", text: `Product "${data.data.name}" added to catalog!` });
        fetchProducts();
      } else {
        alert(data.error || "Failed to create product");
      }
    } catch {
      alert("Error creating product");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(p: any) {
    setEditingProduct(p);
    setEditName(p.name);
    setEditSku(p.sku || "");
    setEditDescription(p.description || "");
    setEditUnitPrice(Number(p.unitPrice) || 0);
    setEditIsActive(p.isActive !== false);
    setEditModalOpen(true);
  }

  function handleDuplicate(p: any) {
    setName(`${p.name} (Copy)`);
    setSku(p.sku ? `${p.sku}-COPY` : "");
    setDescription(p.description || "");
    setUnitPrice(Number(p.unitPrice) || 0);
    setIsFreeService(Number(p.unitPrice) === 0);
    setModalOpen(true);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          sku: editSku || null,
          description: editDescription || null,
          unitPrice: editUnitPrice,
          isActive: editIsActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEditModalOpen(false);
        setEditingProduct(null);
        setBannerMessage({ type: "success", text: "Product updated successfully!" });
        fetchProducts();
      } else {
        alert(data.error || "Failed to update product (RBAC check)");
      }
    } catch {
      alert("Error updating product");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(productId: string, productName: string) {
    if (!confirm(`Are you sure you want to delete "${productName}" from the catalog?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        if (editingProduct && editingProduct.id === productId) {
          setEditModalOpen(false);
          setEditingProduct(null);
        }
        setSelectedIds((prev) => prev.filter((id) => id !== productId));
        fetchProducts();
      } else {
        alert(data.error || "Failed to delete product (RBAC check)");
      }
    } catch {
      alert("Error deleting product");
    }
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    const price = Number(p.unitPrice) || 0;
    if (pricingFilter === "FREE") return price === 0;
    if (pricingFilter === "PAID") return price > 0;
    if (pricingFilter === "ACTIVE") return p.isActive !== false;
    return true;
  });

  // Bulk Selection Handlers
  const isAllSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.includes(p.id));

  function handleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  }

  function handleToggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Permanently delete all ${selectedIds.length} selected items from the catalog?`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerMessage({ type: "success", text: `Deleted ${data.deletedCount || selectedIds.length} items.` });
        setSelectedIds([]);
        fetchProducts();
      } else {
        alert(data.error || "Failed to delete selected items");
      }
    } catch {
      alert("Error deleting items");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkToggleStatus(newActiveStatus: boolean) {
    if (selectedIds.length === 0) return;
    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds, isActive: newActiveStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerMessage({
          type: "success",
          text: `Updated ${selectedIds.length} items to ${newActiveStatus ? "Active" : "Inactive"}.`,
        });
        setSelectedIds([]);
        fetchProducts();
      } else {
        alert(data.error || "Failed to update items");
      }
    } catch {
      alert("Error updating items");
    } finally {
      setBulkActionLoading(false);
    }
  }

  const freeCount = products.filter((p) => Number(p.unitPrice) === 0).length;
  const paidCount = products.filter((p) => Number(p.unitPrice) > 0).length;
  const activeCount = products.filter((p) => p.isActive !== false).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products & Services Catalog</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Goodwin Catalogue
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Standard product definitions, SKU pricing, and market-standard free lead magnets vs. paid retainers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleLoadMarketCatalog}
            disabled={seedingLoading}
            title="Auto-fill the catalog with Goodwin Grow AI market-standard free audits, retainers & services"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{seedingLoading ? "Loading Catalog..." : "Load Market Standards"}</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Item</span>
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            bannerMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{bannerMessage.text}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar with Category Tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services, retainers, free audits by name, SKU..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setPricingFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                pricingFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setPricingFilter("FREE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                pricingFilter === "FREE"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span>Free Lead Magnets</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-black">
                {freeCount}
              </span>
            </button>
            <button
              onClick={() => setPricingFilter("PAID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                pricingFilter === "PAID"
                  ? "bg-indigo-600 text-white"
                  : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"
              }`}
            >
              <span>Paid Retainers</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-black">
                {paidCount}
              </span>
            </button>
            <button
              onClick={() => setPricingFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                pricingFilter === "ACTIVE"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              Active ({activeCount})
            </button>
          </div>
        </div>

        {/* Bulk Action Bar when items are selected */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-900">
                {selectedIds.length} of {filteredProducts.length} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="underline text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer ml-1"
              >
                {isAllSelected ? "Deselect All" : "Select All Visible"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkToggleStatus(true)}
                disabled={bulkActionLoading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold hover:bg-emerald-50 transition shadow-2xs cursor-pointer"
              >
                Mark Active
              </button>
              <button
                onClick={() => handleBulkToggleStatus(false)}
                disabled={bulkActionLoading}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              >
                Mark Inactive
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bulk Delete ({selectedIds.length})</span>
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 uppercase text-[10px] tracking-wider">
                {/* SELECT ALL AT ONCE CHECKBOX */}
                <th className="py-3.5 px-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    title={isAllSelected ? "Deselect All" : "Select All Items"}
                    className="flex items-center justify-center text-slate-500 hover:text-emerald-600 cursor-pointer"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : selectedIds.length > 0 ? (
                      <div className="w-4 h-4 rounded border-2 border-emerald-600 bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-800 font-bold">
                        -
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Product / Service Name</th>
                <th className="py-3.5 px-4">SKU / Code</th>
                <th className="py-3.5 px-4">Pricing Model</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading catalog...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    {search ? (
                      `No items matching "${search}"`
                    ) : (
                      <div className="space-y-3">
                        <p>No products or services found in this catalog.</p>
                        <button
                          onClick={handleLoadMarketCatalog}
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Populate Market-Standard Goodwin Grow AI Catalog</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const price = Number(p.unitPrice) || 0;
                  const isFree = price === 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 transition group ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleRow(p.id)}
                          className="flex items-center justify-center text-slate-400 hover:text-emerald-600 cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Name & Description */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <Package className={`w-4 h-4 shrink-0 ${isFree ? "text-emerald-600" : "text-indigo-600"}`} />
                          <span className="truncate max-w-sm">{p.name}</span>
                        </div>
                        {p.description && (
                          <p className="text-[11px] text-slate-500 font-normal truncate max-w-md mt-0.5">
                            {p.description}
                          </p>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {p.sku || "—"}
                      </td>

                      {/* Free vs Paid Badge */}
                      <td className="py-3.5 px-4">
                        {isFree ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            Free Lead Magnet
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                            Paid Service
                          </span>
                        )}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3.5 px-4">
                        {isFree ? (
                          <span className="font-extrabold text-emerald-700 text-xs">₹0 Complimentary</span>
                        ) : (
                          <span className="font-extrabold text-slate-900 text-xs">
                            {formatCurrency(price)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.isActive !== false
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {p.isActive !== false ? "Active" : "Archived"}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-400">{formatDate(p.createdAt)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicate(p)}
                            title="Duplicate Service"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEdit(p)}
                            title="Edit Product"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Delete Product"
                            className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Add Service or Product</h2>
                <p className="text-[11px] text-slate-500">Configure free lead magnets or paid growth packages</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setIsFreeService(false);
                    if (unitPrice === 0) setUnitPrice(25000);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    !isFreeService
                      ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Paid Service / Retainer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsFreeService(true);
                    setUnitPrice(0);
                  }}
                  className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                    isFreeService
                      ? "bg-emerald-600 text-white shadow-2xs font-extrabold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Free Lead Magnet (₹0)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Service or Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meta Ads Performance Audit or Growth Retainer"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU / Item Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. GGA-SEO-AUDIT"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Price (₹ INR) {isFreeService && "(Free)"}
                  </label>
                  <input
                    type="number"
                    required
                    disabled={isFreeService}
                    min={0}
                    value={isFreeService ? 0 : unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Scope & Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline deliverables, included creatives, monthly sprint cadence..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                >
                  {creating ? "Saving..." : "Save to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Edit Catalog Item</h2>
                <p className="text-[11px] text-slate-500">Update pricing, description, and visibility</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Product / Service Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editUnitPrice}
                    onChange={(e) => setEditUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="editIsActive" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Active in quotation & deal selector
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleDelete(editingProduct.id, editingProduct.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingEdit ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
