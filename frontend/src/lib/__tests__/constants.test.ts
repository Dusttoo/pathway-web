/**
 * Constants and Validation Helper Tests
 * Security fix: FRONTEND-P2-1, FRONTEND-P2-6
 *
 * Tests for centralized validation constants and helper functions.
 */

import {
  GUILD_ID_REGEX,
  isValidGuildId,
  INVALID_GUILD_ID_MESSAGE,
} from "../constants";

describe("Guild ID Validation Constants - FRONTEND-P2-1", () => {
  describe("GUILD_ID_REGEX", () => {
    it("should match valid 17-digit guild_id", () => {
      expect(GUILD_ID_REGEX.test("12345678901234567")).toBe(true);
    });

    it("should match valid 18-digit guild_id", () => {
      expect(GUILD_ID_REGEX.test("123456789012345678")).toBe(true);
    });

    it("should match valid 19-digit guild_id", () => {
      expect(GUILD_ID_REGEX.test("1234567890123456789")).toBe(true);
    });

    it("should reject 16-digit guild_id (too short)", () => {
      expect(GUILD_ID_REGEX.test("1234567890123456")).toBe(false);
    });

    it("should reject 20-digit guild_id (too long)", () => {
      expect(GUILD_ID_REGEX.test("12345678901234567890")).toBe(false);
    });

    it("should reject guild_id with letters", () => {
      expect(GUILD_ID_REGEX.test("12345678901234abc")).toBe(false);
    });

    it("should reject guild_id with special characters", () => {
      expect(GUILD_ID_REGEX.test("12345678901234567!")).toBe(false);
    });

    it("should reject guild_id with spaces", () => {
      expect(GUILD_ID_REGEX.test("123456789012345 67")).toBe(false);
    });

    it("should reject empty string", () => {
      expect(GUILD_ID_REGEX.test("")).toBe(false);
    });

    it("should reject guild_id with newlines", () => {
      expect(GUILD_ID_REGEX.test("12345678901234567\n")).toBe(false);
    });

    it("should reject guild_id with SQL injection patterns", () => {
      expect(GUILD_ID_REGEX.test("12345'; DROP TABLE users--")).toBe(false);
    });

    it("should reject guild_id with header injection attempts", () => {
      expect(
        GUILD_ID_REGEX.test("12345678901234567\r\nX-Malicious: injected"),
      ).toBe(false);
    });
  });

  describe("isValidGuildId helper function", () => {
    it("should return true for valid 17-digit guild_id", () => {
      expect(isValidGuildId("12345678901234567")).toBe(true);
    });

    it("should return true for valid 18-digit guild_id", () => {
      expect(isValidGuildId("123456789012345678")).toBe(true);
    });

    it("should return true for valid 19-digit guild_id", () => {
      expect(isValidGuildId("1234567890123456789")).toBe(true);
    });

    it("should return false for null", () => {
      expect(isValidGuildId(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isValidGuildId(undefined)).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidGuildId("")).toBe(false);
    });

    it("should return false for invalid format", () => {
      expect(isValidGuildId("invalid")).toBe(false);
    });

    it("should return false for too short guild_id", () => {
      expect(isValidGuildId("1234567890123456")).toBe(false);
    });

    it("should return false for too long guild_id", () => {
      expect(isValidGuildId("12345678901234567890")).toBe(false);
    });

    it("should return false for guild_id with special characters", () => {
      expect(isValidGuildId("12345678901234567!")).toBe(false);
    });

    it("should return false for SQL injection attempts", () => {
      expect(isValidGuildId("12345'; DROP TABLE users--")).toBe(false);
    });

    it("should return false for header injection attempts", () => {
      expect(isValidGuildId("12345678901234567\r\nX-Malicious: injected")).toBe(
        false,
      );
    });
  });

  describe("INVALID_GUILD_ID_MESSAGE", () => {
    it("should be a non-empty string", () => {
      expect(typeof INVALID_GUILD_ID_MESSAGE).toBe("string");
      expect(INVALID_GUILD_ID_MESSAGE.length).toBeGreaterThan(0);
    });

    it("should mention the valid format (17-19 digits)", () => {
      expect(INVALID_GUILD_ID_MESSAGE).toMatch(/17-19/);
      expect(INVALID_GUILD_ID_MESSAGE).toMatch(/digit/);
    });

    it("should indicate an invalid format error", () => {
      expect(INVALID_GUILD_ID_MESSAGE.toLowerCase()).toMatch(/invalid/);
      expect(INVALID_GUILD_ID_MESSAGE.toLowerCase()).toMatch(/guild/);
    });
  });
});
