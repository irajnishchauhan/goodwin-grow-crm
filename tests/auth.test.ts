import { describe, it, expect, beforeAll, afterAll } from "vitest";
import prisma from "../src/lib/prisma";
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { createSession, getSessionByToken, destroySession } from "../src/lib/auth/session";

describe("Authentication & Session Security Tests", () => {
  it("should securely hash and verify passwords with bcrypt", async () => {
    const raw = "SuperSecret@2026!";
    const hash = await hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const valid = await verifyPassword(raw, hash);
    expect(valid).toBe(true);

    const invalid = await verifyPassword("WrongPassword!", hash);
    expect(invalid).toBe(false);
  });

  it("should create and retrieve a valid session by token", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "admin@goodwinbatteries.com" },
    });
    expect(user).toBeDefined();

    const session = await createSession(user!.id, null, "Vitest Agent", "127.0.0.1");
    expect(session.token).toBeDefined();
    expect(session.userId).toBe(user!.id);

    const retrieved = await getSessionByToken(session.token);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.user.email).toBe("admin@goodwinbatteries.com");

    await destroySession(session.token);
    const afterDestroy = await getSessionByToken(session.token);
    expect(afterDestroy).toBeNull();
  });
});
