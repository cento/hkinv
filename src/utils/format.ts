/**
 * Format a number as HKD currency string.
 */
export function formatHKD(amount: number): string {
  return `HK$${amount.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format an ISO date string to a localized format.
 */
export function formatDate(isoDate: string, locale = 'it'): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString(locale === 'it' ? 'it-IT' : 'en-HK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string for machine use (YYYY-MM-DD).
 */
export function formatDateISO(isoDate: string): string {
  return isoDate.split('T')[0];
}

/**
 * Generate an invoice number in the format: PREFIX-YYYY-XXXX
 */
export function generateInvoiceNumber(prefix: string, counter: number): string {
  const year = new Date().getFullYear().toString();
  const padded = String(counter).padStart(4, '0');
  return `${prefix}${year}-${padded}`;
}

/**
 * Parse a localized HKD string back to a number.
 */
export function parseHKD(value: string): number {
  return parseFloat(value.replace(/[^0-9.,-]/g, '').replace(/,/g, ''));
}

/**
 * Get today's date as ISO string (YYYY-MM-DD).
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate a due date based on payment terms (e.g., "30 giorni" -> 30 days from now).
 */
export function calculateDueDate(paymentTerms: string | null | undefined): string {
  if (!paymentTerms) return todayISO();
  const match = paymentTerms.match(/(\d+)/);
  const days = match ? parseInt(match[1], 10) : 30;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
