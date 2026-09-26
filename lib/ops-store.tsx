"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  HotelTenant,
  StaffMember,
  KitchenTicket,
  RoomRecord,
  ServiceRequest,
  StayFolio,
  DeviceConfig,
  AuditLogItem,
  MenuItem,
  SlaEscalationAlert,
} from "@/modules/ops/types";
import {
  SEED_HOTELS,
  SEED_STAFF,
  INITIAL_KITCHEN_TICKETS,
  INITIAL_ROOMS,
  INITIAL_SERVICE_REQUESTS,
  INITIAL_FOLIOS,
  INITIAL_DEVICE_CONFIG,
  INITIAL_AUDIT_LOGS,
  INITIAL_MENU_CATALOG,
  INITIAL_SLA_ALERTS,
} from "@/db/seed/ops/seed-data";
import { kitchenAudioEngine } from "@/lib/audio-engine";

interface ToastNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

interface OpsContextType {
  // Tenant & Identity
  currentHotel: HotelTenant;
  allHotels: HotelTenant[];
  switchHotel: (hotelId: string) => void;
  currentStaff: StaffMember;
  allStaff: StaffMember[];
  switchStaffWithPin: (staffId: string, pin: string) => boolean;

  // Realtime & Connectivity
  isSoundMuted: boolean;
  toggleSound: () => void;
  latencyMs: number;
  isSimulatedOffline: boolean;
  toggleOffline: () => void;
  simulateRaceConditionConflict: boolean;
  setSimulateRaceConditionConflict: (val: boolean) => void;

  // Theme (Dark / Light)
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Sharp Hardware Buzzer
  isBuzzerRinging: boolean;
  silenceBuzzer: () => void;
  triggerBuzzerDemo: () => void;

  // Core Ops States
  kitchenTickets: KitchenTicket[];
  rooms: RoomRecord[];
  serviceRequests: ServiceRequest[];
  folios: StayFolio[];
  menuCatalog: MenuItem[];
  auditLogs: AuditLogItem[];
  deviceConfig: DeviceConfig;
  slaAlerts: SlaEscalationAlert[];

  // Optimistic Mutations
  acceptTicket: (ticketId: string) => Promise<boolean>;
  rejectOrHoldTicket: (ticketId: string, reason?: string) => Promise<boolean>;
  startPrepTicket: (ticketId: string) => Promise<boolean>;
  readyTicket: (ticketId: string) => Promise<boolean>;
  simulateIncomingOrder: () => void;
  simulateIncomingServiceRequest: () => void;

  updateRoomStatus: (roomId: string, newStatus: RoomRecord["cleanStatus"]) => void;
  acceptServiceRequest: (requestId: string) => void;
  completeServiceRequest: (requestId: string) => void;

  addFolioAdjustment: (
    folioId: string,
    adjustmentType: "discount" | "charge",
    amountPaise: number,
    reasonCategory: string,
    mandatoryNote: string,
    managerKey: string
  ) => boolean;

  updateMenuItem: (item: MenuItem) => void;
  toggleMenuItemAvailability: (itemId: string) => void;

  dismissSlaAlert: (alertId: string, reason: string) => void;
  reassignSlaAlert: (alertId: string, staffName: string) => void;

  suspendTenant: (tenantId: string) => void;

  // Feedback & Toasts
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  showToast: (toast: Omit<ToastNotification, "id">) => void;

  // Cross-tenant simulated security check
  hasTenantAccess: (requestedHotelId: string) => boolean;
}

const OpsContext = createContext<OpsContextType | undefined>(undefined);

