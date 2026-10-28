import { TenantContext } from "@/lib/tenant/context";

export interface ClientAccessCheck {
  isSuperAdmin: boolean;
  isAssignedAdmin: boolean;
  canAccessConfidentialNotes: boolean;
  roleDescription: string;
}

/**
 * Checks whether the current user is a Super Admin or the assigned Account Manager
 * for a specific client profile to maintain strict data confidentiality.
 */
export function verifyClientConfidentialAccess(
  tenantCtx: TenantContext,
  client: {
    accountManagerId?: string | null;
    accountManagerName?: string | null;
    email?: string | null;
  }
): ClientAccessCheck {
  // 1. Super Admin Check
  const isSuperAdmin = Boolean(
    tenantCtx?.isPlatformAdmin ||
    tenantCtx?.membership?.isOwner ||
    tenantCtx?.primaryRole === "Super Admin" ||
    tenantCtx?.roles?.includes("Agency Admin") ||
    tenantCtx?.roles?.includes("Company Admin") ||
    tenantCtx?.roles?.includes("Company Owner") ||
    tenantCtx?.roles?.includes("Super Admin") ||
    tenantCtx?.roles?.includes("Tenant Admin")
  );

  // 2. Assigned Admin / Account Manager Check
  const userNameLower = tenantCtx.user.fullName?.toLowerCase().trim() || "";
  const clientManagerNameLower = client.accountManagerName?.toLowerCase().trim() || "";

  const isAssignedAdmin = Boolean(
    (client.accountManagerId && client.accountManagerId === tenantCtx.user.id) ||
    (clientManagerNameLower && userNameLower && (
      userNameLower.includes(clientManagerNameLower) ||
      clientManagerNameLower.includes(userNameLower)
    )) ||
    (client.email && client.email.toLowerCase() === tenantCtx.user.email.toLowerCase())
  );

  const canAccessConfidentialNotes = isSuperAdmin || isAssignedAdmin;

  let roleDescription = "Restricted Member";
  if (isSuperAdmin) roleDescription = "Super Admin";
  else if (isAssignedAdmin) roleDescription = "Assigned Account Manager";

  return {
    isSuperAdmin,
    isAssignedAdmin,
    canAccessConfidentialNotes,
    roleDescription,
  };
}
