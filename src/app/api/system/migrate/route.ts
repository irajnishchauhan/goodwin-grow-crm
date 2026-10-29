import { NextResponse } from "next/server";
import { ensureDatabaseSchema, ensureRubricPersonas } from "@/lib/db/auto-migrate";
import { getCurrentSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const migrateSecret = process.env.MIGRATE_SECRET;
    const headerSecret = req.headers.get("x-migrate-secret");
    const hasValidSecret = Boolean(migrateSecret && headerSecret && headerSecret === migrateSecret);

    if (!hasValidSecret) {
      const session = await getCurrentSession();
      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
      if (!session.user.isPlatformAdmin) {
        return NextResponse.json(
          { success: false, error: "Forbidden: Platform admin access required" },
          { status: 403 }
        );
      }
    }

    await ensureDatabaseSchema();
    await ensureRubricPersonas();

    const users = await prisma.user.findMany({
      select: { email: true, fullName: true, isPlatformAdmin: true },
    });

    return NextResponse.json({
      success: true,
      message: "Database schema and rubric personas synced successfully",
      timestamp: new Date().toISOString(),
      databaseConnected: true,
      userCount: users.length,
      users: users.map((u) => u.email),
    });
  } catch (err: any) {
    console.error("System migrate error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to migrate database",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
