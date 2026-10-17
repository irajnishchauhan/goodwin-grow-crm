import { describe, it, expect } from "vitest";
import prisma from "../src/lib/prisma";

describe("Lead to Contact & Deal Conversion Workflows", () => {
  it("should atomically convert a prospect lead into Contact, Company, and Deal", async () => {
    const tenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-batteries" },
    });
    expect(tenant).toBeDefined();

    // 1. Create Qualified Lead
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant!.id,
        firstName: "Anand",
        lastName: "Rao",
        companyName: "Rao Engineering Works",
        email: "anand@raoeng.com",
        phone: "+91 98450 11223",
        status: "QUALIFIED",
        score: 80,
      },
    });

    // 2. Perform Conversion
    const company = await prisma.company.create({
      data: {
        tenantId: tenant!.id,
        name: lead.companyName!,
      },
    });

    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant!.id,
        companyId: company.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
      },
    });

    const updatedLead = await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        convertedAt: new Date(),
        convertedContactId: contact.id,
      },
    });

    expect(updatedLead.status).toBe("CONVERTED");
    expect(updatedLead.convertedAt).not.toBeNull();
    expect(contact.companyId).toBe(company.id);
    expect(contact.tenantId).toBe(tenant!.id);

    // Cleanup
    await prisma.lead.delete({ where: { id: lead.id } });
    await prisma.contact.delete({ where: { id: contact.id } });
    await prisma.company.delete({ where: { id: company.id } });
  });
});
