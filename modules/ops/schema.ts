import { z } from "zod";

export const ManualAdjustmentSchema = z.object({
  adjustmentType: z.enum(["discount", "charge"]),
  amountRupees: z
    .number()
    .positive("Amount must be greater than zero")
    .max(50000, "Maximum single adjustment limit is ₹50,000"),
  reasonCategory: z.enum([
    "Service Recovery (Delay)",
    "Room Quality Concern",
    "Billing Discrepancy Correction",
    "Manager Courtesy Courtesy VIP",
    "MiniBar Consumption Reconciliation",
    "Late Check-out Fee",
  ]),
  mandatoryNote: z
    .string()
    .min(10, "Audit note must be at least 10 characters detailing the incident")
    .max(500, "Audit note cannot exceed 500 characters"),
  managerOverrideKey: z
    .string()
    .min(4, "Manager authorization code must be at least 4 digits"),
});

export type ManualAdjustmentInput = z.infer<typeof ManualAdjustmentSchema>;

export const MenuItemSchema = z.object({
  title: z.string().min(3, "Item name must be at least 3 characters").max(100),
  category: z.enum(["Starters", "Mains", "Desserts", "Beverages", "Late Night"]),
  priceRupees: z.number().positive("Price must be greater than zero"),
  taxRatePct: z.number().min(0).max(28),
  description: z.string().min(5, "Description must be at least 5 characters"),
  allergens: z.array(z.string()),
  station: z.string().min(2, "Station assignment is required"),
  slaTargetMinutes: z.number().int().min(1).max(120),
});

export type MenuItemInput = z.infer<typeof MenuItemSchema>;

export const TenantSuspensionSchema = z.object({
  tenantId: z.string(),
  confirmationText: z.string(),
}).refine(
  (data) => data.confirmationText === `SUSPEND ${data.tenantId}`,
  {
    message: "Confirmation text must exactly match 'SUSPEND <tenant_id>'",
    path: ["confirmationText"],
  }
);
