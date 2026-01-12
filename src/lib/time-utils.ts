import { BillingCode, User } from "@/types";

/**
 * Parse /log command from runsheet text
 * Matches patterns like: /log 11m call with client re: discovery
 */
export function parseLogCommand(text: string): { duration: number; description: string } | null {
  const logRegex = /^\/log\s+(\d+)(m|min|minutes)\s+(.+)/i;
  const match = text.match(logRegex);
  
  if (!match) return null;
  
  const duration = parseInt(match[1]);
  const description = match[3].trim();
  
  return { duration, description };
}

/**
 * Calculate billable minutes from raw seconds using 6-minute rounding
 * Rounds up to the nearest 6-minute increment
 */
export function calculateBillableMinutes(rawSeconds: number): number {
  const minutes = rawSeconds / 60;
  return Math.ceil(minutes / 6) * 6;
}

/**
 * Format duration in a human-readable format
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * Format duration in HH:MM format
 */
export function formatDurationHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Calculate effective rate for a user and billing code
 */
export function calculateEffectiveRate(user: User, billingCode: BillingCode): number {
  return billingCode.roleRatePolicy[user.role] || 0;
}

/**
 * Calculate amount for a time entry
 */
export function calculateTimeEntryAmount(billableMinutes: number, ratePerHour: number): number {
  const hours = billableMinutes / 60;
  return Math.round(hours * ratePerHour);
}

/**
 * Check if user has permission to view rates
 */
export function canViewRates(user: User): boolean {
  return user.role === 'Admin' || user.role === 'Attorney';
}

/**
 * Check if user has admin permissions
 */
export function isAdmin(user: User): boolean {
  return user.role === 'Admin';
}
