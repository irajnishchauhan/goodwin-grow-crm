import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";
import { verifyClientConfidentialAccess } from "@/lib/agency/auth-guard";
import { encryptCredential, decryptCredential } from "@/lib/agency/crypto";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        name: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // RBAC: Restricted to Super Admin and the client's assigned Account Manager
    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: Client login credentials are confidential and restricted to Super Admins and the client's assigned Account Manager.",
          accessGranted: false,
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");

    const whereClause: any = {
      tenantId: tenantCtx.tenant.id,
      clientId: id,
    };

    if (platform && platform !== "ALL") {
      whereClause.platform = platform;
    }

    const credentials = await prisma.agencyClientCredential.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    const decrypted = credentials.map((c) => ({
      ...c,
      password: c.encryptedPassword ? decryptCredential(c.encryptedPassword) : "",
    }));

    return NextResponse.json({
      success: true,
      data: decrypted,
      accessRole: access.roleDescription,
    });
  } catch (err: any) {
    console.error("GET client credentials error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const client = await prisma.agencyClient.findFirst({
      where: { id, tenantId: tenantCtx.tenant.id },
      select: {
        id: true,
        name: true,
        accountManagerId: true,
        accountManagerName: true,
        email: true,
      },
    });

    if (!client) {
      return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 });
    }

    // RBAC: Restricted to Super Admin and the client's assigned Account Manager
    const access = verifyClientConfidentialAccess(tenantCtx, client);
    if (!access.canAccessConfidentialNotes) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden: You are not authorized to store credentials for this client.",
        },
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

    if (!platform || !accountIdentifier) {
      return NextResponse.json(
        { success: false, error: "Platform name and account identifier (username/email) are required" },
        { status: 400 }
      );
    }

    const encryptedPassword = password ? encryptCredential(password) : null;

    const newCred = await prisma.agencyClientCredential.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: id,
        platform: platform.trim(),
        accountIdentifier: accountIdentifier.trim(),
        encryptedPassword,
        loginUrl: loginUrl?.trim() || null,
        recoveryDetails: recoveryDetails?.trim() || null,
        accessLevel: accessLevel || "ADMIN",
        notes: notes?.trim() || null,
        isVerified: true,
        createdById: tenantCtx.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...newCred,
        password: password || "",
      },
    });
  } catch (err: any) {
    console.error("POST client credential error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
