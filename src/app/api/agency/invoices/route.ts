import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");

  // Client Isolation: Enforce client access
  if (tenantCtx.isClientUser) {
    if (!tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: No client associated with account" },
        { status: 403 }
      );
    }
    if (clientId && clientId !== tenantCtx.agencyClientId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Cross-client invoice access is strictly prohibited" },
        { status: 403 }
      );
    }
  }

  const whereClause: any = { tenantId: tenantCtx.tenant.id };
  if (status && status !== "ALL") whereClause.status = status;

  if (tenantCtx.isClientUser) {
    whereClause.clientId = tenantCtx.agencyClientId;
  } else if (clientId && clientId !== "ALL") {
    whereClause.clientId = clientId;
  }

  const invoices = await prisma.agencyInvoice.findMany({
    where: whereClause,
    orderBy: { issueDate: "desc" },
    include: {
      client: { select: { id: true, name: true, brandName: true, email: true, phone: true } },
    },
  });

  return NextResponse.json({ success: true, data: invoices });
}

export async function POST(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (tenantCtx.isClientUser) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Client users cannot issue invoices" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      clientId,
      isNewClient,
      newClientName,
      newClientBrand,
      newClientEmail,
      newClientPhone,
      newClientGstin,
      autoEnrollClient,
      subtotal,
      taxAmount,
      totalAmount,
      dueDate,
      items,
      paymentMethod,
    } = body;

    let targetClientId: string | null = clientId && clientId !== "NEW" ? clientId : null;
    let targetClientName: string | null = null;
    let billingDetails: any = null;

    if (isNewClient || clientId === "NEW") {
      if (!newClientName?.trim() && !newClientBrand?.trim()) {
        return NextResponse.json(
          { success: false, error: "New client name or brand name is required" },
          { status: 400 }
        );
      }
      targetClientName = (newClientName?.trim() || newClientBrand?.trim())!;
      billingDetails = {
        brandName: newClientBrand?.trim() || null,
        email: newClientEmail?.trim() || null,
        phone: newClientPhone?.trim() || null,
        gstin: newClientGstin?.trim() || null,
      };

      if (autoEnrollClient) {
        const enrolled = await prisma.agencyClient.create({
          data: {
            tenantId: tenantCtx.tenant.id,
            name: targetClientName || "New Agency Client",
            brandName: newClientBrand?.trim() || null,
            email: newClientEmail?.trim() || null,
            phone: newClientPhone?.trim() || null,
            status: "ACTIVE",
            activePackage: items?.[0]?.description || "Basic — Digital Foundation & Local Leads",
            monthlyRetainer: subtotal ? Number(subtotal) : 18000,
            billingCycle: "MONTHLY",
          },
        });
        targetClientId = enrolled.id;
      }
    } else {
      if (!targetClientId) {
        return NextResponse.json({ success: false, error: "Client is required" }, { status: 400 });
      }
      const existingClient = await prisma.agencyClient.findFirst({
        where: { id: targetClientId, tenantId: tenantCtx.tenant.id },
      });
      if (existingClient) {
        targetClientName = existingClient.brandName || existingClient.name;
        billingDetails = {
          brandName: existingClient.brandName,
          email: existingClient.email,
          phone: existingClient.phone,
        };
      } else {
        const partner = await prisma.batteryPartner.findFirst({
          where: { id: targetClientId, tenantId: tenantCtx.tenant.id },
        });
        if (partner) {
          targetClientName = partner.businessName;
          billingDetails = {
            partnerId: partner.id,
            code: partner.code,
            ownerName: partner.ownerName,
            phone: partner.phone,
            email: partner.email,
            gstin: partner.gstin,
            pan: partner.pan,
            address: partner.address,
            city: partner.city,
            state: partner.state,
            pincode: partner.pincode,
            territory: partner.territory,
            type: partner.type,
          };
          // Set to null to satisfy foreign key constraint on AgencyClient
          targetClientId = null;
        }
      }
    }

    const isBatteriesTenant = tenantCtx.tenant.code === "goodwin-batteries";
    const invoicePrefix = isBatteriesTenant ? "GB-INV-2026-" : "INV-GGA-2026-";

    const existingInvoices = await prisma.agencyInvoice.findMany({
      where: { tenantId: tenantCtx.tenant.id },
      select: { invoiceNumber: true },
    });
    let maxSeq = existingInvoices.length;
    for (const inv of existingInvoices) {
      const match = inv.invoiceNumber?.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) maxSeq = num;
      }
    }
    let nextSeq = maxSeq + 1;
    let invoiceNumber = `${invoicePrefix}${String(nextSeq).padStart(3, "0")}`;
    const existingNumberSet = new Set(existingInvoices.map((i) => i.invoiceNumber));
    while (existingNumberSet.has(invoiceNumber)) {
      nextSeq += 1;
      invoiceNumber = `${invoicePrefix}${String(nextSeq).padStart(3, "0")}`;
    }

    const sub = subtotal ? Number(subtotal) : 0;
    const tax = taxAmount !== undefined ? Number(taxAmount) : sub * 0.18; // default 18% GST
    const total = totalAmount ? Number(totalAmount) : sub + tax;

    const resolvedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 86400000);

    const invoice = await prisma.agencyInvoice.create({
      data: {
        tenantId: tenantCtx.tenant.id,
        clientId: targetClientId,
        clientName: targetClientName,
        clientBillingDetails: billingDetails || undefined,
        invoiceNumber,
        issueDate: new Date(),
        dueDate: resolvedDueDate,
        subtotal: sub,
        taxAmount: tax,
        totalAmount: total,
        status: "SENT",
        items: items || [],
        paymentMethod: paymentMethod || (isBatteriesTenant ? "NEFT / RTGS / Cheque" : "Bank Transfer / UPI"),
      },
      include: {
        client: { select: { id: true, name: true, brandName: true, email: true, phone: true } },
      },
    });

    // If this invoice was created for a battery partner, sync to BatteryCollection and partner outstanding
    if (billingDetails?.partnerId && isBatteriesTenant) {
      await prisma.batteryCollection.create({
        data: {
          tenantId: tenantCtx.tenant.id,
          partnerId: billingDetails.partnerId,
          invoiceNumber,
          amountDue: total,
          amountPaid: 0,
          dueDate: resolvedDueDate,
          status: "PENDING",
          ageingDays: 0,
          followUpNotes: `Generated via ERP Invoicing for ${targetClientName}`,
        },
      }).catch((e) => console.warn("Battery collection invoice creation notice:", e));

      await prisma.batteryPartner.update({
        where: { id: billingDetails.partnerId },
        data: {
          outstandingBalance: {
            increment: total,
          },
        },
      }).catch((e) => console.warn("Battery partner balance update notice:", e));
    }

    return NextResponse.json({ success: true, data: invoice });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const tenantCtx = await getTenantContext();
    if (!tenantCtx) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    if (tenantCtx.isClientUser) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!tenantCtx.hasPermission("invoices:delete") && !tenantCtx.hasPermission("invoices:write")) {
      return NextResponse.json({ success: false, error: "Forbidden: Missing invoices:delete permission" }, { status: 403 });
    }

    const tenantId = tenantCtx.tenant.id;
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "Valid array of invoice IDs required" }, { status: 400 });
    }

    const deleted = await prisma.agencyInvoice.deleteMany({
      where: {
        id: { in: ids },
        tenantId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.count} invoices`,
      deletedCount: deleted.count,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
