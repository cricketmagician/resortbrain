// lib/guest/format.ts
// Every place the guest UI turns a server value into a string. Dividing by 100 for display is
// the only arithmetic performed on money anywhere in the guest UI (see docs/m2/02 §7).

const moneyFormatters = new Map<string, Intl.NumberFormat>();
const moneyFormattersNoDecimals = new Map<string, Intl.NumberFormat>();

function getMoneyFormatter(currency: string, fractionDigits: 0 | 2): Intl.NumberFormat {
  const cache = fractionDigits === 0 ? moneyFormattersNoDecimals : moneyFormatters;
  const cached = cache.get(currency);
  if (cached) return cached;
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
  cache.set(currency, formatter);
  return formatter;
}

export function formatMoney(paise: number, currency = 'INR'): string {
  const fd = paise % 100 === 0 ? 0 : 2;
  return getMoneyFormatter(currency, fd).format(paise / 100);
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>();
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatTime(iso: string, timeZone: string): string {
  let formatter = timeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone });
    timeFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(iso));
}

export function formatDateTime(iso: string, timeZone: string): string {
  let formatter = dateTimeFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone,
    });
    dateTimeFormatters.set(timeZone, formatter);
  }
  return formatter.format(new Date(iso));
}

export function formatRelative(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} h ago`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} d ago`;
}
