// Creates (or resets) the Boss account.
// Usage: npm run create-boss -- "Full Name" 0712345678 [email]
import { randomBytes } from "node:crypto";
import { scriptDb } from "./db.mts";
import { users } from "../src/db/schema.ts";
import { hashPassword } from "../src/lib/auth/password.ts";
import { normalizePhone } from "../src/lib/phone.ts";

const [name, rawPhone, email] = process.argv.slice(2);
if (!name || !rawPhone) {
  console.error('Usage: npm run create-boss -- "Full Name" 0712345678 [email]');
  process.exit(1);
}
const phone = normalizePhone(rawPhone);
if (!phone) {
  console.error("That phone number doesn't look like a Kenyan number.");
  process.exit(1);
}
const tempPassword = randomBytes(9).toString("base64url");
const passwordHash = await hashPassword(tempPassword);

const { db, close } = await scriptDb();
await db
  .insert(users)
  .values({ name, phone, email: email?.toLowerCase() || null, passwordHash, roles: ["boss"], mustChangePassword: true })
  .onConflictDoUpdate({
    target: users.phone,
    set: { name, passwordHash, roles: ["boss"], mustChangePassword: true, suspendedAt: null, failedLogins: 0, lockedUntil: null },
  });
await close();
console.log(`Boss account ready for ${phone}.`);
console.log(`Temporary password: ${tempPassword}`);
console.log("You'll be asked to choose a new password on first login.");
