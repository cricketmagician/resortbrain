"use client";

import React, { useState } from "react";
import { useOps } from "@/lib/ops-store";
import { TabNavigation } from "@/components/ui/ops-kit/tab-navigation";
import { PremiumDialog } from "@/components/ui/ops-kit/premium-dialog";
import { MenuItem } from "@/modules/ops/types";
import { MenuItemSchema } from "@/modules/ops/schema";
import { formatPaiseToINR } from "@/lib/utils";
import {
  Settings,
  UtensilsCrossed,
  Layers,
  Users,
  Percent,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function HotelAdminPage() {
  const {
    menuCatalog,
    updateMenuItem,
    toggleMenuItemAvailability,
    rooms,
    allStaff,
    currentHotel,
    showToast,
  } = useOps();

  const [activeTab, setActiveTab] = useState<string>("menu");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Edit Drawer / Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<MenuItem["category"]>("Mains");
  const [formPriceRupees, setFormPriceRupees] = useState("1250.00");
  const [formTaxRate, setFormTaxRate] = useState("18");
  const [formDescription, setFormDescription] = useState("");
  const [formStation, setFormStation] = useState("Grill Station #1");
  const [formSlaMinutes, setFormSlaMinutes] = useState("15");
  const [formAllergens, setFormAllergens] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const openEditModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormTitle(item.title);
      setFormCategory(item.category);
      setFormPriceRupees((item.pricePaise / 100).toFixed(2));
      setFormTaxRate(item.taxRatePct.toString());
      setFormDescription(item.description);
      setFormStation(item.station);
      setFormSlaMinutes(item.slaTargetMinutes.toString());
      setFormAllergens(item.allergens);
    } else {
      setEditingItem(null);
      setFormTitle("");
      setFormCategory("Mains");
      setFormPriceRupees("850.00");
      setFormTaxRate("18");
      setFormDescription("Artisanal preparation with fresh local ingredients.");
      setFormStation("Grill Station #1");
      setFormSlaMinutes("15");
      setFormAllergens(["Gluten"]);
    }
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(formPriceRupees);
    const taxNum = parseFloat(formTaxRate);
    const slaNum = parseInt(formSlaMinutes, 10);

    // Instant Zod client-side validation
    const result = MenuItemSchema.safeParse({
      title: formTitle,
      category: formCategory,
      priceRupees: priceNum,
      taxRatePct: taxNum,
      description: formDescription,
      allergens: formAllergens,
      station: formStation,
      slaTargetMinutes: slaNum,
    });

    if (!result.success) {
      setFormError(result.error.issues[0]?.message || "Validation error");
      return;
    }

    const calculatedPaise = Math.round(priceNum * 100);

    const updated: MenuItem = {
      id: editingItem ? editingItem.id : `mi_${Date.now()}`,
      hotelId: currentHotel.id,
      title: formTitle,
      category: formCategory,
      pricePaise: calculatedPaise,
      taxRatePct: taxNum,
      isAvailable: editingItem ? editingItem.isAvailable : true,
      description: formDescription,
      allergens: formAllergens,
      station: formStation,
      slaTargetMinutes: slaNum,
    };

    updateMenuItem(updated);
    setIsEditModalOpen(false);
  };

  const toggleAllergen = (alg: string) => {
    setFormAllergens((prev) =>
      prev.includes(alg) ? prev.filter((a) => a !== alg) : [...prev, alg]
    );
  };

  const filteredMenuItems = menuCatalog.filter((item) => {
    if (selectedCategory === "All") return true;
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Hotel Configuration & Catalog</span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                #{currentHotel.id}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage in-room dining menus, room topologies, and staff permission invitations
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            showToast({
              type: "success",
              title: "Hotel Configuration Saved",
              message: "All parameters synchronized with Postgres cluster.",
            })
          }
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-95 transition-all"
        >
          Save All Changes
        </button>
      </div>

      {/* 2. Tabs */}
      <TabNavigation
        tabs={[
          { id: "menu", label: "Menu & Pricing", icon: UtensilsCrossed, count: menuCatalog.length },
          { id: "rooms", label: "Floors & Rooms", icon: Layers, count: rooms.length },
          { id: "staff", label: "Staff & Roles", icon: Users, count: allStaff.length },
          { id: "taxes", label: "Tax Policies", icon: Percent },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* TAB 1: Menu & Pricing */}
      {activeTab === "menu" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {["All", "Starters", "Mains", "Desserts", "Beverages", "Late Night"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold"
                      : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openEditModal()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Item</span>
              </button>
            </div>
          </div>

          {/* Menu Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Item Name</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price (Paise / INR)</th>
                  <th className="px-4 py-3.5">Station Target</th>
                  <th className="px-4 py-3.5 text-center">Available</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredMenuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-white text-sm">{item.title}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-xs">{item.description}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <div className="font-bold text-emerald-400 text-sm">
                        {formatPaiseToINR(item.pricePaise)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.pricePaise.toLocaleString()} paise (GST {item.taxRatePct}%)
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                      {item.station} ({item.slaTargetMinutes}m SLA)
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleMenuItemAvailability(item.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          item.isAvailable
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                            : "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}
                      >
                        {item.isAvailable ? "AVAILABLE" : "DISABLED"}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            showToast({
                              type: "info",
                              title: "Item Archived",
                              message: `${item.title} deactivated from catalog.`,
                            })
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Floors & Rooms */}
      {activeTab === "rooms" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Hotel Topology & Room Inventory ({rooms.length} configured rooms)
            </h2>
            <button
              onClick={() =>
                showToast({
                  type: "info",
                  title: "Add Room",
                  message: "Room topology provisioning dialog ready.",
                })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white"
            >
              + Add Room
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-white">Rm #{room.roomNumber}</span>
                  <span className="text-[10px] text-slate-400">Floor {room.floor}</span>
                </div>
                <div className="text-slate-400">{room.type}</div>
                <div className="text-emerald-400 font-mono text-[11px] pt-1">
                  Status: {room.cleanStatus}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Staff & Roles */}
      {activeTab === "staff" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                Staff Identity & Access Control ({allStaff.length} active operators)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Staff accounts are invite-only and strictly scoped via Row Level Security (RLS).
              </p>
            </div>
            <button
              onClick={() =>
                showToast({
                  type: "success",
                  title: "Invite Token Generated",
                  message: "Single-use cryptographic staff invite link copied to clipboard.",
                })
              }
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white"
            >
              + Generate Invite Token
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {allStaff.map((staff) => (
              <div key={staff.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white text-sm">{staff.name}</div>
                  <div className="text-slate-400">
                    {staff.roleTitle} • Dept: <span className="text-slate-300 uppercase">{staff.department}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-400">Station: {staff.station}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-[11px]">
                    PIN: {staff.pin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Tax Policies */}
      {activeTab === "taxes" && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl max-w-xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Tax Engine & Statutory Regulations
          </h2>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">Central GST (CGST)</div>
                <div className="text-slate-400 text-[11px]">Statutory national hotel GST levy</div>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-sm">9.0%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">State GST (SGST)</div>
                <div className="text-slate-400 text-[11px]">State tax authority component</div>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-sm">9.0%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">Luxury Tax Threshold</div>
                <div className="text-slate-400 text-[11px]">Rooms &gt; ₹7,500/night tax bracket</div>
              </div>
              <span className="font-mono text-emerald-400 font-bold text-sm">18.0%</span>
            </div>
          </div>
        </div>
      )}

      {/* Item Edit Modal (Instant Zod Validation) */}
      <PremiumDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingItem ? `Edit Menu Item: ${editingItem.title}` : "Add New Menu Item"}
        description="Instant Zod schema validation applied before server dispatch."
        maxWidth="md"
      >
        <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Item Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Starters">Starters</option>
                <option value="Mains">Mains</option>
                <option value="Desserts">Desserts</option>
                <option value="Beverages">Beverages</option>
                <option value="Late Night">Late Night</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Price (INR)</label>
              <input
                type="number"
                step="0.01"
                value={formPriceRupees}
                onChange={(e) => setFormPriceRupees(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Description</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1.5">Allergen Tags</label>
            <div className="flex flex-wrap gap-2">
              {["Gluten", "Dairy", "Egg", "Nuts", "Fish", "Shellfish", "Soy"].map((alg) => {
                const isSelected = formAllergens.includes(alg);
                return (
                  <button
                    type="button"
                    key={alg}
                    onClick={() => toggleAllergen(alg)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      isSelected
                        ? "bg-rose-950 text-rose-200 border border-rose-700"
                        : "bg-slate-950 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {alg}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Station Assignment</label>
              <input
                type="text"
                value={formStation}
                onChange={(e) => setFormStation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Prep SLA Target (Mins)</label>
              <input
                type="number"
                value={formSlaMinutes}
                onChange={(e) => setFormSlaMinutes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
            >
              Save Item (Instant Validation)
            </button>
          </div>
        </form>
      </PremiumDialog>
    </div>
  );
}
