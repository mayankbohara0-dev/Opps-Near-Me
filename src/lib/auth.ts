"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken, verifyToken as verifyJwt } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendVerificationEmail } from "@/lib/mail";

// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  verified?: boolean;
}

export type AuthError = { field?: string; message: string };

// ─── Admin Credentials ───────────────────────────────────────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const ADMIN_USER: User = {
  id:        "admin-001",
  name:      "Admin User",
  email:     ADMIN_EMAIL,
  role:      "admin",
  createdAt: "2026-01-01T00:00:00Z",
};

// ─── Session Management ───────────────────────────────────────────────────────
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("secure_auth_token")?.value;
  if (!token) return null;

  const decoded = await verifyJwt(token);
  if (!decoded || !decoded.user) return null;
  return decoded.user as User;
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function loginAction(email: string, password: string): Promise<{ user: User } | { error: AuthError }> {
  const e = email.trim().toLowerCase();
  const p = password.trim();

  let userToLogin: User | null = null;

  // 1. Check if admin
  if (e === ADMIN_EMAIL.toLowerCase() && p === ADMIN_PASSWORD) {
    userToLogin = ADMIN_USER;
  } else {
    // 2. Look up user from Supabase
    const { data: rows, error } = await supabaseAdmin
      .from("app_users")
      .select("*")
      .eq("email", e)
      .limit(1);

    if (error || !rows || rows.length === 0) {
      return { error: { field: "email", message: "No account found with this email" } };
    }

    const found = rows[0];

    if (!found.verified) {
      return { error: { field: "general", message: "Please verify your email address. Check your inbox!" } };
    }

    const isMatch = bcrypt.compareSync(p, found.password);
    if (!isMatch) return { error: { field: "password", message: "Incorrect password" } };

    userToLogin = {
      id:        found.id,
      name:      found.name,
      email:     found.email,
      role:      found.role,
      createdAt: found.created_at,
      verified:  found.verified,
    };
  }

  // Create JWT and set secure HttpOnly cookie
  const token = await signToken({ user: userToLogin });
  (await cookies()).set("secure_auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 86400 * 7, // 1 week
  });

  return { user: userToLogin };
}

// ─── Register ─────────────────────────────────────────────────────────────────
export async function registerAction(
  name: string,
  email: string,
  password: string,
): Promise<{ pendingVerification: boolean } | { error: AuthError }> {
  const e = email.trim().toLowerCase();
  const n = name.trim();
  const p = password.trim();

  if (!n)                       return { error: { field: "name",     message: "Name is required" } };
  if (!e)                       return { error: { field: "email",    message: "Email is required" } };
  if (!e.endsWith("@gmail.com"))return { error: { field: "email",    message: "Only Google (@gmail.com) accounts are allowed to register." } };
  if (p.length < 6)             return { error: { field: "password", message: "Password must be at least 6 characters" } };
  if (e === ADMIN_EMAIL.toLowerCase()) return { error: { field: "email", message: "This email is already registered" } };

  // Check if user already exists in Supabase
  const { data: existing } = await supabaseAdmin
    .from("app_users")
    .select("id")
    .eq("email", e)
    .limit(1);

  if (existing && existing.length > 0) {
    return { error: { field: "email", message: "An account with this email already exists" } };
  }

  // Hash password securely
  const salt           = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(p, salt);

  // Generate a verification token
  const verifyToken = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

  // Insert into Supabase
  const { error: insertError } = await supabaseAdmin.from("app_users").insert({
    name:         n,
    email:        e,
    password:     hashedPassword,
    role:         "user",
    verified:     false,
    verify_token: verifyToken,
  });

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return { error: { field: "general", message: "Registration failed. Please try again." } };
  }

  // Send verification email via nodemailer
  await sendVerificationEmail(e, verifyToken);

  return { pendingVerification: true };
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logoutAction() {
  (await cookies()).delete("secure_auth_token");
}

// ─── Email Verification ───────────────────────────────────────────────────────
export async function verifyEmailAction(token: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("app_users")
    .select("id")
    .eq("verify_token", token)
    .limit(1);

  if (error || !data || data.length === 0) return false;

  const { error: updateError } = await supabaseAdmin
    .from("app_users")
    .update({ verified: true, verify_token: null })
    .eq("verify_token", token);

  return !updateError;
}
