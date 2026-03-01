import { describe, it, expect } from "vitest";
import { createErrorResponse } from "./errors";

describe("createErrorResponse", () => {
  it("vrací JSON s polem error a statusem", async () => {
    const res = createErrorResponse("Unauthorized", 401);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("použije výchozí status 500", async () => {
    const res = createErrorResponse("Server error");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Server error");
  });
});
