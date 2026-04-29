/**
 * Analytics Guild ID Enrichment Tests
 * Security fix: FRONTEND-P2-1, FRONTEND-P2-7
 *
 * Tests for automatic guild_id inclusion in analytics events.
 */

import { trackEvent, trackLogin, trackSignUp } from "../analytics";

// Mock gtag
declare global {
  interface Window {
    gtag: jest.Mock;
    dataLayer: any[];
  }
}

describe("Analytics Guild ID Enrichment - FRONTEND-P2-1", () => {
  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = jest.fn();
    Storage.prototype.setItem = jest.fn();
    Storage.prototype.removeItem = jest.fn();

    // Mock gtag
    window.gtag = jest.fn();
    window.dataLayer = [];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("trackEvent with guild_id", () => {
    it("should include guild_id from localStorage in event parameters", () => {
      const guildId = "12345678901234567";
      (localStorage.getItem as jest.Mock).mockReturnValue(guildId);

      trackEvent("button_click", { button_name: "Sign Up" });

      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "button_click",
        expect.objectContaining({
          button_name: "Sign Up",
          guild_id: guildId,
        }),
      );
    });

    it("should not include guild_id when localStorage returns null", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      trackEvent("button_click", { button_name: "Sign Up" });

      const eventParams = (window.gtag as jest.Mock).mock.calls[0][2];
      expect(eventParams).not.toHaveProperty("guild_id");
      expect(eventParams).toEqual({ button_name: "Sign Up" });
    });

    it("should handle localStorage access errors gracefully", () => {
      (localStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error("localStorage access denied");
      });

      // Should not throw
      expect(() => {
        trackEvent("button_click", { button_name: "Sign Up" });
      }).not.toThrow();

      // Event should still be tracked without guild_id
      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "button_click",
        expect.objectContaining({
          button_name: "Sign Up",
        }),
      );
    });

    it("should preserve other event parameters when adding guild_id", () => {
      const guildId = "12345678901234567";
      (localStorage.getItem as jest.Mock).mockReturnValue(guildId);

      const customParams = {
        category: "engagement",
        label: "test",
        value: 42,
      };

      trackEvent("custom_event", customParams);

      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "custom_event",
        expect.objectContaining({
          ...customParams,
          guild_id: guildId,
        }),
      );
    });

    it("should not override existing guild_id in parameters", () => {
      const storedGuildId = "12345678901234567";
      const explicitGuildId = "98765432109876543";
      (localStorage.getItem as jest.Mock).mockReturnValue(storedGuildId);

      trackEvent("test_event", { guild_id: explicitGuildId });

      // Should use the explicit guild_id, not override it
      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "test_event",
        expect.objectContaining({
          guild_id: explicitGuildId, // Explicit value should be preserved
        }),
      );
    });
  });

  describe("trackLogin with guild_id", () => {
    it("should include guild_id in login events", () => {
      const guildId = "12345678901234567";
      (localStorage.getItem as jest.Mock).mockReturnValue(guildId);

      trackLogin("discord");

      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "login",
        expect.objectContaining({
          method: "discord",
          guild_id: guildId,
        }),
      );
    });

    it("should track login without guild_id when not set", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      trackLogin("email");

      const eventParams = (window.gtag as jest.Mock).mock.calls[0][2];
      expect(eventParams).toEqual({ method: "email" });
      expect(eventParams).not.toHaveProperty("guild_id");
    });
  });

  describe("trackSignUp with guild_id", () => {
    it("should include guild_id in sign up conversion events", () => {
      const guildId = "12345678901234567";
      (localStorage.getItem as jest.Mock).mockReturnValue(guildId);

      trackSignUp("discord");

      expect(window.gtag).toHaveBeenCalledWith(
        "event",
        "sign_up",
        expect.objectContaining({
          method: "discord",
          guild_id: guildId,
        }),
      );
    });

    it("should track sign up without guild_id when not set", () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      trackSignUp("email");

      const eventParams = (window.gtag as jest.Mock).mock.calls[0][2];
      expect(eventParams).toEqual({ method: "email" });
      expect(eventParams).not.toHaveProperty("guild_id");
    });
  });

  describe("Server-side rendering compatibility", () => {
    it("should handle undefined window gracefully", () => {
      // Save original window
      const originalWindow = global.window;

      // @ts-ignore - Simulate SSR
      delete global.window;

      // Should not throw
      expect(() => {
        trackEvent("test_event", { test: "value" });
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it("should not track events when gtag is not available", () => {
      // @ts-ignore
      delete window.gtag;

      // Should not throw
      expect(() => {
        trackEvent("test_event", { test: "value" });
      }).not.toThrow();
    });
  });
});
