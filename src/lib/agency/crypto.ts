import crypto from "crypto";

const ENCRYPTION_KEY = process.env.CREDENTIALS_SECRET_KEY || "goodwin-grow-ai-crm-vault-key-32b!"; // 32 characters key
const IV_LENGTH = 16;

/**
 * Encrypts a client password/token using AES-256-CBC with dynamic IV.
 */
export function encryptCredential(text: string): string {
  if (!text) return "";
  try {
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

/**
 * Decrypts an encrypted client password/token.
 */
export function decryptCredential(encryptedText: string): string {
  if (!encryptedText) return "";
  // Check if text is in iv:encrypted format
  if (!encryptedText.includes(":")) return encryptedText;

  try {
    const [ivHex, encrypted] = encryptedText.split(":");
    if (!ivHex || !encrypted) return encryptedText;

    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return encryptedText;
  }
}

/**
 * Masks a credential value (e.g. "••••••••").
 */
export function maskCredential(val: string): string {
  if (!val) return "—";
  return "••••••••••••";
}
