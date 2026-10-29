import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

function canManageSettings(tenantCtx: NonNullable<Awaited<ReturnType<typeof getTenantContext>>>) {
  const isAdminOrOwner =
    tenantCtx.isPlatformAdmin ||
    tenantCtx.membership.isOwner ||
    tenantCtx.primaryRole === "Super Admin" ||
    tenantCtx.primaryRole === "Agency Admin" ||
    tenantCtx.roles.some((r) =>
      ["super admin", "agency admin", "admin", "company admin", "company owner"].includes(
        r.toLowerCase().trim()
      )
    );
  return isAdminOrOwner || tenantCtx.hasPermission("settings:manage");
}

export async function GET() {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  if (tenantCtx.isClientUser) {
    return NextResponse.json(
      { success: false, error: "Forbidden: Client users cannot access workspace settings" },
      { status: 403 }
    );
  }

  const tenantId = tenantCtx.tenant.id;

  const [tenant, settings] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, code: true, status: true },
    }),
    prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {},
      create: {
        tenantId,
        currency: "INR",
        timezone: "Asia/Kolkata",
        seatLimit: 10,
      },
    }),
  ]);

  return NextResponse.json(
    {
      success: true,
      data: {
        tenantId: tenant?.id || tenantId,
        name: tenant?.name || tenantCtx.tenant.name,
        code: tenant?.code || tenantCtx.tenant.code,
        status: tenant?.status || tenantCtx.tenant.status,
        logoUrl: settings.logoUrl || null,
        businessEmail: settings.businessEmail || "",
        phone: settings.phone || "",
        website: settings.website || "",
        address: settings.address || "",
        country: settings.country || "",
        currency: settings.currency || "INR",
        timezone: settings.timezone || "Asia/Kolkata",
        seatLimit: settings.seatLimit || 10,
      },
    },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

export async function PUT(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot modify workspace settings" },
        { status: 403 }
      );
    }

    if (!canManageSettings(tenantCtx)) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Missing settings:manage permission" },
        { status: 403 }
      );
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const {
      name,
      businessEmail,
      phone,
      website,
      address,
      country,
      currency,
      timezone,
      seatLimit,
      logoUrl,
    } = body;

    if (name !== undefined && (!name || typeof name !== "string" || !name.trim())) {
      return NextResponse.json(
        { success: false, error: "Organization name cannot be empty" },
        { status: 400 }
      );
    }

    const updatedTenant =
      name && typeof name === "string" && name.trim()
        ? await prisma.tenant.update({
            where: { id: tenantId },
            data: { name: name.trim() },
          })
        : await prisma.tenant.findUnique({ where: { id: tenantId } });

    const settingsData: any = {};
    if (businessEmail !== undefined) settingsData.businessEmail = businessEmail ? String(businessEmail).trim() : null;
    if (phone !== undefined) settingsData.phone = phone ? String(phone).trim() : null;
    if (website !== undefined) settingsData.website = website ? String(website).trim() : null;
    if (address !== undefined) settingsData.address = address ? String(address).trim() : null;
    if (country !== undefined) settingsData.country = country ? String(country).trim() : null;
    if (currency !== undefined && currency) settingsData.currency = String(currency).trim();
    if (timezone !== undefined && timezone) settingsData.timezone = String(timezone).trim();
    if (logoUrl !== undefined) settingsData.logoUrl = logoUrl ? String(logoUrl).trim() : null;
    if (seatLimit !== undefined && !isNaN(Number(seatLimit)) && Number(seatLimit) > 0) {
      settingsData.seatLimit = Number(seatLimit);
    }

    const updatedSettings = await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: settingsData,
      create: {
        tenantId,
        currency: settingsData.currency || "INR",
        timezone: settingsData.timezone || "Asia/Kolkata",
        seatLimit: settingsData.seatLimit || 10,
        ...settingsData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Organization profile updated successfully",
      data: {
        tenantId,
        name: updatedTenant?.name || tenantCtx.tenant.name,
        code: updatedTenant?.code || tenantCtx.tenant.code,
        status: updatedTenant?.status || tenantCtx.tenant.status,
        logoUrl: updatedSettings.logoUrl || null,
        businessEmail: updatedSettings.businessEmail || "",
        phone: updatedSettings.phone || "",
        website: updatedSettings.website || "",
        address: updatedSettings.address || "",
        country: updatedSettings.country || "",
        currency: updatedSettings.currency || "INR",
        timezone: updatedSettings.timezone || "Asia/Kolkata",
        seatLimit: updatedSettings.seatLimit || 10,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update organization settings" },
      { status: 500 }
    );
  }
}

export const PATCH = PUT;
