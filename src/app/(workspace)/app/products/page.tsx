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
  BookOpen,
  ShieldCheck,
  FileText,
  ChevronRight,
  DollarSign,
  Info,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

function parseMeta(desc?: string) {
  if (!desc) return { category: null, status: null, scope: null, marketRange: null, text: "" };
  const match = desc.match(/^\[(.*?)\]\s*\[(.*?)\]\s*Scope:\s*(.*?)\s*\|\s*2026 Market Range:\s*(.*?)\.\s*(.*)$/);
  if (match) {
    return {
      category: match[1],
      status: match[2],
      scope: match[3],
      marketRange: match[4],
      text: match[5],
    };
  }
  return { category: null, status: null, scope: null, marketRange: null, text: desc };
}

const SERVICE_CATEGORIES = [
  "Consultation & Onboarding",
  "Account Setup",
  "Social Media",
  "Creative Design",
  "Video & Reels",
  "Meta Ads",
  "Google Ads",
  "SEO",
  "Google Business",
  "Website",
  "E-commerce",
  "Lead Generation",
  "AI & Automation",
  "Content",
  "Analytics",
  "Consulting",
  "Packages",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pricingFilter, setPricingFilter] = useState<"ALL" | "FREE" | "PAID" | "PACKAGES" | "ACTIVE">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyTab, setPolicyTab] = useState<"POLICY" | "THIRDPARTY" | "RULES" | "PACKAGES" | "COMMUNICATION">("POLICY");

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
    const meta = parseMeta(p.description);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      (meta.category && meta.category.toLowerCase().includes(search.toLowerCase())) ||
      (meta.scope && meta.scope.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (categoryFilter !== "ALL") {
      if (meta.category !== categoryFilter) return false;
    }

    const price = Number(p.unitPrice) || 0;
    const isPackage = meta.category === "Packages" || p.sku?.includes("PKG");
    if (pricingFilter === "FREE") return price === 0;
    if (pricingFilter === "PAID") return price > 0 && !isPackage;
    if (pricingFilter === "PACKAGES") return isPackage;
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
  const packageCount = products.filter((p) => {
    const meta = parseMeta(p.description);
    return meta.category === "Packages" || p.sku?.includes("PKG");
  }).length;
  const paidCount = products.filter((p) => {
    const meta = parseMeta(p.description);
    return Number(p.unitPrice) > 0 && meta.category !== "Packages" && !p.sku?.includes("PKG");
  }).length;
  const activeCount = products.filter((p) => p.isActive !== false).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Goodwin Grow AI Service Catalogue</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              India 2026 Reference
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal team & client scope reference: Free onboarding & setup vs. chargeable retainers, market benchmarks, and Goodwin pricing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setPolicyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Commercial Policy & Scopes</span>
          </button>

          <button
            onClick={handleLoadMarketCatalog}
            disabled={seedingLoading}
            title="Auto-fill with all 75 Goodwin Grow AI 2026 official services & packages"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-700 font-bold text-xs shadow-xs transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{seedingLoading ? "Syncing Catalogue..." : "Sync 2026 Official Catalogue"}</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Service</span>
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
              placeholder="Search services, retainers, free audits by name, SKU, scope..."
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
              <span>Free & Included</span>
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
              <span>Chargeable Services</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-black">
                {paidCount}
              </span>
            </button>
            <button
              onClick={() => setPricingFilter("PACKAGES")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                pricingFilter === "PACKAGES"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              <span>Growth Packages</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-current font-black">
                {packageCount}
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

        {/* Category Dropdown and Sub-filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-bold text-slate-700">Filter by Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Categories ({products.length} services)</option>
              {SERVICE_CATEGORIES.map((cat) => {
                const count = products.filter((p) => parseMeta(p.description).category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{filteredProducts.length}</span> services in active view
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
                <th className="py-3.5 px-4 min-w-[200px]">Service & Deliverable</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 min-w-[180px]">Typical Scope / Unit</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 min-w-[150px]">Indicative 2026 Market Range</th>
                <th className="py-3.5 px-4 min-w-[150px]">Goodwin Grow AI Price</th>
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
                          <span>Populate Official Goodwin Grow AI 2026 Catalogue</span>
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
                  const meta = parseMeta(p.description);

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

                      {/* Name & SKU */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-start gap-2">
                          <Package className={`w-4 h-4 shrink-0 mt-0.5 ${isFree ? "text-emerald-600" : "text-indigo-600"}`} />
                          <div>
                            <span className="leading-snug">{p.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-slate-400 font-normal">
                              <span>SKU: {p.sku || "—"}</span>
                            </div>
                            {meta.text && (
                              <p className="text-[11px] text-slate-500 font-normal mt-1 leading-relaxed">
                                {meta.text}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {meta.category || "General"}
                        </span>
                      </td>

                      {/* Typical Scope / Unit */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                        {meta.scope || "As scoped"}
                      </td>

                      {/* Status / Chargeability */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {meta.status === "FREE" || isFree ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            FREE
                          </span>
                        ) : meta.status === "INCLUDED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200 uppercase">
                            INCLUDED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                            CHARGEABLE
                          </span>
                        )}
                      </td>

                      {/* Indicative 2026 Market Range */}
                      <td className="py-3.5 px-4 text-slate-600 font-semibold text-xs whitespace-nowrap">
                        {meta.marketRange || "Market Standard"}
                      </td>

                      {/* Goodwin Grow AI Price (yellow background / editable badge) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isFree ? (
                          <span className="font-extrabold text-emerald-700 text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-block">
                            ₹0 Complimentary
                          </span>
                        ) : (
                          <button
                            onClick={() => openEdit(p)}
                            title="Click to edit Goodwin Grow AI price"
                            className="inline-flex items-center gap-1.5 font-extrabold text-amber-950 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 px-3 py-1 rounded-lg text-xs shadow-2xs transition cursor-pointer"
                          >
                            <span>{formatCurrency(price)}</span>
                            <Edit2 className="w-3 h-3 text-amber-800" />
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
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
      {/* Commercial Policy & Scopes Modal */}
      {policyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">Goodwin Grow AI Service Catalogue & Pricing Policy</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    India 2026 Reference
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Internal Team + Client Scope Reference: Define what is free, what is chargeable, indicative market benchmarks, and commercial rules.
                </p>
              </div>
              <button
                onClick={() => setPolicyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 bg-white overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setPolicyTab("POLICY")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                  policyTab === "POLICY"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                1. How Team Uses This
              </button>
              <button
                onClick={() => setPolicyTab("THIRDPARTY")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                  policyTab === "THIRDPARTY"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                4. Third-Party Costs
              </button>
              <button
                onClick={() => setPolicyTab("RULES")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                  policyTab === "RULES"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                5. Commercial Rules
              </button>
              <button
                onClick={() => setPolicyTab("PACKAGES")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                  policyTab === "PACKAGES"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                6. Packages Framework
              </button>
              <button
                onClick={() => setPolicyTab("COMMUNICATION")}
                className={`pb-2.5 px-3 border-b-2 transition cursor-pointer ${
                  policyTab === "COMMUNICATION"
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                7. Client Wording & Sources
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
              {policyTab === "POLICY" && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <h3 className="font-bold text-emerald-950 text-sm">Purpose & Core Directive</h3>
                    <p className="text-emerald-900 leading-relaxed">
                      Define what Goodwin Grow AI provides, what is complimentary/free, what is chargeable, indicative market pricing, and a separate editable Goodwin Grow AI price field.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] uppercase">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        What "FREE" Means
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Initial consultation, onboarding, basic setup or limited support specifically listed as free. <strong>Free does not mean unlimited recurring work.</strong>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-black text-[10px] uppercase">
                        What "CHARGEABLE" Means
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        Recurring management, creative production, strategy, advertising, SEO, development, automation, optimization, e-commerce work, or work outside an approved package.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2">
                    <h4 className="font-bold text-amber-950 text-xs">Pricing Benchmark Snapshot (2026)</h4>
                    <p className="text-amber-900 leading-relaxed text-[11px]">
                      Published 2026 Indian pricing guides show basic social-media packages around ₹8,000–₹35,000/month, broader agency management much higher, local SEO around ₹10,000–₹30,000/month, and performance-ad management as a fixed monthly fee or 10–20% of ad spend. Website projects range widely based on complexity. Therefore, all figures are indicative bands rather than fixed market rates.
                    </p>
                  </div>
                </div>
              )}

              {policyTab === "THIRDPARTY" && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
                    <span className="font-bold text-slate-900">Third-Party Costs Policy:</span> All third-party platform, media, tooling, and infrastructure costs are client-paid unless a formal quotation explicitly says otherwise.
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 text-[11px]">
                          <th className="py-2.5 px-4">Cost Item</th>
                          <th className="py-2.5 px-4">Responsibility & Policy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Meta / Facebook / Instagram ad spend</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays platform/media budget directly or as agreed</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Google Ads / YouTube Ads spend</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays media budget</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Domain registration / renewal</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays registrar directly</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Hosting / cloud / server fees</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays hosting provider (Vercel, AWS, Hostinger, etc.)</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Premium themes, plugins or software</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays license fees</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">AI / API usage charges</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays OpenAI/Anthropic/Google Cloud tokens unless included in written package</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">WhatsApp Business / API conversation charges</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays Meta Cloud API per-conversation tariffs directly</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">CRM / email / SMS platform subscriptions</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays subscription fees</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Influencer / creator fees</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays creators directly</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Stock assets / licensed music / paid fonts</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays where custom licensing is required</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Printing / signage / physical production</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays printing vendor</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Travel / on-location expenses</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays where shoots require travel outside base city</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Marketplace fees / commissions / logistics</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays Amazon/Flipkart commission & fulfillment</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-4 font-semibold text-slate-900">Verification / subscription / platform fees</td>
                          <td className="py-2.5 px-4 text-slate-600">Client pays verification badge or directory fees</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {policyTab === "RULES" && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Recommended Internal Commercial Rules</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">1. Never promise unlimited work</span>
                      <p className="text-slate-500 text-[11px]">Every paid package must explicitly state platforms, post/reel count, revisions, reporting frequency, and exclusions.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">2. Out-of-scope approval</span>
                      <p className="text-slate-500 text-[11px]">Get approval before doing out-of-scope work. Quote it as an add-on or revised package before execution.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">3. Separate ad spend</span>
                      <p className="text-slate-500 text-[11px]">Always keep media spend completely separate from agency management retainers.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">4. No deceptive guarantees</span>
                      <p className="text-slate-500 text-[11px]">Do not guarantee sales, leads, ROAS, followers, SEO rankings, Google verification, or marketplace approvals.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">5. Platform compliance</span>
                      <p className="text-slate-500 text-[11px]">Never buy or fabricate reviews, followers, or engagement. Reputation management must use legitimate feedback.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">6. Client responsibilities</span>
                      <p className="text-slate-500 text-[11px]">Clients must provide timely approvals, accurate business information, required platform access, and brand assets.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">7. Statutory GST transparency</span>
                      <p className="text-slate-500 text-[11px]">State whether GST is included or extra on every quotation and invoice.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">8. Management approved rates</span>
                      <p className="text-slate-500 text-[11px]">Use the Goodwin Grow AI Price column as the internal approved rate. Team members cannot discount without Director approval.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">9. Defined revision limits</span>
                      <p className="text-slate-500 text-[11px]">Define strict revision limits (typically 2 rounds) for designs, videos, websites, and branding projects.</p>
                    </div>
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1 shadow-2xs">
                      <span className="font-bold text-slate-900">10. Written scope sign-off</span>
                      <p className="text-slate-500 text-[11px]">Maintain written scope approval (WhatsApp/email/proposal) before recurring paid work begins.</p>
                    </div>
                  </div>
                </div>
              )}

              {policyTab === "PACKAGES" && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Suggested Goodwin Grow AI Package Framework</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Starter Presence</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">₹10,000 / mo</span>
                      </div>
                      <p className="text-slate-500 text-[11px]"><strong>Best For:</strong> Local / small business</p>
                      <p className="text-slate-600 text-xs">Profile management + limited monthly creatives (8 static creatives/mo, basic GBP updates, monthly review).</p>
                      <span className="text-[10px] text-slate-400">Market Range: ₹8,000–₹15,000/mo</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Social Growth</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">₹22,000 / mo</span>
                      </div>
                      <p className="text-slate-500 text-[11px]"><strong>Best For:</strong> Growing local business</p>
                      <p className="text-slate-600 text-xs">2 platforms + 12 posts + 4 short-form reels + content calendar & community engagement.</p>
                      <span className="text-[10px] text-slate-400">Market Range: ₹15,000–₹30,000/mo</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Social Pro</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">₹38,000 / mo</span>
                      </div>
                      <p className="text-slate-500 text-[11px]"><strong>Best For:</strong> Businesses needing stronger content</p>
                      <p className="text-slate-600 text-xs">Multi-platform + higher reel/content volume (16 posts + 8 motion reels) + monthly strategic reporting.</p>
                      <span className="text-[10px] text-slate-400">Market Range: ₹30,000–₹50,000+/mo</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Local Growth</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">₹28,000 / mo</span>
                      </div>
                      <p className="text-slate-500 text-[11px]"><strong>Best For:</strong> Local lead-focused business</p>
                      <p className="text-slate-600 text-xs">Social media marketing combined with Google Map pack ranking, citation building, and reputation review curation.</p>
                      <span className="text-[10px] text-slate-400">Market Range: ₹20,000–₹45,000+/mo</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Performance Growth</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">₹45,000 / mo</span>
                      </div>
                      <p className="text-slate-500 text-[11px]"><strong>Best For:</strong> Lead & sales campaigns</p>
                      <p className="text-slate-600 text-xs">Organic content + Meta/Google paid ads management. Media budget paid directly by client.</p>
                      <span className="text-[10px] text-slate-400">Market Range: ₹30,000–₹75,000+/mo</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">Custom Growth</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">₹75,000+ / mo</span>
                      </div>
                      <p className="text-slate-500 text-[11px]"><strong>Best For:</strong> E-commerce / advanced clients</p>
                      <p className="text-slate-600 text-xs">Custom mix of SEO, ads, content, web development, WhatsApp CRM automation, and dedicated growth architect.</p>
                      <span className="text-[10px] text-slate-400">Market Range: Custom quotation</span>
                    </div>
                  </div>
                </div>
              )}

              {policyTab === "COMMUNICATION" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 space-y-2">
                    <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wide">Approved Team Communication Wording</h4>
                    <blockquote className="italic text-emerald-900 border-l-4 border-emerald-500 pl-3 py-1 text-[11px] leading-relaxed">
                      “Your initial consultation and the onboarding items specifically mentioned as free are complimentary. Ongoing content creation, social-media management, advertising, SEO, website work, marketplace work, AI automation and other recurring or custom services are chargeable according to the approved package or quotation. Advertising budgets and third-party platform/software costs are separate unless specifically included in writing.”
                    </blockquote>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs">2026 Industry Pricing Benchmark Sources</h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                          <tr>
                            <th className="py-2 px-3">Industry Reference</th>
                            <th className="py-2 px-3">Relevant Benchmark</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-600">
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900">OneCity Technologies (2026)</td>
                            <td className="py-2 px-3">Local SEO ₹15k–₹25k/mo; growth SEO ₹25k–₹50k/mo; enterprise ₹50k–₹1.5L/mo.</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900">upGrowth (2026)</td>
                            <td className="py-2 px-3">India social management spans freelancer/boutique/full-service bands starting ~₹15k/mo.</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900">Epixs (2026)</td>
                            <td className="py-2 px-3">Basic ₹8k–₹15k/mo; standard ₹15k–₹35k/mo; premium ₹35k–₹75k+/mo; ad spend separate.</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900">Preevee (2026)</td>
                            <td className="py-2 px-3">Benchmarks SEO, Google Ads, Meta Ads and websites across freelancer through enterprise tiers.</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900">Sky Loop Agency (2026)</td>
                            <td className="py-2 px-3">Meta/Google Ads management ₹15k–₹45k/mo or percentage; SEO ₹20k–₹60k/mo; websites ₹35k–₹1.5L; WhatsApp chatbot ₹10k–₹25k.</td>
                          </tr>
                          <tr>
                            <td className="py-2 px-3 font-semibold text-slate-900">CoherentLab (2026)</td>
                            <td className="py-2 px-3">Starter SEO ₹8k–₹15k; local SEO ₹10k–₹25k; small-business SEO ₹20k–₹50k.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Goodwin Grow AI © 2026 • Confidential Internal Policy</span>
              <button
                onClick={() => setPolicyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition cursor-pointer"
              >
                Close Policy Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
