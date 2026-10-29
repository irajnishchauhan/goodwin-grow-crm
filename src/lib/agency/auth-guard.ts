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
 *
 * Rules:
 * 1. Super Admin: Platform Super Admin or workspace Owner only.
 * 2. Assigned Account Manager: The specific team member assigned as accountManagerId or matching accountManagerName.
 * 3. All other team members, managers, and cross-account managers are STRICTLY RESTRICTED.
 */
export function verifyClientConfidentialAccess(
  tenantCtx: TenantContext,
  client: {
    id?: string;
    accountManagerId?: string | null;
    accountManagerName?: string | null;
    email?: string | null;
  }
): ClientAccessCheck {
  if (tenantCtx?.isClientUser) {
    return {
      isSuperAdmin: false,
      isAssignedAdmin: false,
      canAccessConfidentialNotes: false,
      roleDescription: "Client User",
    };
  }

  const adminRoles = ["super admin", "agency admin", "admin", "company admin", "company owner"];
  const normalizedPrimary = (tenantCtx?.primaryRole || "").toLowerCase().trim();
  const hasAdminRole = (tenantCtx?.roles || []).some((r) =>
    adminRoles.includes(r.toLowerCase().trim())
  );

  // 1. Super Admin Check:
  const isSuperAdmin = Boolean(
    tenantCtx?.isPlatformAdmin === true ||
    tenantCtx?.membership?.isOwner === true ||
    adminRoles.includes(normalizedPrimary) ||
    hasAdminRole
  );

  // 2. Assigned Account Manager Check:
  const currentUserId = tenantCtx.user.id;
  const currentUserName = (tenantCtx.user.fullName || "").toLowerCase().trim();

  const assignedManagerId = client.accountManagerId;
  const assignedManagerName = (client.accountManagerName || "").toLowerCase().trim();

  let isAssignedAdmin = false;

  // Primary match: user ID matches client's assigned account manager ID
  if (assignedManagerId && assignedManagerId === currentUserId) {
    isAssignedAdmin = true;
  } else if (
    assignedManagerName &&
    assignedManagerName !== "unassigned" &&
    currentUserName &&
    (currentUserName === assignedManagerName ||
      currentUserName.replace(/\s+/g, " ") === assignedManagerName.replace(/\s+/g, " "))
  ) {
    isAssignedAdmin = true;
  }

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
