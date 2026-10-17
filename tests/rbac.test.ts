import { describe, it, expect } from "vitest";
import prisma from "../src/lib/prisma";
import { getTenantContext } from "../src/lib/tenant/context";
import { createSession } from "../src/lib/auth/session";

describe("RBAC & Permissions Verification", () => {
  it("should enforce granular permissions for Sales Manager vs Company Admin", async () => {
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@goodwinbatteries.com" },
    });
    const salesUser = await prisma.user.findUnique({
      where: { email: "sales@goodwinbatteries.com" },
    });
    const tenantBatteries = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });

    expect(adminUser).toBeDefined();
    expect(salesUser).toBeDefined();

    // 1. Check Company Admin permissions
    const adminSession = await createSession(adminUser!.id, tenantBatteries!.id);
    const adminCtx = await getTenantContext(adminSession.token);

    expect(adminCtx).not.toBeNull();
    expect(adminCtx?.hasPermission("settings:manage")).toBe(true);
    expect(adminCtx?.hasPermission("leads:write")).toBe(true);
    expect(adminCtx?.hasPermission("leads:delete")).toBe(true);

    // 2. Check Sales Manager permissions
    const salesSession = await createSession(salesUser!.id, tenantBatteries!.id);
    const salesCtx = await getTenantContext(salesSession.token);

    expect(salesCtx).not.toBeNull();
    expect(salesCtx?.hasPermission("leads:write")).toBe(true);
    expect(salesCtx?.hasPermission("deals:stages")).toBe(true);
    // Sales Manager should not have settings:manage
    expect(salesCtx?.hasPermission("settings:manage")).toBe(false);
  });
});
