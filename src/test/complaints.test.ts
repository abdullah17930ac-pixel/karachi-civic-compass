import { describe, expect, it } from "vitest";
import {
  applyStatus,
  createComplaint,
  generateComplaintId,
  ID_PATTERN,
  SEED_COMPLAINTS,
} from "@/lib/complaints";

describe("complaint rules", () => {
  it("new complaint gets a CC-KHI-###### id, starts as Submitted and belongs to the citizen", () => {
    const c = createComplaint(SEED_COMPLAINTS, {
      title: "Pothole on main road",
      description: "Deep pothole causing accidents every day",
      category: "roads",
      area: "Clifton",
      address: "Block 5",
    });
    expect(c.id).toMatch(ID_PATTERN);
    expect(c.status).toBe("Submitted");
    expect(c.mine).toBe(true);
    expect(c.timeline.map((e) => e.status)).toEqual(["Submitted"]);
  });

  it("never reuses an existing complaint id", () => {
    let calls = 0;
    // first draw collides with an existing id, second is free
    const rand = () => (calls++ === 0 ? (482913 - 100000) / 900000 : 0);
    const id = generateComplaintId(["CC-KHI-482913"], rand);
    expect(id).toBe("CC-KHI-100000");
  });

  it("admin status update fills the timeline up to the new step and assigns a department", () => {
    const fresh = SEED_COMPLAINTS.find((c) => c.status === "Submitted")!;
    const updated = applyStatus(fresh, "In Progress", new Date("2026-11-05T10:00:00Z"));
    expect(updated.status).toBe("In Progress");
    expect(updated.timeline.map((e) => e.status)).toEqual(["Submitted", "Under Review", "In Progress"]);
    expect(updated.department).not.toBeNull();
  });

  it("moving a complaint back removes later timeline steps", () => {
    const resolved = SEED_COMPLAINTS.find((c) => c.status === "Resolved")!;
    const back = applyStatus(resolved, "Under Review");
    expect(back.timeline.map((e) => e.status)).toEqual(["Submitted", "Under Review"]);
  });
});
