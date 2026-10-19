import { NextResponse } from "next/server";
import { ensureDatabaseSchema, ensureRubricPersonas } from "@/lib/db/auto-migrate";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
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

export async function POST() {
  return GET();
}
