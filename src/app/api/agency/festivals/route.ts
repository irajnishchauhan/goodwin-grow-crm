import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant/context";

const initialDefaultFestivals = [
  {
    date: "Oct 20, 2026",
    title: "Dussehra / Vijayadashami",
    tag: "Festival",
    desc: "Auspicious new vehicle & home purchase campaigns",
  },
  {
    date: "Nov 06, 2026",
    title: "Dhanteras & Gold Muhurat",
    tag: "Major Festive",
    desc: "Vehicle detailing & gold jewellery festive offers",
  },
  {
    date: "Nov 08, 2026",
    title: "Diwali (Deepavali)",
    tag: "National Festival",
    desc: "Grand festive sales, brand greetings & holiday offers",
  },
  {
    date: "Nov 10, 2026",
    title: "Bhai Dooj",
    tag: "Festival",
    desc: "Gifting and family celebration creative campaigns",
  },
  {
    date: "Nov 15, 2026",
    title: "Chhath Puja",
    tag: "Regional Festival",
    desc: "Bihar & UP vernacular campaigns and solar celebrations",
  },
  {
    date: "Nov 27, 2026",
    title: "Black Friday & Cyber Weekend",
    tag: "E-Commerce",
    desc: "D2C brands mega flash sale campaigns",
  },
  {
    date: "Dec 25, 2026",
    title: "Christmas & Year-End Countdown",
    tag: "Holiday",
    desc: "Year-end party packages & wellness resolutions",
  },
  {
    date: "Jan 01, 2027",
    title: "New Year 2027 Kickoff",
    tag: "Global Event",
    desc: "Annual goal setting, fitness memberships & resolutions",
  },
];

export async function GET(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;
  const url = new URL(req.url);
  const shouldSeed = url.searchParams.get("seed") === "true";

  try {
    // 1. Purge legacy incorrect festival dates (Oct 28, Oct 30, Nov 02)
    await prisma.$executeRawUnsafe(
      `DELETE FROM "marketing_festivals" 
       WHERE "tenant_id" = $1 AND ("date" LIKE '%Oct 28%' OR "date" LIKE '%Oct 30%' OR "date" LIKE '%Nov 02%')`,
      tenantId
    ).catch(() => {});

    // 2. Query marketing_festivals for this tenant
    let rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT "id", "date", "title", "tag", "desc", "created_at" as "createdAt", "updated_at" as "updatedAt"
       FROM "marketing_festivals"
       WHERE "tenant_id" = $1
       ORDER BY "created_at" ASC`,
      tenantId
    );

    // 3. Only seed if explicitly requested via query param ?seed=true
    if (rows.length === 0 && shouldSeed) {
      for (const item of initialDefaultFestivals) {
        const id = crypto.randomUUID();
        await prisma.$executeRawUnsafe(
          `INSERT INTO "marketing_festivals" ("id", "tenant_id", "date", "title", "tag", "desc", "created_at", "updated_at")
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          id,
          tenantId,
          item.date,
          item.title,
          item.tag,
          item.desc
        );
      }

      rows = await prisma.$queryRawUnsafe(
        `SELECT "id", "date", "title", "tag", "desc", "created_at" as "createdAt", "updated_at" as "updatedAt"
         FROM "marketing_festivals"
         WHERE "tenant_id" = $1
         ORDER BY "created_at" ASC`,
        tenantId
      );
    }

    return NextResponse.json({ success: true, data: rows });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const tenantCtx = await getTenantContext();
  if (!tenantCtx) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = tenantCtx.tenant.id;

  try {
    const body = await req.json();

    // Action 1: Seed default standard festivals
    if (body.action === "seed-defaults") {
      // Clear legacy/incorrect ones first
      await prisma.$executeRawUnsafe(
        `DELETE FROM "marketing_festivals" WHERE "tenant_id" = $1`,
        tenantId
      ).catch(() => {});

      for (const item of initialDefaultFestivals) {
        const id = crypto.randomUUID();
        await prisma.$executeRawUnsafe(
          `INSERT INTO "marketing_festivals" ("id", "tenant_id", "date", "title", "tag", "desc", "created_at", "updated_at")
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          id,
          tenantId,
          item.date,
          item.title,
          item.tag,
          item.desc
        );
      }

      const seededRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT "id", "date", "title", "tag", "desc", "created_at" as "createdAt", "updated_at" as "updatedAt"
         FROM "marketing_festivals"
         WHERE "tenant_id" = $1
         ORDER BY "created_at" ASC`,
        tenantId
      );

      return NextResponse.json({
        success: true,
        message: "Standard 2026-2027 Indian marketing festival dates loaded successfully",
        data: seededRows,
      });
    }

    // Action 2: Clear all festivals
    if (body.action === "clear-all") {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "marketing_festivals" WHERE "tenant_id" = $1`,
        tenantId
      );
      return NextResponse.json({
        success: true,
        message: "All festivals removed from calendar",
        data: [],
      });
    }

    // Action 3: Purge 3 wrong dates
    if (body.action === "delete-wrong-dates") {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "marketing_festivals" 
         WHERE "tenant_id" = $1 AND ("date" LIKE '%Oct 28%' OR "date" LIKE '%Oct 30%' OR "date" LIKE '%Nov 02%')`,
        tenantId
      );
      return NextResponse.json({
        success: true,
        message: "Removed incorrect dummy festival dates",
      });
    }

    const { date, title, tag = "Festival", desc = "" } = body;

    if (!date || !title) {
      return NextResponse.json(
        { success: false, error: "Date and title are required for a festival / event" },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "marketing_festivals" ("id", "tenant_id", "date", "title", "tag", "desc", "created_at", "updated_at")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      id,
      tenantId,
      date.trim(),
      title.trim(),
      tag.trim(),
      desc.trim()
    );

    return NextResponse.json({
      success: true,
      message: "Festival added to calendar successfully",
      data: { id, tenantId, date, title, tag, desc },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
