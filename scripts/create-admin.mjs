#!/usr/bin/env node
/**
 * Create (or update) an admin user for the Hadetha portal.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/create-admin.mjs --email admin@example.com [--password S3cret!] [--role super_admin]
 *
 * - Reads the service-role key from the environment ONLY. Never hardcode it,
 *   never expose it to the client bundle, never commit it.
 * - Idempotent: an existing user gets its password/role updated instead of
 *   erroring.
 * - Stores the role in app_metadata (users can edit their own user_metadata,
 *   so it must never carry authorization), and mirrors it into the profiles
 *   row — the RLS policies read profiles via has_admin_role().
 * - Generates a strong random password when none is provided and prints it.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const args = process.argv.slice(2);
function arg(name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = arg("email") || process.env.ADMIN_EMAIL;
const role = arg("role") || "super_admin";
const VALID_ROLES = ["super_admin", "admin", "editor", "reviewer", "viewer"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in the environment.\n" +
      "Find the service role key in Supabase Dashboard → Project Settings → API keys."
  );
  process.exit(1);
}
if (!email) {
  console.error("Provide the admin email via --email or ADMIN_EMAIL.");
  process.exit(1);
}
if (!VALID_ROLES.includes(role)) {
  console.error(`--role must be one of: ${VALID_ROLES.join(", ")}`);
  process.exit(1);
}

function generatePassword() {
  /* 24 chars from a 66-symbol alphabet ≈ 145 bits of entropy. */
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  return Array.from(randomBytes(24), (byte) => alphabet[byte % alphabet.length]).join("");
}

const providedPassword = arg("password") || process.env.ADMIN_PASSWORD;
const password = providedPassword || generatePassword();

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function findUserByEmail(target) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === target.toLowerCase());
    if (match) return match;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

const existing = await findUserByEmail(email);
let userId;

if (existing) {
  const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...existing.app_metadata, role }
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Updated existing user ${email}`);
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role }
  });
  if (error) throw error;
  userId = data.user.id;
  console.log(`Created user ${email}`);
}

/* The profiles row is the authorization source RLS actually reads. */
const { error: profileError } = await admin
  .from("profiles")
  .upsert({ id: userId, email, role, status: "active" }, { onConflict: "id" });
if (profileError) throw profileError;

console.log("");
console.log("Admin account ready:");
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log(`  Role:     ${role}`);
console.log("");
console.log("⚠ This is a TEST credential. Rotate the password and delete or");
console.log("  downgrade this account before going to production.");
