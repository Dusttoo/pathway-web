import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseJsonBody } from "../validation";

const schema = z.object({ name: z.string().min(1), level: z.number().int().min(1).max(20) });

function jsonRequest(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("parseJsonBody", () => {
  it("returns parsed, typed data for a valid body", async () => {
    const result = await parseJsonBody(jsonRequest(JSON.stringify({ name: "Aurelius", level: 3 })), schema);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ name: "Aurelius", level: 3 });
    }
  });

  it("returns a 400 response when the body is not valid JSON", async () => {
    const result = await parseJsonBody(jsonRequest("not json"), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
    }
  });

  it("returns a 422 response when the body fails schema validation", async () => {
    const result = await parseJsonBody(jsonRequest(JSON.stringify({ name: "", level: 99 })), schema);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(422);
      const payload = (await result.response.json()) as { error: string };
      expect(payload.error).toContain("name");
    }
  });
});
