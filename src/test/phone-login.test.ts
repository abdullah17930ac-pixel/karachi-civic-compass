import { describe, expect, it } from "vitest";
import { isValidPin, normalizePkPhone, prettyPkPhone } from "@/lib/phone-login";

describe("phone + PIN login", () => {
  it("accepts the usual ways people type a Pakistani mobile number", () => {
    for (const raw of [
      "03482530816",
      "0348-2530816",
      "+92 348 2530816",
      "00923482530816",
      "3482530816",
    ]) {
      expect(normalizePkPhone(raw)).toBe("923482530816");
    }
  });
  it("rejects numbers that are too short or not mobile", () => {
    expect(normalizePkPhone("0348253")).toBeNull();
    expect(normalizePkPhone("02134567890")).toBeNull();
  });
  it("shows the number back in local format", () => {
    expect(prettyPkPhone("923482530816")).toBe("0348 2530816");
  });
  it("PIN must be 4 to 6 digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12ab")).toBe(false);
  });
});
