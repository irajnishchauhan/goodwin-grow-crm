"use client";

import React, { useState } from "react";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Package,
  Building2,
  Trash2,
  X,
  Cpu,
  Layers,
  Send,
  Check,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderItem {
  id: string;
  orderNumber: string;
  partnerId: string;
  totalAmount: any;
  status: string;
  erpSyncStatus: string;
  erpOrderRef: string | null;
  items: any;
  deliveryAddress: string | null;
  notes: string | null;
  expectedDate: string | Date | null;
  createdAt: string | Date;
  partner: {
    id: string;
    code: string;
    businessName: string;
    city: string;
    tier: string;
    phone: string;
  };
}

interface OrdersClientViewProps {
  initialOrders: any[];
  partners: Array<{
    id: string;
    code: string;
    businessName: string;
    city: string;
    creditLimit: any;
    outstandingBalance: any;
  }>;
  products: Array<{
    id: string;
    name: string;
    sku: string | null;
    unitPrice: any;
    currency: string;
  }>;
  tenantName: string;
}

export function OrdersClientView({
  initialOrders,
  partners,
  products,
  tenantName,
}: OrdersClientViewProps) {
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Order Form State
  const [selectedPartnerId, setSelectedPartnerId] = useState(partners[0]?.id || "");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [orderLines, setOrderLines] = useState<Array<{ sku: string; name: string; unitPrice: number; quantity: number }>>([
    {
      sku: products[0]?.sku || "GB-PD-1205",
      name: products[0]?.name || "Battery Model",
      unitPrice: Number(products[0]?.unitPrice || 1450),
      quantity: 20,
    },
  ]);

  const addOrderLine = () => {
    const prod = products[0];
    if (prod) {
      setOrderLines((prev) => [
        ...prev,
        {
          sku: prod.sku || "GB-PROD",
          name: prod.name,
          unitPrice: Number(prod.unitPrice),
          quantity: 10,
        },
      ]);
    }
  };

  const removeOrderLine = (index: number) => {
    setOrderLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLineProduct = (index: number, sku: string) => {
    const prod = products.find((p) => p.sku === sku);
    if (prod) {
      setOrderLines((prev) =>
        prev.map((line, i) =>
          i === index
            ? { ...line, sku: prod.sku || sku, name: prod.name, unitPrice: Number(prod.unitPrice) }
            : line
        )
      );
    }
  };

  const updateLineQty = (index: number, qty: number) => {
    setOrderLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, quantity: Math.max(1, qty) } : line))
    );
  };

  const totalCalculated = orderLines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/batteries/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: selectedPartnerId,
          items: orderLines,
          notes: deliveryNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) => [data.data, ...prev]);
        setShowBookModal(false);
        setToastMessage(`Purchase Order ${data.data.orderNumber} successfully booked and queued for ERP sync!`);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        alert(data.error || "Failed to book order");
      }
    } catch (err) {
      console.error(err);
      alert("Error booking order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    setSyncingOrderId(orderId);
    try {
      const res = await fetch("/api/batteries/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: orderId,
          status: "APPROVED",
          triggerErpSync: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "APPROVED", erpSyncStatus: "ERP_CONFIRMED_SYNCED", erpOrderRef: data.data.erpOrderRef } : o))
        );
        setToastMessage(`Order pushed to ERP successfully! Assigned ERP SO Ref: ${data.data.erpOrderRef}`);
        setTimeout(() => setToastMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/batteries/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
        setToastMessage(`Order status updated to ${newStatus.replace("_", " ")}`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(data.error || "Failed to update order status");
      }
    } catch {
      alert("Error updating order status");
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`Are you sure you want to delete order "${orderNumber}"?`)) return;
    try {
      const res = await fetch(`/api/batteries/orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setToastMessage(`Order ${orderNumber} deleted successfully.`);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || "Failed to delete order");
      }
    } catch {
      alert("Error deleting order");
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        (o.erpOrderRef && o.erpOrderRef.toLowerCase().includes(q)) ||
        o.partner.businessName.toLowerCase().includes(q) ||
        o.partner.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = orders.filter((o) => o.status === "PENDING_APPROVAL").length;
  const pendingValue = orders
    .filter((o) => o.status === "PENDING_APPROVAL")
    .reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const dispatchedCount = orders.filter((o) => o.status === "DISPATCHED" || o.status === "DELIVERED").length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl flex items-center justify-between border border-emerald-700 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white font-bold text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md w-fit mb-1 border border-amber-200">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
            <span>Goodwin Batteries Orders & Dispatch Control</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Dealer Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Book stock orders, validate dealer credit limits, and synchronize approvals with the ERP system.
          </p>
        </div>

        <button
          onClick={() => setShowBookModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition shadow-amber-600/20"
        >
          <Plus className="w-4 h-4" />
          Book Dealer Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Approvals</div>
          <div className="text-3xl font-black text-amber-600 mt-2">{pendingCount} Orders</div>
          <div className="text-[11px] text-amber-800 font-semibold mt-1">
            Total Value: {formatCurrency(pendingValue)}
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">ERP Synced & Dispatched</div>
          <div className="text-3xl font-black text-emerald-600 mt-2">{dispatchedCount} Orders</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Dispatched via logistics hub</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders Logged</div>
          <div className="text-3xl font-black text-slate-900 mt-2">{orders.length}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">Across all authorized channels</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, Dealer Name, ERP Reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {["ALL", "PENDING_APPROVAL", "APPROVED", "DISPATCHED", "DELIVERED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "All Orders" : st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Dealer Name</th>
                <th className="py-3 px-4">Items Summary</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">ERP Sync Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.status === "PENDING_APPROVAL";
                  const isSyncing = syncingOrderId === order.id;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {order.orderNumber}
                        <div className="text-[10px] font-normal text-slate-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{order.partner?.businessName}</div>
                        <div className="text-[10px] text-slate-400">
                          {order.partner?.code} • {order.partner?.city}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {Array.isArray(order.items) ? (
                          <div className="space-y-0.5">
                            {order.items.slice(0, 2).map((it: any, idx: number) => (
                              <div key={idx} className="text-[11px]">
                                <span className="font-semibold text-slate-800">{it.sku}</span> × {it.qty || it.quantity} units
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-[10px] text-slate-400">+{order.items.length - 2} more models</div>
                            )}
                          </div>
                        ) : (
                          "Standard battery lot"
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            order.status === "APPROVED" || order.status === "DELIVERED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : order.status === "PENDING_APPROVAL"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {order.erpSyncStatus === "ERP_CONFIRMED_SYNCED" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {order.erpOrderRef || "Synced"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            ERP Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <button
                              onClick={() => handleApproveOrder(order.id)}
                              disabled={isSyncing}
                              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                            >
                              {isSyncing ? "Syncing..." : "Approve & Push"}
                            </button>
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
                            >
                              <option value="APPROVED">APPROVED</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="DISPATCHED">DISPATCHED</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          )}
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            title="Delete Order"
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
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

      {/* Book Dealer Order Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Book Dealer Purchase Order</h3>
                <p className="text-xs text-slate-500">Record an order from an authorized channel partner.</p>
              </div>
              <button onClick={() => setShowBookModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Select Channel Partner *</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.businessName} ({p.code}) • {p.city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Line Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Battery Line Items
                  </span>
                  <button
                    type="button"
                    onClick={addOrderLine}
                    className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Battery Model
                  </button>
                </div>

                <div className="space-y-2">
                  {orderLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <select
                          value={line.sku}
                          onChange={(e) => updateLineProduct(idx, e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                        >
                          {products.map((p) => (
                            <option key={p.sku || p.id} value={p.sku || p.name}>
                              {p.name} ({p.sku || "N/A"}) - ₹{p.unitPrice}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={(e) => updateLineQty(idx, parseInt(e.target.value) || 1)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold"
                        />
                      </div>

                      <div className="w-28 text-right font-black text-slate-900">
                        {formatCurrency(line.unitPrice * line.quantity)}
                      </div>

                      {orderLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOrderLine(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3.5 bg-amber-50 rounded-2xl border border-amber-200 font-bold">
                  <span className="text-amber-900">Total Order Booking Value:</span>
                  <span className="text-base font-black text-amber-900">
                    {formatCurrency(totalCalculated)}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Delivery & Dispatch Notes</label>
                <textarea
                  rows={2}
                  placeholder="Dispatch instructions, preferred freight carrier..."
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Booking Order..." : "Confirm Purchase Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
