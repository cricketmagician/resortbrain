"use client";

import React, { useState, useMemo } from "react";
import { useOps } from "@/lib/ops-store";
import { StaffMember, Department, UserRole } from "@/modules/ops/types";
import { PremiumDialog } from "@/components/ui/ops-kit/premium-dialog";
import { DataTable } from "@/components/ui/ops-kit/data-table";
import { ColumnDef } from "@tanstack/react-table";
import {
  Users,
  UserPlus,
  UserCheck,
  Shield,
  Clock,
  MapPin,
  Phone,
  Mail,
  Award,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Send,
  Building2,
  Calendar,
  Layers,
  UtensilsCrossed,
  ConciergeBell,
  BedDouble,
  Wrench,
  Wine,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Activity,
  Briefcase,
  Star,
  Check,
} from "lucide-react";

export default function StaffManagementPage() {
  const {
    allStaff,
    currentStaff,
    currentHotel,
    switchStaffWithPin,
    addStaffMember,
    updateStaffMember,
    updateStaffStatus,
    dispatchStaffTask,
    showToast,
  } = useOps();

  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState<"directory" | "schedule" | "leaderboard">("directory");
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedShift, setSelectedShift] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeMember, setActiveMember] = useState<StaffMember | null>(null);

  // Add Form State
  const [addName, setAddName] = useState("");
  const [addDept, setAddDept] = useState<Department>("kitchen");
  const [addRole, setAddRole] = useState<UserRole>("line_cook");
  const [addRoleTitle, setAddRoleTitle] = useState("");
  const [addStation, setAddStation] = useState("");
  const [addShift, setAddShift] = useState("Morning A");
  const [addPin, setAddPin] = useState("1234");
  const [addPhone, setAddPhone] = useState("+91 98201 44000");
  const [addEmail, setAddEmail] = useState("");
  const [addCertifications, setAddCertifications] = useState("HACCP Food Safety, First Aid");
  const [addEmergency, setAddEmergency] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  // Dispatch Form State
  const [dispatchTitle, setDispatchTitle] = useState("Priority Guest Service Request - Room 402");
  const [dispatchNotes, setDispatchNotes] = useState("Urgent turnaround needed within 10 minutes.");
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Edit Form State
  const [editStation, setEditStation] = useState("");
  const [editShift, setEditShift] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoleTitle, setEditRoleTitle] = useState("");

  // Department metadata for colors and icons
  const deptMeta: Record<
    Department,
    { label: string; icon: React.ComponentType<{ className?: string }>; color: string; badge: string }
  > = {
    kitchen: {
      label: "Kitchen & Culinary",
      icon: UtensilsCrossed,
      color: "emerald",
      badge: "bg-emerald-950 text-emerald-300 border-emerald-800",
    },
    desk: {
      label: "Front Desk & Concierge",
      icon: ConciergeBell,
      color: "indigo",
      badge: "bg-indigo-950 text-indigo-300 border-indigo-800",
    },
    housekeeping: {
      label: "Housekeeping & Linens",
      icon: BedDouble,
      color: "teal",
      badge: "bg-teal-950 text-teal-300 border-teal-800",
    },
    maintenance: {
      label: "Engineering & Facilities",
      icon: Wrench,
      color: "amber",
      badge: "bg-amber-950 text-amber-300 border-amber-800",
    },
    "f&b": {
      label: "Dining & Beverage",
      icon: Wine,
      color: "purple",
      badge: "bg-purple-950 text-purple-300 border-purple-800",
    },
    security: {
      label: "Security & Safety",
      icon: ShieldAlert,
      color: "rose",
      badge: "bg-rose-950 text-rose-300 border-rose-800",
    },
    admin: {
      label: "Executive Management",
      icon: Shield,
      color: "blue",
      badge: "bg-blue-950 text-blue-300 border-blue-800",
    },
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return allStaff.filter((staff) => {
      if (selectedDept !== "ALL" && staff.department !== selectedDept) return false;
      if (selectedStatus !== "ALL" && staff.status !== selectedStatus) return false;
      if (selectedShift !== "ALL" && staff.shift !== selectedShift) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          staff.name.toLowerCase().includes(q) ||
          staff.roleTitle.toLowerCase().includes(q) ||
          staff.station.toLowerCase().includes(q) ||
          staff.department.toLowerCase().includes(q) ||
          (staff.phone && staff.phone.includes(q))
        );
      }
      return true;
    });
  }, [allStaff, selectedDept, selectedStatus, selectedShift, searchQuery]);

  // Aggregated live counts
  const totalCount = allStaff.length;
  const onDutyCount = allStaff.filter((s) => s.status === "on_duty").length;
  const inTaskCount = allStaff.filter((s) => s.status === "in_task").length;
  const onBreakCount = allStaff.filter((s) => s.status === "on_break").length;
  const offDutyCount = allStaff.filter((s) => s.status === "off_duty").length;

  // Handle Quick Switch Operator Terminal
  const handleQuickSwitch = (staff: StaffMember) => {
    const success = switchStaffWithPin(staff.id, staff.pin);
    if (success) {
      showToast({
        type: "success",
        title: "Terminal Operator Active",
        message: `Now operating workstation as ${staff.name} (${staff.roleTitle}).`,
      });
    }
  };

  // Open Edit Modal
  const openEditModal = (staff: StaffMember) => {
    setActiveMember(staff);
    setEditStation(staff.station);
    setEditShift(staff.shift);
    setEditPhone(staff.phone || "");
    setEditRoleTitle(staff.roleTitle);
    setIsEditModalOpen(true);
  };

  // Open Dispatch Modal
  const openDispatchModal = (staff: StaffMember) => {
    setActiveMember(staff);
    setDispatchTitle(`Priority Task for ${staff.department.toUpperCase()}`);
    setDispatchNotes("");
    setDispatchError(null);
    setIsDispatchModalOpen(true);
  };

  // Submit Add Staff
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addName.trim()) {
      setAddError("Staff member full name is required.");
      return;
    }
    if (!addRoleTitle.trim()) {
      setAddError("Official role title is required.");
      return;
    }
    if (!addStation.trim()) {
      setAddError("Station assignment is required.");
      return;
    }
    if (addPin.length !== 4 || isNaN(Number(addPin))) {
      setAddError("Terminal PIN must be a 4-digit number.");
      return;
    }

    addStaffMember({
      hotelId: currentHotel.id,
      name: addName.trim(),
      role: addRole,
      roleTitle: addRoleTitle.trim(),
      department: addDept,
      station: addStation.trim(),
      shift: addShift,
      pin: addPin,
      phone: addPhone.trim() || undefined,
      email: addEmail.trim() || `${addName.toLowerCase().replace(/\s+/g, ".")}@grandazure.com`,
      status: "on_duty",
      rating: 5.0,
      activeTasks: 0,
      certifications: addCertifications
        ? addCertifications.split(",").map((c) => c.trim())
        : ["Standard Hospitality Onboarding"],
      emergencyContact: addEmergency.trim() || undefined,
    });

    setIsAddModalOpen(false);
    // Reset form
    setAddName("");
    setAddRoleTitle("");
    setAddStation("");
  };

  // Submit Edit Staff
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;

    updateStaffMember({
      ...activeMember,
      station: editStation.trim() || activeMember.station,
      shift: editShift || activeMember.shift,
      phone: editPhone.trim() || activeMember.phone,
      roleTitle: editRoleTitle.trim() || activeMember.roleTitle,
    });

    setIsEditModalOpen(false);
  };

  // Submit Task Dispatch
  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMember) return;
    if (!dispatchTitle.trim()) {
      setDispatchError("Task title is required.");
      return;
    }

    dispatchStaffTask(activeMember.id, dispatchTitle.trim(), activeMember.department);
    setIsDispatchModalOpen(false);
  };

  // Table Column Definitions for Table View
  const tableColumns: ColumnDef<StaffMember>[] = [
    {
      accessorKey: "name",
      header: "Staff Member",
      cell: ({ row }) => {
        const staff = row.original;
        const isCurrent = currentStaff.id === staff.id;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-xs text-white border border-slate-700/60 shadow-sm flex-shrink-0">
              {staff.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>{staff.name}</span>
                {isCurrent && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    TERMINAL OPERATOR
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">{staff.roleTitle}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department & Station",
      cell: ({ row }) => {
        const dept = row.original.department;
        const meta = deptMeta[dept];
        const Icon = meta?.icon || Users;
        return (
          <div className="space-y-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${meta?.badge}`}>
              <Icon className="w-3 h-3" />
              <span className="uppercase">{dept}</span>
            </span>
            <div className="text-xs text-slate-300 font-mono flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{row.original.station}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "shift",
      header: "Shift Window",
      cell: ({ row }) => (
        <span className="text-xs font-mono text-slate-300 bg-slate-800 px-2 py-1 rounded">
          {row.original.shift}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Duty Status",
      cell: ({ row }) => {
        const status = row.original.status || "on_duty";
        const statusStyles = {
          on_duty: "bg-emerald-950 text-emerald-300 border-emerald-800",
          in_task: "bg-indigo-950 text-indigo-300 border-indigo-800 animate-pulse",
          on_break: "bg-amber-950 text-amber-300 border-amber-800",
          off_duty: "bg-slate-800 text-slate-400 border-slate-700",
        }[status];
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyles}`}>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === "on_duty"
                  ? "bg-emerald-400"
                  : status === "in_task"
                  ? "bg-indigo-400"
                  : status === "on_break"
                  ? "bg-amber-400"
                  : "bg-slate-500"
              }`}
            />
            <span>{status.replace("_", " ").toUpperCase()}</span>
          </span>
        );
      },
    },
    {
      accessorKey: "activeTasks",
      header: "Tasks / Rating",
      cell: ({ row }) => (
        <div className="text-xs font-mono space-y-0.5">
          <div className="text-slate-200">
            Tasks: <span className="font-bold text-emerald-400">{row.original.activeTasks ?? 0}</span>
          </div>
          <div className="text-amber-400 flex items-center gap-1 text-[11px]">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{row.original.rating ?? 4.9}</span>
          </div>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const staff = row.original;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleQuickSwitch(staff)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition-colors"
              title="Authenticate terminal as this operator"
            >
              PIN Login
            </button>
            <button
              onClick={() => openDispatchModal(staff)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Dispatch urgent task"
            >
              Dispatch
            </button>
            <button
              onClick={() => openEditModal(staff)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Edit Station & Shift"
            >
              Edit
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40 flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Staff Management System & Roster
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                All Departments
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-department shift rosters, station coverage, task dispatches, and quick operator credential switching.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Quick Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab("directory")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "directory"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Directory & Roster
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "schedule"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Station Coverage
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === "leaderboard"
                  ? "bg-slate-800 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Velocity & Rating
            </button>
          </div>

          {/* Add Staff Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* 2. Real-time Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-slate-400 font-sans">Total Headcount</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalCount} Staff</div>
          </div>
          <Users className="w-5 h-5 text-slate-500" />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-slate-400 font-sans">On Duty Now</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{onDutyCount} Active</div>
          </div>
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-slate-400 font-sans">In Task / Dispatched</div>
            <div className="text-xl font-bold text-indigo-400 mt-0.5">{inTaskCount} Deployed</div>
          </div>
          <Send className="w-5 h-5 text-indigo-400" />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-slate-400 font-sans">On Break</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{onBreakCount} Paused</div>
          </div>
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3.5 flex items-center justify-between col-span-2 sm:col-span-1 shadow-sm">
          <div>
            <div className="text-slate-400 font-sans">Off Duty</div>
            <div className="text-xl font-bold text-slate-400 mt-0.5">{offDutyCount} Roster</div>
          </div>
          <Briefcase className="w-5 h-5 text-slate-500" />
        </div>
      </div>

      {/* TAB 1: DIRECTORY & ROSTER */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Department Filter Tabs & Search Controls */}
          <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            {/* Department Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium mr-1 flex-shrink-0">Places:</span>
              <button
                onClick={() => setSelectedDept("ALL")}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  selectedDept === "ALL"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                All Places ({allStaff.length})
              </button>

              {(Object.keys(deptMeta) as Department[]).map((dept) => {
                const meta = deptMeta[dept];
                const Icon = meta.icon;
                const count = allStaff.filter((s) => s.department === dept).length;
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                      selectedDept === dept
                        ? `${meta.badge} shadow-sm border font-bold`
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                    <span className="text-[10px] font-mono opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Filters: Status, Shift, Search, View Mode */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status Filter */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="on_duty">On Duty ({onDutyCount})</option>
                    <option value="in_task">In Task ({inTaskCount})</option>
                    <option value="on_break">On Break ({onBreakCount})</option>
                    <option value="off_duty">Off Duty ({offDutyCount})</option>
                  </select>
                </div>

                {/* Shift Filter */}
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
                  <span className="text-slate-500 font-medium">Shift:</span>
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Shifts</option>
                    <option value="Morning A">Morning A</option>
                    <option value="Day Shift">Day Shift</option>
                    <option value="Evening B">Evening B</option>
                    <option value="Night B">Night B</option>
                    <option value="24/7">24/7 / All Shifts</option>
                  </select>
                </div>
              </div>

              {/* Search Box & View Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search staff, station, role..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400"
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* VIEW: GRID CARDS */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map((staff) => {
                const meta = deptMeta[staff.department];
                const DeptIcon = meta?.icon || Users;
                const isCurrentOperator = currentStaff.id === staff.id;
                const status = staff.status || "on_duty";

                return (
                  <div
                    key={staff.id}
                    className={`rounded-2xl border bg-slate-900/90 p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all duration-200 hover:border-slate-700 ${
                      isCurrentOperator
                        ? "border-emerald-500/70 shadow-emerald-950/20 ring-1 ring-emerald-500/30"
                        : "border-slate-800"
                    }`}
                  >
                    {/* Top Row: Avatar, Name, Department Badge */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center font-bold text-sm text-white border border-slate-700 shadow-inner flex-shrink-0">
                            {staff.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-white">{staff.name}</h3>
                              {isCurrentOperator && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  ACTIVE WORKSTATION
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 font-medium">{staff.roleTitle}</p>
                          </div>
                        </div>

                        {/* Status Chip */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              status === "on_duty"
                                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                                : status === "in_task"
                                ? "bg-indigo-950 text-indigo-300 border-indigo-800 animate-pulse"
                                : status === "on_break"
                                ? "bg-amber-950 text-amber-300 border-amber-800"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                status === "on_duty"
                                  ? "bg-emerald-400"
                                  : status === "in_task"
                                  ? "bg-indigo-400"
                                  : status === "on_break"
                                  ? "bg-amber-400"
                                  : "bg-slate-500"
                              }`}
                            />
                            <span>{status.replace("_", " ").toUpperCase()}</span>
                          </span>

                          <span className={`inline-flex items-center gap-1 px-2 py-0.2 rounded text-[10px] font-semibold border ${meta?.badge}`}>
                            <DeptIcon className="w-3 h-3" />
                            <span className="uppercase">{staff.department}</span>
                          </span>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1 text-slate-500 font-sans">
                            <MapPin className="w-3 h-3" /> Station:
                          </span>
                          <span className="text-slate-200 font-semibold">{staff.station}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1 text-slate-500 font-sans">
                            <Calendar className="w-3 h-3" /> Shift:
                          </span>
                          <span className="text-slate-300">{staff.shift}</span>
                        </div>

                        {staff.phone && (
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="flex items-center gap-1 text-slate-500 font-sans">
                              <Phone className="w-3 h-3" /> Direct:
                            </span>
                            <span className="text-slate-300">{staff.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800/60 text-[11px]">
                          <span className="text-slate-500 font-sans">Tasks / Rating:</span>
                          <span className="text-slate-200 flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">{staff.activeTasks || 0} active</span>
                            <span>•</span>
                            <span className="text-amber-400 flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {staff.rating || 4.9}
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[11px]">
                          <span className="text-slate-500 font-sans">Terminal PIN:</span>
                          <span className="text-emerald-400 font-mono font-bold tracking-wider">
                            **** (Click Login to use {staff.pin})
                          </span>
                        </div>
                      </div>

                      {/* Certifications & Badges */}
                      {staff.certifications && staff.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {staff.certifications.map((cert, cIdx) => (
                            <span
                              key={cIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              <Award className="w-2.5 h-2.5 text-amber-400" />
                              <span>{cert}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                        <button
                          onClick={() => handleQuickSwitch(staff)}
                          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Switch Operator</span>
                        </button>

                        <button
                          onClick={() => openDispatchModal(staff)}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Dispatch Task</span>
                        </button>
                      </div>

                      {/* Quick Status Toggle Dropdown Strip */}
                      <div className="flex items-center justify-between gap-1 text-[11px] pt-1">
                        <span className="text-slate-500">Change Status:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => updateStaffStatus(staff.id, "on_duty")}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              status === "on_duty" ? "bg-emerald-950 text-emerald-300 font-bold" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Duty
                          </button>
                          <button
                            onClick={() => updateStaffStatus(staff.id, "in_task")}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              status === "in_task" ? "bg-indigo-950 text-indigo-300 font-bold" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Task
                          </button>
                          <button
                            onClick={() => updateStaffStatus(staff.id, "on_break")}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              status === "on_break" ? "bg-amber-950 text-amber-300 font-bold" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Break
                          </button>
                          <button
                            onClick={() => updateStaffStatus(staff.id, "off_duty")}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              status === "off_duty" ? "bg-slate-800 text-slate-300 font-bold" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Off
                          </button>
                          <button
                            onClick={() => openEditModal(staff)}
                            className="ml-1 text-slate-400 hover:text-slate-200 underline text-[10px]"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: DATA TABLE */}
          {viewMode === "table" && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
              <DataTable
                columns={tableColumns}
                data={filteredStaff}
                searchPlaceholder="Search staff roster..."
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STATION COVERAGE & SHIFT MATRIX */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>24-Hour Station Manning &amp; Coverage Grid</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Ensure minimum required headcount across Hot Line, Front Desk, Floor 2/3 Housekeeping, and Central Engineering.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full">
                100% Core Stations Staffed
              </span>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead className="bg-slate-900/95 border-b border-slate-800 text-slate-400 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="px-4 py-3">Station / Placement</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Morning A (06:00 - 14:00)</th>
                    <th className="px-4 py-3">Day Shift (09:00 - 17:00)</th>
                    <th className="px-4 py-3">Evening B (14:00 - 22:00)</th>
                    <th className="px-4 py-3">Night B (22:00 - 06:00)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono text-slate-300">
                  {[
                    { station: "Hot Line #2 & Grill", dept: "kitchen", morning: "Marcus Vance, Marco Pierre", day: "Amara Patel", evening: "Marco Pierre", night: "On-Call Sous" },
                    { station: "Front Desk Counter 1", dept: "desk", morning: "Elena Garcia", day: "Elena Garcia, Pooja S.", evening: "Pooja Singhania", night: "David Chen" },
                    { station: "Floor 2 & 3 Dispatch", dept: "housekeeping", morning: "Rosa Martinez", day: "Rosa Martinez, Juan Kim", evening: "Sunita Roy", night: "Night HK Lead" },
                    { station: "Central Facilities & HVAC", dept: "maintenance", morning: "Vikram Malhotra", day: "Liam O'Connor", evening: "Vikram Malhotra", night: "Emergency Duty Tech" },
                    { station: "Azure Horizon Dining", dept: "f&b", morning: "Breakfast Captain", day: "Chloe Dupont", evening: "Chloe Dupont (Sommelier)", night: "In-Room Dining Runner" },
                    { station: "Security Command Deck", dept: "security", morning: "CCTV Operator", day: "Patrol Guard 1", evening: "Patrol Guard 2", night: "Capt. Tariq Al-Mansoor" },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white font-sans">
                        {row.station}
                      </td>
                      <td className="px-4 py-3">
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {row.dept}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-medium">{row.morning}</td>
                      <td className="px-4 py-3 text-indigo-400 font-medium">{row.day}</td>
                      <td className="px-4 py-3 text-amber-400 font-medium">{row.evening}</td>
                      <td className="px-4 py-3 text-rose-400 font-medium">{row.night}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VELOCITY & RATING LEADERBOARD */}
      {activeTab === "leaderboard" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Operator Velocity &amp; Guest Service Benchmark</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Real-time SLA resolution velocity, customer satisfaction indices, and shift throughput metrics.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allStaff.map((staff, idx) => (
                <div
                  key={staff.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white">{staff.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {staff.roleTitle} • {staff.department.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right font-mono">
                    <div>
                      <div className="text-emerald-400 font-bold">{staff.activeTasks || 0} Tasks Done</div>
                      <div className="text-[10px] text-slate-500 font-sans">Avg Time: 8.2 mins</div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 font-bold text-sm bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/25">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{staff.rating || 4.9}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW STAFF MEMBER */}
      <PremiumDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Onboard New Staff Member"
        description="Assign station, shift, 4-digit terminal PIN, and security clearance."
        maxWidth="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
          {addError && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. Arjun Kapoor"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Department Place *</label>
              <select
                value={addDept}
                onChange={(e) => setAddDept(e.target.value as Department)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="kitchen">Kitchen & Culinary</option>
                <option value="desk">Front Desk & Concierge</option>
                <option value="housekeeping">Housekeeping & Linens</option>
                <option value="maintenance">Engineering & Maintenance</option>
                <option value="f&b">Food & Beverage (Dining)</option>
                <option value="security">Security & Patrol</option>
                <option value="admin">Executive Administration</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Official Role Title *</label>
              <input
                type="text"
                value={addRoleTitle}
                onChange={(e) => setAddRoleTitle(e.target.value)}
                placeholder="e.g. Senior Line Cook / Turndown Lead"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Station Placement *</label>
              <input
                type="text"
                value={addStation}
                onChange={(e) => setAddStation(e.target.value)}
                placeholder="e.g. Hot Line #3 / Floor 3 West"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Shift Window *</label>
              <select
                value={addShift}
                onChange={(e) => setAddShift(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Morning A">Morning A (06:00 - 14:00)</option>
                <option value="Day Shift">Day Shift (09:00 - 17:00)</option>
                <option value="Evening B">Evening B (14:00 - 22:00)</option>
                <option value="Night B">Night B (22:00 - 06:00)</option>
                <option value="24/7">24/7 / On-Call</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Terminal PIN (4-Digits) *</label>
              <input
                type="password"
                maxLength={4}
                value={addPin}
                onChange={(e) => setAddPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono tracking-widest text-center focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Contact Phone</label>
              <input
                type="text"
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
                placeholder="+91 98201 ..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Certifications &amp; Skills</label>
            <input
              type="text"
              value={addCertifications}
              onChange={(e) => setAddCertifications(e.target.value)}
              placeholder="e.g. ServSafe, First Aid, Opera PMS"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
            >
              Confirm &amp; Onboard Staff
            </button>
          </div>
        </form>
      </PremiumDialog>

      {/* MODAL 2: DISPATCH URGENT TASK */}
      <PremiumDialog
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title={activeMember ? `Dispatch Task to ${activeMember.name}` : "Dispatch Task"}
        description={`Direct operational dispatch for ${activeMember?.department?.toUpperCase()} station: ${activeMember?.station}.`}
        maxWidth="md"
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4 text-xs">
          {dispatchError && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Task Title / Work Order</label>
            <input
              type="text"
              value={dispatchTitle}
              onChange={(e) => setDispatchTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Incident Notes / Instructions</label>
            <textarea
              rows={3}
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
              placeholder="Provide context, room access instructions, or allergen alerts..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all active:scale-95"
            >
              Dispatch Immediately
            </button>
          </div>
        </form>
      </PremiumDialog>

      {/* MODAL 3: EDIT STATION & SHIFT */}
      <PremiumDialog
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={activeMember ? `Edit Staff Profile: ${activeMember.name}` : "Edit Staff"}
        description="Update station placement, assigned shift, and contact details."
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold mb-1">Role Title</label>
            <input
              type="text"
              value={editRoleTitle}
              onChange={(e) => setEditRoleTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Station Placement</label>
            <input
              type="text"
              value={editStation}
              onChange={(e) => setEditStation(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Shift</label>
            <select
              value={editShift}
              onChange={(e) => setEditShift(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Morning A">Morning A</option>
              <option value="Day Shift">Day Shift</option>
              <option value="Evening B">Evening B</option>
              <option value="Night B">Night B</option>
              <option value="24/7">24/7 / All Shifts</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Phone Number</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </PremiumDialog>
    </div>
  );
}
