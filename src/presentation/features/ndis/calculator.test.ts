import { describe, it, expect } from "vitest";
import { calculateItemTotal } from "./utils";

describe("NDIS Budget Calculator", () => {
  it("should calculate correct totals for weekly items", () => {
    // 2 hours weekly at $193.99 for 48 weeks
    const total = calculateItemTotal(193.99, 2, "weekly", 48);
    expect(total).toBe(193.99 * 2 * 48);
  });

  it("should calculate correct totals for fortnightly items", () => {
    // 4 hours fortnightly at $65.47 for 48 weeks (corresponds to 24 fortnights)
    const total = calculateItemTotal(65.47, 4, "fortnightly", 48);
    expect(total).toBe(65.47 * 4 * 24);
  });

  it("should calculate correct totals for one-off (once) items", () => {
    const total = calculateItemTotal(234.83, 10, "once", 48);
    expect(total).toBe(234.83 * 10);
  });
});
