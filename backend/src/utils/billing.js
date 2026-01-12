/**
 * Billing utilities for time tracking with 6-minute rounding
 */

/**
 * Calculate billed minutes using 6-minute rounding (Filevine-style)
 * @param {number} rawMinutes - Raw minutes worked
 * @returns {number} - Rounded billed minutes
 */
export function calculateBilledMinutes(rawMinutes) {
  if (!rawMinutes || rawMinutes <= 0) return 0;
  return Math.ceil(rawMinutes / 6) * 6;
}

/**
 * Calculate raw minutes from start and end times
 * @param {Date} startedAt - Start time
 * @param {Date} endedAt - End time
 * @returns {number} - Raw minutes (ceiling)
 */
export function calculateRawMinutes(startedAt, endedAt) {
  if (!startedAt || !endedAt) return 0;
  const diffMs = new Date(endedAt) - new Date(startedAt);
  const diffSeconds = diffMs / 1000;
  return Math.ceil(diffSeconds / 60);
}

/**
 * Calculate amount in cents from billed minutes and rate
 * @param {number} billedMinutes - Billed minutes
 * @param {number} rateCents - Rate in cents per hour
 * @returns {number} - Amount in cents
 */
export function calculateAmountCents(billedMinutes, rateCents) {
  if (!billedMinutes || !rateCents) return 0;
  return Math.round((billedMinutes / 60) * rateCents);
}

/**
 * Determine rate in cents based on billing code and user
 * @param {Object} billingCode - Billing code object
 * @param {Object} user - User object with role
 * @param {Object} roleRates - Map of role to rate in cents
 * @returns {number} - Rate in cents per hour
 */
export function determineRateCents(billingCode, user, roleRates) {
  // If billing code has fixed rate, use it
  if (billingCode && billingCode.fixedRateCents) {
    return billingCode.fixedRateCents;
  }
  
  // If billing code has override role, use that role's rate
  if (billingCode && billingCode.overrideRole && roleRates[billingCode.overrideRole]) {
    return roleRates[billingCode.overrideRole];
  }
  
  // Use user's role rate
  if (user && user.role && roleRates[user.role]) {
    return roleRates[user.role];
  }
  
  // Fallback to user's billableRate if set (convert to cents)
  if (user && user.billableRate) {
    return Math.round(user.billableRate * 100);
  }
  
  // Default fallback
  return 0;
}

/**
 * Process time entry data and calculate all billing fields
 * @param {Object} entryData - Time entry data
 * @param {Object} user - User object
 * @param {Object} billingCode - Billing code object (optional)
 * @param {Object} roleRates - Map of role to rate in cents
 * @returns {Object} - Processed time entry data
 */
export function processTimeEntry(entryData, user, billingCode, roleRates) {
  let rawMinutes = entryData.durationMinutesRaw;
  
  // If startedAt and endedAt provided, calculate raw minutes
  if (entryData.startedAt && entryData.endedAt) {
    rawMinutes = calculateRawMinutes(entryData.startedAt, entryData.endedAt);
  }
  
  // Calculate billed minutes with 6-minute rounding
  const billedMinutes = calculateBilledMinutes(rawMinutes);
  
  // Determine rate in cents
  const rateCents = determineRateCents(billingCode, user, roleRates);
  
  // Calculate amount in cents
  const amountCents = calculateAmountCents(billedMinutes, rateCents);
  
  return {
    ...entryData,
    durationMinutesRaw: rawMinutes,
    durationMinutesBilled: billedMinutes,
    rateCentsApplied: rateCents,
    amountCents: amountCents
  };
}
