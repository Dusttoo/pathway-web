/**
 * Application-wide constants
 * Security fix: FRONTEND-P2-6 - Centralize validation patterns for consistency
 */

/**
 * Discord guild ID validation regex
 * Discord snowflake IDs are 17-19 digits
 *
 * Used by:
 * - API client setGuildId() validation
 * - Form validation
 * - Component prop validation
 */
export const GUILD_ID_REGEX = /^\d{17,19}$/;

/**
 * Validate a Discord guild ID format
 *
 * @param guildId - The guild ID to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * if (!isValidGuildId(guildId)) {
 *   throw new Error("Invalid guild ID format");
 * }
 */
export function isValidGuildId(guildId: string | null | undefined): boolean {
  if (!guildId) return false;
  return GUILD_ID_REGEX.test(guildId);
}

/**
 * Error message for invalid guild ID
 */
export const INVALID_GUILD_ID_MESSAGE =
  "Invalid guild_id format. Discord guild IDs must be 17-19 digits.";
