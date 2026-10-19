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
    agencyClientId?: string | null;
    agencyClient?: {
      id: string;
      name: string;
      brandName?: string | null;
    } | null;
  };
  roles: string[];
  permissions: string[];
  isPlatformAdmin: boolean;
  isClientUser: boolean;
  agencyClientId: string | null;
  primaryRole: "Super Admin" | "Agency Admin" | "Account Manager" | "Designer" | "Client" | "Member";
  hasPermission: (code: string) => boolean;
  assertClientAccess: (targetClientId?: string | null) => void;
  getClientWhereClause: (baseWhere?: Record<string, any>) => Record<string, any>;
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

  // If owner or company admin or agency admin, grant wildcard permissions
  const isAgencyAdmin =
    membership.isOwner ||
    roles.includes("Agency Admin") ||
    roles.includes("Company Admin") ||
    roles.includes("Company Owner");

  if (isAgencyAdmin) {
    permissionSet.add("*");
  }

  const permissions = Array.from(permissionSet);

  // Determine client role status and primary role
  const isClientUser = Boolean(
    roles.includes("Client") ||
    membership.agencyClientId
  );
  const agencyClientId = membership.agencyClientId || null;

  let primaryRole: TenantContext["primaryRole"] = "Member";
  if (session.user.isPlatformAdmin) {
    primaryRole = "Super Admin";
  } else if (isAgencyAdmin) {
    primaryRole = "Agency Admin";
  } else if (roles.includes("Account Manager") || roles.includes("Sales Manager")) {
    primaryRole = "Account Manager";
  } else if (roles.includes("Designer") || roles.includes("Lead Designer")) {
    primaryRole = "Designer";
  } else if (isClientUser) {
    primaryRole = "Client";
  }

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
      agencyClientId: membership.agencyClientId,
      agencyClient: membership.agencyClient,
    },
    roles,
    permissions,
    isPlatformAdmin: session.user.isPlatformAdmin,
    isClientUser,
    agencyClientId,
    primaryRole,
    hasPermission: (code: string) => {
      if (session.user.isPlatformAdmin || membership.isOwner || permissions.includes("*")) return true;
      return permissions.includes(code);
    },
    assertClientAccess: (targetClientId?: string | null) => {
      if (isClientUser) {
        if (!agencyClientId) {
          throw new Error("Client account is not assigned to an active workspace client.");
        }
        if (targetClientId && targetClientId !== agencyClientId) {
          throw new Error("Forbidden: Cross-client access is strictly prohibited.");
        }
      }
    },
    getClientWhereClause: (baseWhere: Record<string, any> = {}) => {
      const where: Record<string, any> = {
        tenantId: membership.tenant.id,
        ...baseWhere,
      };
      if (isClientUser && agencyClientId) {
        where.clientId = agencyClientId;
      }
      return where;
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
