import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format server-returned integer paise into human-readable Indian Rupee string.
 * Strictly adheres to rule: Client never computes prices or tax, only renders server minor units.
 * @param paise integer amount in paise (e.g. 1845000 paise = ₹18,450.00)
 */
export function formatPaiseToINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Formats ISO UTC timestamp into localized operational display
 */
export function formatOpsTime(isoString: string | Date): string {
  const date = typeof isoString === "string" ? new Date(isoString) : isoString;
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function formatOpsDate(isoString: string | Date): string {
  const date = typeof isoString === "string" ? new Date(isoString) : isoString;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculates remaining minutes until SLA due date.
 */
export function getRemainingMinutes(dueAtIso: string): number {
  const due = new Date(dueAtIso).getTime();
  const now = Date.now();
  return Math.round((due - now) / 60000);
}