export function OpsProvider({ children }: { children: React.ReactNode }) {
  const [currentHotel, setCurrentHotel] = useState<HotelTenant>(SEED_HOTELS[0]);
  const [allHotels, setAllHotels] = useState<HotelTenant[]>(SEED_HOTELS);
  const [currentStaff, setCurrentStaff] = useState<StaffMember>(SEED_STAFF[0]);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [latencyMs, setLatencyMs] = useState(24);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [simulateRaceConditionConflict, setSimulateRaceConditionConflict] = useState(false);

  // Operational State Collections
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>(INITIAL_KITCHEN_TICKETS);
  const [rooms, setRooms] = useState<RoomRecord[]>(INITIAL_ROOMS);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>(INITIAL_SERVICE_REQUESTS);
  const [folios, setFolios] = useState<StayFolio[]>(INITIAL_FOLIOS);
  const [menuCatalog, setMenuCatalog] = useState<MenuItem[]>(INITIAL_MENU_CATALOG);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);
  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>(INITIAL_DEVICE_CONFIG);
  const [slaAlerts, setSlaAlerts] = useState<SlaEscalationAlert[]>(INITIAL_SLA_ALERTS);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isBuzzerRinging, setIsBuzzerRinging] = useState<boolean>(false);

  // Synchronize theme with localStorage and document class
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("resortbrain_theme") as "dark" | "light" | null;
    const initialTheme = saved === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(initialTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("resortbrain_theme", next);
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(next);
      }
      return next;
    });
  }, []);

  // Listen to hardware buzzer state changes
  useEffect(() => {
    const unsub = kitchenAudioEngine.subscribeBuzzerState((active) => {
      setIsBuzzerRinging(active);
    });
    return unsub;
  }, []);

  const silenceBuzzer = useCallback(() => {
    kitchenAudioEngine.silenceBuzzer();
    setIsBuzzerRinging(false);
  }, []);

  const triggerBuzzerDemo = useCallback(() => {
    kitchenAudioEngine.startBuzzer("manual_sim_test");
    kitchenAudioEngine.playSharpBuzzerPulse();
  }, []);

  const showToast = useCallback((toast: Omit<ToastNotification, "id">) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleSound = useCallback(() => {
    setIsSoundMuted((prev) => {
      const next = !prev;
      kitchenAudioEngine.setMuted(next);
      return next;
    });
  }, []);

  const toggleOffline = useCallback(() => {
    setIsSimulatedOffline((prev) => !prev);
  }, []);

  // Multi-tenant check
  const hasTenantAccess = useCallback(
    (requestedHotelId: string) => {
      if (currentStaff.role === "super_admin") return true;
      return requestedHotelId === currentHotel.id;
    },
    [currentStaff.role, currentHotel.id]
  );

  const switchHotel = useCallback(
    (hotelId: string) => {
      const target = allHotels.find((h) => h.id === hotelId);
      if (target) {
        setCurrentHotel(target);
        showToast({
          type: "info",
          title: "Tenant Switched",
          message: `Active hotel workspace set to ${target.name} (#${target.id})`,
        });
      }
    },
    [allHotels, showToast]
  );

  const switchStaffWithPin = useCallback(
    (staffId: string, pin: string): boolean => {
      const target = SEED_STAFF.find((s) => s.id === staffId);
      if (!target) return false;
      if (target.pin !== pin) {
        showToast({
          type: "error",
          title: "Invalid PIN Code",
          message: "The entered PIN does not match the staff credential record.",
        });
        return false;
      }
      setCurrentStaff(target);
      setDeviceConfig((prev) => ({
        ...prev,
        currentOperator: `${target.name} (${target.roleTitle})`,
      }));
      showToast({
        type: "success",
        title: "Shift Operator Switched",
        message: `Welcome, ${target.name}. Station profile active.`,
      });
      return true;
    },
    [showToast]
  );

  // Optimistic Kitchen Ticket Mutations with Concurrency Conflict Simulation
  const acceptTicket = useCallback(
    async (ticketId: string): Promise<boolean> => {
      const ticket = kitchenTickets.find((t) => t.id === ticketId);
      if (!ticket) return false;

      // Stop buzzer for this ticket immediately upon acceptance
      kitchenAudioEngine.stopBuzzer(ticketId);

      // 1. Optimistic transition
      const previousState = [...kitchenTickets];
      setKitchenTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: "accepted", acceptedBy: currentStaff.name, acceptedAt: new Date().toISOString() }
            : t
        )
      );

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 2. Concurrency Conflict Simulation Check
      if (simulateRaceConditionConflict) {
        // Rollback state
        setKitchenTickets(previousState);
        kitchenAudioEngine.playConflictAlert();
        showToast({
          type: "error",
          title: "409 Conflict: Task Already Locked",
          message: `Ticket ${ticket.ticketNumber} was accepted by Chef Marco 0.4s ago. State rolled back gracefully.`,
        });
        return false;
      }

      // Record in immutable audit log
      const newAudit: AuditLogItem = {
        id: `aud_${Date.now()}`,
        hotelId: currentHotel.id,
        timestamp: new Date().toISOString(),
        actorId: currentStaff.id,
        actorName: `${currentStaff.name} (${currentStaff.roleTitle})`,
        eventType: "order.accepted",
        entityTarget: `${ticket.ticketNumber} (Room ${ticket.roomNumber})`,
        ipAddress: "192.241.14.82",
        traceId: `tr_${Math.random().toString(36).substr(2, 8)}`,
        payload: {
          ticketId,
          room: ticket.roomNumber,
          acceptedBy: currentStaff.name,
          timestamp: new Date().toISOString(),
        },
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      showToast({
        type: "success",
        title: "Ticket Accepted",
        message: `Ticket ${ticket.ticketNumber} assigned to your station. Buzzer silenced.`,
      });
      return true;
    },
    [kitchenTickets, currentStaff, simulateRaceConditionConflict, currentHotel.id, showToast]
  );

  const rejectOrHoldTicket = useCallback(
    async (ticketId: string, reason?: string): Promise<boolean> => {
      const ticket = kitchenTickets.find((t) => t.id === ticketId);
      if (!ticket) return false;

      // Immediately stop the sharp buzzer for this ticket
      kitchenAudioEngine.stopBuzzer(ticketId);

      setKitchenTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? { ...t, status: "cancelled", note: `HOLD / REJECTED: ${reason || "Kitchen Station Load"}` }
            : t
        )
      );

      // Record in immutable audit log
      const newAudit: AuditLogItem = {
        id: `aud_${Date.now()}`,
        hotelId: currentHotel.id,
        timestamp: new Date().toISOString(),
        actorId: currentStaff.id,
        actorName: `${currentStaff.name} (${currentStaff.roleTitle})`,
        eventType: "order.held",
        entityTarget: `${ticket.ticketNumber} (Room ${ticket.roomNumber})`,
        ipAddress: "192.241.14.82",
        traceId: `tr_${Math.random().toString(36).substr(2, 8)}`,
        payload: {
          ticketId,
          room: ticket.roomNumber,
          action: "hold_or_rejected",
          reason: reason || "Kitchen station load / 86 ingredient",
          rejectedBy: currentStaff.name,
        },
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      showToast({
        type: "warning",
        title: "Order Placed on Hold / Rejected",
        message: `Order ${ticket.ticketNumber} (Room ${ticket.roomNumber}) has been held. Front Desk & runner alerted.`,
      });

      return true;
    },
    [kitchenTickets, currentStaff, currentHotel.id, showToast]
  );

  const startPrepTicket = useCallback(
    async (ticketId: string): Promise<boolean> => {
      setKitchenTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "preparing" } : t))
      );
      showToast({
        type: "info",
        title: "Preparation Commenced",
        message: `Cook line clock started for ticket.`,
      });
      return true;
    },
    [showToast]
  );

  const readyTicket = useCallback(
    async (ticketId: string): Promise<boolean> => {
      setKitchenTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: "ready" } : t))
      );
      kitchenAudioEngine.playOrderChime();
      showToast({
        type: "success",
        title: "Order Marked Ready",
        message: "Runner notification dispatched to floor.",
      });
      return true;
    },
    [showToast]
  );

  // Simulate incoming real-time order via Supabase Realtime channel
  const simulateIncomingOrder = useCallback(() => {
    const newNumber = `#0${Math.floor(423 + Math.random() * 80)}`;
    const randomRooms = ["204", "101", "308", "415", "502"];
    const randomRoom = randomRooms[Math.floor(Math.random() * randomRooms.length)];
    const newTicket: KitchenTicket = {
      id: `ord_${Date.now()}`,
      hotelId: currentHotel.id,
      ticketNumber: newNumber,
      roomNumber: randomRoom,
      stayId: `st_live_${Date.now()}`,
      guestName: "Guest (Live Mobile QR)",
      placedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "pending",
      items: [
        {
          name: "Australian Wagyu Burger",
          quantity: 1,
          modifiers: ["Medium Well", "Extra Truffle Fries"],
          allergens: ["Gluten", "Dairy"],
        },
        {
          name: "Fresh Tropical Punch",
          quantity: 2,
          modifiers: ["Chilled", "No Added Sugar"],
        },
      ],
      note: "Live order placed from Guest QR Web App",
      priority: true,
      vip: false,
    };

    setKitchenTickets((prev) => [newTicket, ...prev]);
    kitchenAudioEngine.playOrderChime();
    // Start continuous sharp buzzer until accepted
    kitchenAudioEngine.startBuzzer(newTicket.id);

    // Audit log
    const newAudit: AuditLogItem = {
      id: `aud_${Date.now()}`,
      hotelId: currentHotel.id,
      timestamp: new Date().toISOString(),
      actorId: "guest_live_session",
      actorName: `Guest (Room ${randomRoom})`,
      eventType: "order.created",
      entityTarget: `${newNumber} (Room ${randomRoom})`,
      ipAddress: "172.56.24.18",
      traceId: `tr_${Math.random().toString(36).substr(2, 8)}`,
      payload: { ticketNumber: newNumber, roomNumber: randomRoom, items: 2 },
    };
    setAuditLogs((prev) => [newAudit, ...prev]);

    showToast({
      type: "warning",
      title: "Realtime: New Kitchen Ticket",
      message: `${newNumber} received for Room ${randomRoom}. Sharp buzzer active until accepted!`,
    });
  }, [currentHotel.id, showToast]);

  // Simulate incoming real-time housekeeping service request
  const simulateIncomingServiceRequest = useCallback(() => {
    const randomRooms = ["102", "204", "305", "412", "501"];
    const randomRoom = randomRooms[Math.floor(Math.random() * randomRooms.length)];
    const services = [
      { title: "Extra Feather Pillows & Fresh Linens", category: "amenity" as const },
      { title: "Urgent Turndown Service & Towels", category: "cleaning" as const },
      { title: "Mini-bar Restock & Ice Bucket", category: "maintenance" as const },
      { title: "Child Cot & Baby Amenity Kit", category: "amenity" as const },
    ];
    const chosen = services[Math.floor(Math.random() * services.length)];
    const newReq: ServiceRequest = {
      id: `req_${Date.now()}`,
      hotelId: currentHotel.id,
      roomNumber: randomRoom,
      title: chosen.title,
      category: chosen.category,
      placedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
      status: "created",
    };

    setServiceRequests((prev) => [newReq, ...prev]);
    // Start continuous sharp buzzer until accepted
    kitchenAudioEngine.startBuzzer(newReq.id);

    showToast({
      type: "warning",
      title: "Urgent Housekeeping Dispatch",
      message: `Room ${randomRoom}: ${chosen.title}. Sharp buzzer active until accepted!`,
    });
  }, [currentHotel.id, showToast]);

  const updateRoomStatus = useCallback(
    (roomId: string, newStatus: RoomRecord["cleanStatus"]) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, cleanStatus: newStatus, lastUpdated: "Just now" }
            : r
        )
      );
      showToast({
        type: "info",
        title: "Room Matrix Updated",
        message: `Status updated to ${newStatus} with optimistic sync.`,
      });
    },
    [showToast]
  );

  const acceptServiceRequest = useCallback(
    (requestId: string) => {
      // Immediately stop buzzer for this request
      kitchenAudioEngine.stopBuzzer(requestId);

      setServiceRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? { ...req, status: "acknowledged", assignedTo: currentStaff.name }
            : req
        )
      );
      showToast({
        type: "success",
        title: "Dispatch Accepted",
        message: `Assigned to ${currentStaff.name}. Buzzer silenced.`,
      });
    },
    [currentStaff.name, showToast]
  );

  const completeServiceRequest = useCallback(
    (requestId: string) => {
      setServiceRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: "completed" } : req))
      );
      showToast({
        type: "success",
        title: "Service Request Completed",
        message: "Request marked fulfilled and closed.",
      });
    },
    [showToast]
  );

  const addFolioAdjustment = useCallback(
    (
      folioId: string,
      adjustmentType: "discount" | "charge",
      amountPaise: number,
      reasonCategory: string,
      mandatoryNote: string,
      managerKey: string
    ): boolean => {
      if (managerKey !== "9999" && managerKey !== "1234") {
        showToast({
          type: "error",
          title: "Authorization Denied",
          message: "Manager override key invalid. Action rejected.",
        });
        return false;
      }

      const signedAmountPaise = adjustmentType === "discount" ? -Math.abs(amountPaise) : Math.abs(amountPaise);

      setFolios((prev) =>
        prev.map((folio) => {
          if (folio.id !== folioId) return folio;
          const newItem = {
            id: `fi_adj_${Date.now()}`,
            description: `${adjustmentType === "discount" ? "Manual Credit/Discount" : "Manual Additional Charge"} (${reasonCategory})`,
            timestamp: new Date().toISOString(),
            amountPaise: signedAmountPaise,
            source: "Desk (Adj)" as const,
            isLocked: false,
            auditNote: mandatoryNote,
            authorizedBy: currentStaff.name,
          };

          const newTotalDue = Math.max(0, folio.totalDuePaise + signedAmountPaise);
          return {
            ...folio,
            items: [...folio.items, newItem],
            totalDuePaise: newTotalDue,
          };
        })
      );

      // Audit log
      const newAudit: AuditLogItem = {
        id: `aud_${Date.now()}`,
        hotelId: currentHotel.id,
        timestamp: new Date().toISOString(),
        actorId: currentStaff.id,
        actorName: `${currentStaff.name} (${currentStaff.roleTitle})`,
        eventType: adjustmentType === "discount" ? "folio.manual_discount" : "folio.manual_charge",
        entityTarget: `${folioId} (${signedAmountPaise} paise)`,
        ipAddress: "192.241.14.90",
        traceId: `tr_${Math.random().toString(36).substr(2, 8)}`,
        payload: {
          folioId,
          adjustmentPaise: signedAmountPaise,
          reasonCategory,
          note: mandatoryNote,
          authorizedBy: currentStaff.name,
        },
      };
      setAuditLogs((prev) => [newAudit, ...prev]);

      showToast({
        type: "success",
        title: "Folio Adjustment Signed",
        message: `Ledger adjusted by ${signedAmountPaise / 100} INR and written to immutable audit.`,
      });
      return true;
    },
    [currentHotel.id, currentStaff, showToast]
  );

  const updateMenuItem = useCallback(
    (item: MenuItem) => {
      setMenuCatalog((prev) => prev.map((m) => (m.id === item.id ? item : m)));
      showToast({
        type: "success",
        title: "Catalog Updated",
        message: `${item.title} saved with Zod verification.`,
      });
    },
    [showToast]
  );

  const toggleMenuItemAvailability = useCallback(
    (itemId: string) => {
      setMenuCatalog((prev) =>
        prev.map((m) => (m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m))
      );
    },
    []
  );

  const dismissSlaAlert = useCallback(
    (alertId: string, reason: string) => {
      setSlaAlerts((prev) => prev.filter((a) => a.id !== alertId));
      showToast({
        type: "info",
        title: "SLA Alert Dismissed",
        message: `Dismiss reason logged: ${reason}`,
      });
    },
    [showToast]
  );

  const reassignSlaAlert = useCallback(
    (alertId: string, staffName: string) => {
      setSlaAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, staffAssigned: staffName } : a))
      );
      showToast({
        type: "success",
        title: "SLA Reassigned",
        message: `Task reassigned to ${staffName} with urgent priority.`,
      });
    },
    [showToast]
  );

  const suspendTenant = useCallback(
    (tenantId: string) => {
      setAllHotels((prev) =>
        prev.map((h) => (h.id === tenantId ? { ...h, status: "SUSPENDED" } : h))
      );
      const audit: AuditLogItem = {
        id: `aud_${Date.now()}`,
        hotelId: tenantId,
        timestamp: new Date().toISOString(),
        actorId: currentStaff.id,
        actorName: currentStaff.name,
        eventType: "tenant.suspended",
        entityTarget: tenantId,
        ipAddress: "10.0.0.1",
        traceId: `tr_${Math.random().toString(36).substr(2, 8)}`,
        payload: { action: "TENANT_OPERATIONS_REVOKED", tenantId },
      };
      setAuditLogs((prev) => [audit, ...prev]);
      showToast({
        type: "warning",
        title: "Tenant Suspended",
        message: `Hotel ${tenantId} operations revoked across platform.`,
      });
    },
    [currentStaff, showToast]
  );

  // Ping jitter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLatencyMs(Math.floor(20 + Math.random() * 12));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <OpsContext.Provider
      value={{
        currentHotel,
        allHotels,
        switchHotel,
        currentStaff,
        allStaff: SEED_STAFF,
        switchStaffWithPin,
        isSoundMuted,
        toggleSound,
        latencyMs,
        isSimulatedOffline,
        toggleOffline,
        simulateRaceConditionConflict,
        setSimulateRaceConditionConflict,
        theme,
        toggleTheme,
        isBuzzerRinging,
        silenceBuzzer,
        triggerBuzzerDemo,
        kitchenTickets,
        rooms,
        serviceRequests,
        folios,
        menuCatalog,
        auditLogs,
        deviceConfig,
        slaAlerts,
        acceptTicket,
        rejectOrHoldTicket,
        startPrepTicket,
        readyTicket,
        simulateIncomingOrder,
        simulateIncomingServiceRequest,
        updateRoomStatus,
        acceptServiceRequest,
        completeServiceRequest,
        addFolioAdjustment,
        updateMenuItem,
        toggleMenuItemAvailability,
        dismissSlaAlert,
        reassignSlaAlert,
        suspendTenant,
        toasts,
        dismissToast,
        showToast,
        hasTenantAccess,
      }}
    >
      {children}
    </OpsContext.Provider>
  );
}

export function useOps() {
  const context = useContext(OpsContext);
  if (!context) {
    throw new Error("useOps must be used within an OpsProvider");
  }
  return context;
}
