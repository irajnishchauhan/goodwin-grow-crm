import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { verifyClientConfidentialAccess } from "@/lib/agency/auth-guard";
import { encryptCredential, decryptCredential } from "@/lib/agency/crypto";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; credId: string }> }
) {
  try {
    const { id, credId } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot modify stored agency credentials" },
        { status: 403 }
      );
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not authorized to modify credentials for this client" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      platform,
      accountIdentifier,
      password,
      loginUrl,
      recoveryDetails,
      accessLevel,
      notes,
    } = body;

    const existing = await prisma.agencyClientCredential.findFirst({
      where: { id: credId, clientId: id, tenantId: tenantCtx.tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Credential record not found" }, { status: 404 });
    }

    let encryptedPassword = existing.encryptedPassword;
    if (password !== undefined) {
      encryptedPassword = password ? encryptCredential(password) : null;
    }

    const updated = await prisma.agencyClientCredential.update({
      where: { id: credId },
      data: {
        platform: platform !== undefined ? platform.trim() : existing.platform,
        accountIdentifier: accountIdentifier !== undefined ? accountIdentifier.trim() : existing.accountIdentifier,
        encryptedPassword,
        loginUrl: loginUrl !== undefined ? loginUrl?.trim() || null : existing.loginUrl,
        recoveryDetails: recoveryDetails !== undefined ? recoveryDetails?.trim() || null : existing.recoveryDetails,
        accessLevel: accessLevel !== undefined ? accessLevel : existing.accessLevel,
        notes: notes !== undefined ? notes?.trim() || null : existing.notes,
      },
    });

    const { encryptedPassword: _omitted, ...safeUpdated } = updated;

    await prisma.auditLog.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        userId: tenantCtx.user.id,
        action: "UPDATE_CLIENT_CREDENTIAL",
        entityType: "AgencyClientCredential",
        entityId: updated.id,
        metadata: { clientId: id, platform: updated.platform, accountIdentifier: updated.accountIdentifier },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        ...safeUpdated,
        password: password !== undefined ? password : (updated.encryptedPassword ? decryptCredential(updated.encryptedPassword) : ""),
      },
    });
  } catch (err: any) {
    console.error("PUT client credential error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export const PATCH = PUT;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; credId: string }> }
) {
  try {
    const { id, credId } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot modify stored agency credentials" },
        { status: 403 }
      );
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Not authorized to delete credentials for this client" },
        { status: 403 }
      );
    }

    await prisma.agencyClientCredential.deleteMany({
      where: { id: credId, clientId: id, tenantId: tenantCtx.tenant.id },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        userId: tenantCtx.user.id,
        action: "DELETE_CLIENT_CREDENTIAL",
        entityType: "AgencyClientCredential",
        entityId: credId,
        metadata: { clientId: id },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Credential removed successfully" });
  } catch (err: any) {
    console.error("DELETE client credential error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
