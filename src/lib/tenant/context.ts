import prisma from "@/lib/prisma";
import { getCurrentSession, getSessionByToken, updateSessionActiveTenant } from "@/lib/auth/session";

export interface TenantContext {
  user: {
    id: string;
    email: string;
    fullName: string;
    isPlatformAdmin: boolean;
  };
  tenant: {
    id: string;
    name: string;
    code: string;
    status: string;
  };
  membership: {
    id: string;
    isOwner: boolean;
    status: string;
  };
  roles: string[];
  permissions: string[];
  isPlatformAdmin: boolean;
  hasPermission: (code: string) => boolean;
}

export async function getTenantContext(customToken?: string): Promise<TenantContext | null> {
  const session = customToken
    ? await getSessionByToken(customToken)
    : await getCurrentSession();

  if (!session || !session.user) {
    return null;
  }

  // Find target active tenant
  let activeTenantId = session.activeTenantId;

  // If no activeTenantId is set in session, auto-select first active membership
  if (!activeTenantId && session.user.memberships.length > 0) {
    activeTenantId = session.user.memberships[0].tenantId;
    await updateSessionActiveTenant(session.token, activeTenantId);
  }

  if (!activeTenantId) {
    return null;
  }

  const membership = session.user.memberships.find(
    (m: any) => m.tenantId === activeTenantId && m.status === "ACTIVE"
  );

  if (!membership) {
    return null;
  }

  const roles = membership.roles.map((mr: any) => mr.role.name);
  const permissionSet = new Set<string>();

  membership.roles.forEach((mr: any) => {
    mr.role.permissions.forEach((rp: any) => {
      permissionSet.add(rp.permission.code);
    });
  });

  // If owner or company admin, grant wildcard permissions
  if (membership.isOwner || roles.includes("Company Admin") || roles.includes("Company Owner")) {
    permissionSet.add("*");
  }

  const permissions = Array.from(permissionSet);

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      isPlatformAdmin: session.user.isPlatformAdmin,
    },
    tenant: {
      id: membership.tenant.id,
      name: membership.tenant.name,
      code: membership.tenant.code,
      status: membership.tenant.status,
    },
    membership: {
      id: membership.id,
      isOwner: membership.isOwner,
      status: membership.status,
    },
    roles,
    permissions,
    isPlatformAdmin: session.user.isPlatformAdmin,
    hasPermission: (code: string) => {
      if (membership.isOwner || permissions.includes("*")) return true;
      return permissions.includes(code);
    },
  };
}

export async function switchActiveTenant(userId: string, targetTenantId: string, sessionToken: string) {
  // Validate that user is actually an active member of this target tenant
  const membership = await prisma.tenantMembership.findUnique({
    where: {
      tenantId_userId: {
        tenantId: targetTenantId,
        userId: userId,
      },
    },
  });

  if (!membership || membership.status !== "ACTIVE") {
    throw new Error("Unauthorized: User is not an active member of this company");
  }

  await updateSessionActiveTenant(sessionToken, targetTenantId);
  return { success: true, targetTenantId };
}
