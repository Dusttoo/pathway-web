import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { extractDiscordId } from "../auth";

// Minimal helper to build an auth-user shape for the pure extractor.
function authUser(overrides: Partial<User>): Pick<User, "id" | "identities"> {
  return { id: "auth-uuid", identities: undefined, ...overrides };
}

describe("extractDiscordId", () => {
  it("returns the Discord provider_id when a Discord identity is linked", () => {
    const user = authUser({
      identities: [
        {
          id: "1",
          user_id: "auth-uuid",
          identity_id: "x",
          provider: "discord",
          identity_data: { provider_id: "123456789012345678" },
          created_at: "",
          last_sign_in_at: "",
          updated_at: "",
        },
      ] as unknown as User["identities"],
    });

    expect(extractDiscordId(user)).toBe("123456789012345678");
  });

  it("falls back to the auth id when there is no Discord identity", () => {
    expect(extractDiscordId(authUser({ identities: [] }))).toBe("auth-uuid");
  });

  it("falls back to the auth id when identities is undefined", () => {
    expect(extractDiscordId(authUser({ identities: undefined }))).toBe("auth-uuid");
  });

  it("ignores non-Discord identities and falls back", () => {
    const user = authUser({
      identities: [
        {
          id: "1",
          user_id: "auth-uuid",
          identity_id: "x",
          provider: "google",
          identity_data: { provider_id: "should-be-ignored" },
          created_at: "",
          last_sign_in_at: "",
          updated_at: "",
        },
      ] as unknown as User["identities"],
    });

    expect(extractDiscordId(user)).toBe("auth-uuid");
  });
});
