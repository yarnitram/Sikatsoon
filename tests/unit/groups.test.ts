import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock next/cache so Server Actions can be tested in Vitest environment
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  getNicheGroupsAction,
  createNicheGroupAction,
  updateNicheGroupAction,
  deleteNicheGroupAction,
} from "@/app/actions/groups";
import { db, nicheGroups, nicheGroupMembers } from "@/db";
import { eq } from "drizzle-orm";

describe("Sikatsoon: Niche Groups & Multi-Niche Management", () => {
  it("fetches or seeds the default Tech & AI group", async () => {
    const groups = await getNicheGroupsAction();
    expect(groups.length).toBeGreaterThanOrEqual(1);

    const techAi = groups.find((g) => g.name === "Tech & AI");
    expect(techAi).toBeDefined();
    expect(techAi?.memberNiches).toContain("ai-tools");
  });

  it("creates a new custom Niche Group with multiple member niches", async () => {
    const result = await createNicheGroupAction({
      name: "E-Commerce & Dropshipping",
      nicheTags: ["dropshipping", "tiktokshop", "amazonfba"],
      scheduleEnabled: true,
      scheduleType: "daily",
      scheduleTime: "06:00",
    });

    expect(result.success).toBe(true);
    expect(result.group).toBeDefined();
    expect(result.group?.name).toBe("E-Commerce & Dropshipping");
    expect(result.group?.memberNiches).toEqual(["dropshipping", "tiktokshop", "amazonfba"]);
    expect(result.group?.scheduleEnabled).toBe(true);
    expect(result.group?.scheduleTime).toBe("06:00");

    // Verify persisted in DB
    const persisted = await getNicheGroupsAction();
    const found = persisted.find((g) => g.id === result.group?.id);
    expect(found).toBeDefined();
    expect(found?.memberNiches.length).toBe(3);

    // Clean up
    if (result.group?.id) {
      await deleteNicheGroupAction(result.group.id);
    }
  });

  it("updates an existing Niche Group schedule and member niches", async () => {
    // 1. Create a test group
    const created = await createNicheGroupAction({
      name: "Health & Fitness",
      nicheTags: ["fitness", "gym"],
      scheduleEnabled: false,
    });
    expect(created.success).toBe(true);
    const groupId = created.group!.id;

    // 2. Update schedule and add a new niche
    const updateRes = await updateNicheGroupAction({
      groupId,
      scheduleEnabled: true,
      scheduleTime: "12:00",
      nicheTags: ["fitness", "gym", "biohacking"],
    });
    expect(updateRes.success).toBe(true);

    // 3. Verify changes
    const groups = await getNicheGroupsAction();
    const updated = groups.find((g) => g.id === groupId);
    expect(updated?.scheduleEnabled).toBe(true);
    expect(updated?.scheduleTime).toBe("12:00");
    expect(updated?.memberNiches).toContain("biohacking");
    expect(updated?.memberNiches.length).toBe(3);

    // Clean up
    await deleteNicheGroupAction(groupId);
  });

  it("deletes a group and cascades deletion of its members", async () => {
    const created = await createNicheGroupAction({
      name: "Temporary Group",
      nicheTags: ["temp1", "temp2"],
    });
    const groupId = created.group!.id;

    const delRes = await deleteNicheGroupAction(groupId);
    expect(delRes.success).toBe(true);

    const groups = await getNicheGroupsAction();
    expect(groups.some((g) => g.id === groupId)).toBe(false);

    // Verify member records removed
    const remainingMembers = await db
      .select()
      .from(nicheGroupMembers)
      .where(eq(nicheGroupMembers.groupId, groupId));
    expect(remainingMembers.length).toBe(0);
  });
});
