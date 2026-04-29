/**
 * API Client Guild ID Security Tests
 * Security fix: FRONTEND-P1-2, FRONTEND-P2-1
 *
 * These tests verify guild_id handling and validation in the API client.
 *
 * NOTE: This project needs a test framework (Jest or Vitest) to run these tests.
 * To set up testing:
 * 1. Install test dependencies: npm install --save-dev jest @types/jest ts-jest
 * 2. Create jest.config.js in the frontend root
 * 3. Add test script to package.json: "test": "jest"
 */

import { ApiClient } from "../client";

// Mock fetch globally
global.fetch = jest.fn();

describe("ApiClient Guild ID Security", () => {
  let client: ApiClient;

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
    client = new ApiClient();
  });

  describe("setGuildId validation", () => {
    it("should accept valid 17-digit guild_id", () => {
      const validGuildId = "12345678901234567"; // 17 digits
      expect(() => client.setGuildId(validGuildId)).not.toThrow();
      expect(client.getGuildId()).toBe(validGuildId);
    });

    it("should accept valid 18-digit guild_id", () => {
      const validGuildId = "123456789012345678"; // 18 digits
      expect(() => client.setGuildId(validGuildId)).not.toThrow();
      expect(client.getGuildId()).toBe(validGuildId);
    });

    it("should accept valid 19-digit guild_id", () => {
      const validGuildId = "1234567890123456789"; // 19 digits
      expect(() => client.setGuildId(validGuildId)).not.toThrow();
      expect(client.getGuildId()).toBe(validGuildId);
    });

    it("should accept null to clear guild_id", () => {
      client.setGuildId("12345678901234567");
      expect(() => client.setGuildId(null)).not.toThrow();
      expect(client.getGuildId()).toBeNull();
    });

    it("should reject guild_id with less than 17 digits", () => {
      const invalidGuildId = "1234567890123456"; // 16 digits
      expect(() => client.setGuildId(invalidGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });

    it("should reject guild_id with more than 19 digits", () => {
      const invalidGuildId = "12345678901234567890"; // 20 digits
      expect(() => client.setGuildId(invalidGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });

    it("should reject guild_id with non-numeric characters", () => {
      const invalidGuildId = "12345678901234abc";
      expect(() => client.setGuildId(invalidGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });

    it("should reject empty string guild_id", () => {
      expect(() => client.setGuildId("")).toThrow(/Invalid guild_id format/);
    });

    it("should reject guild_id with special characters", () => {
      const invalidGuildId = "12345678901234567!";
      expect(() => client.setGuildId(invalidGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });

    it("should reject guild_id with spaces", () => {
      const invalidGuildId = "123456789012345 67";
      expect(() => client.setGuildId(invalidGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });
  });

  describe("getGuildId", () => {
    it("should return null initially", () => {
      expect(client.getGuildId()).toBeNull();
    });

    it("should return the set guild_id", () => {
      const guildId = "12345678901234567";
      client.setGuildId(guildId);
      expect(client.getGuildId()).toBe(guildId);
    });

    it("should return null after clearing", () => {
      client.setGuildId("12345678901234567");
      client.setGuildId(null);
      expect(client.getGuildId()).toBeNull();
    });
  });

  describe("Header injection prevention - FRONTEND-P2-1", () => {
    beforeEach(() => {
      // Clear all mocks before each test
      (global.fetch as jest.Mock).mockClear();
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
    });

    it("should include X-Guild-ID header when guild_id is set", async () => {
      const guildId = "12345678901234567";
      client.setGuildId(guildId);

      await client.get("/test/endpoint");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Guild-ID": guildId,
          }),
        }),
      );
    });

    it("should not include X-Guild-ID header when guild_id is null", async () => {
      client.setGuildId(null);

      await client.get("/test/endpoint");

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers;
      expect(headers["X-Guild-ID"]).toBeUndefined();
    });

    it("should include X-Guild-ID header in POST requests", async () => {
      const guildId = "12345678901234567";
      client.setGuildId(guildId);

      await client.post("/test/endpoint", { data: "test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "X-Guild-ID": guildId,
          }),
        }),
      );
    });

    it("should include X-Guild-ID header in PUT requests", async () => {
      const guildId = "12345678901234567";
      client.setGuildId(guildId);

      await client.put("/test/endpoint", { data: "test" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PUT",
          headers: expect.objectContaining({
            "X-Guild-ID": guildId,
          }),
        }),
      );
    });

    it("should include X-Guild-ID header in DELETE requests", async () => {
      const guildId = "12345678901234567";
      client.setGuildId(guildId);

      await client.delete("/test/endpoint");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "DELETE",
          headers: expect.objectContaining({
            "X-Guild-ID": guildId,
          }),
        }),
      );
    });

    it("should not allow header injection through guild_id", () => {
      // Attempt to inject additional headers through guild_id
      // This should fail validation since it's not a valid guild_id format
      const maliciousGuildId =
        "12345678901234567\nAuthorization: Bearer malicious";
      expect(() => client.setGuildId(maliciousGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });

    it("should not allow CRLF injection in guild_id", () => {
      const maliciousGuildId = "12345678901234567\r\nX-Malicious: injected";
      expect(() => client.setGuildId(maliciousGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });

    it("should not allow SQL injection patterns in guild_id", () => {
      const maliciousGuildId = "12345'; DROP TABLE users--";
      expect(() => client.setGuildId(maliciousGuildId)).toThrow(
        /Invalid guild_id format/,
      );
    });
  });

  describe("Error context with guild_id - FRONTEND-P2-1", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockClear();
      // Suppress console.error for these tests
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      (console.error as jest.Mock).mockRestore();
    });

    it("should log guild_id with errors", async () => {
      const guildId = "12345678901234567";
      client.setGuildId(guildId);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Resource not found" }),
      });

      await expect(client.get("/test/endpoint")).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(`Guild: ${guildId}`),
        expect.any(Object),
      );
    });

    it('should log "No Guild" when guild_id is not set', async () => {
      client.setGuildId(null);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: async () => ({ detail: "Resource not found" }),
      });

      await expect(client.get("/test/endpoint")).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("No Guild"),
        expect.any(Object),
      );
    });
  });

  describe("localStorage persistence", () => {
    it("should persist guild_id to localStorage", () => {
      const guildId = "12345678901234567";
      client.setGuildId(guildId);

      if (typeof window !== "undefined") {
        expect(localStorage.getItem("discord_guild_id")).toBe(guildId);
      }
    });

    it("should remove guild_id from localStorage when cleared", () => {
      client.setGuildId("12345678901234567");
      client.setGuildId(null);

      if (typeof window !== "undefined") {
        expect(localStorage.getItem("discord_guild_id")).toBeNull();
      }
    });

    it("should load guild_id from localStorage on initialization", () => {
      if (typeof window !== "undefined") {
        localStorage.setItem("discord_guild_id", "12345678901234567");
      }

      const newClient = new ApiClient();
      expect(newClient.getGuildId()).toBe("12345678901234567");
    });
  });
});
