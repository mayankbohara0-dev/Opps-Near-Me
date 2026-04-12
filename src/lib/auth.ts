"use server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { signToken, verifyToken as verifyJwt } from "@/lib/jwt";
import { sendVerificationEmail } from "@/lib/mail";
import fs from "fs";
import path from "path";

// ─── Auth Types ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  verified?: boolean;
  verifyToken?: string;
}

export type AuthError = { field?: string; message: string };

// ─── Admin Credentials ───────────────────────────────────────────
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

const ADMIN_USER: User = {
  id:        "admin-001",
  name:      "Admin User",
  email:     ADMIN_EMAIL,
  role:      "admin",
  createdAt: "2026-01-01T00:00:00Z",
};

// ─── Ephemeral File DB ────────────────────────────────────────────────────────
const dbPath = path.join(process.cwd(), ".app-users.json");

function getStoredUsers(): Array<User & { password: string }> {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
    }
  } catch (e) {
    console.error("Error reading users db:", e);
  }
  return [];
}

function saveStoredUsers(users: Array<User & { password: string }>) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(users));
  } catch (e) {
    console.error("Error writing users db:", e);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId() {
  return "user-" + Math.random().toString(36).slice(2, 10);
}

// ─── Session Management ───────────────────────────────────────────────────────
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("secure_auth_token")?.value;
  if (!token) return null;

  const decoded = await verifyJwt(token);
  if (!decoded || !decoded.user) return null;
  return decoded.user as User;
}

export async function loginAction(email: string, password: string): Promise<{ user: User } | { error: AuthError }> {
  const e = email.trim().toLowerCase();
  const p = password.trim();

  let userToLogin: User | null = null;

  // Check admin first
  if (e === ADMIN_EMAIL && p === ADMIN_PASSWORD) {
    userToLogin = ADMIN_USER;
  } else {
    // Check registered users
    const users = getStoredUsers();
    const found  = users.find(u => u.email.toLowerCase() === e);
    if (!found) return { error: { field: "email", message: "No account found with this email" } };
    
    if (found.verified === false) {
      return { error: { field: "general", message: "Please verify your email address. Check your inbox!" } };
    }

    // SECURE BCRYPT VERIFICATION
    const isMatch = bcrypt.compareSync(p, found.password);
    if (!isMatch) return { error: { field: "password", message: "Incorrect password" } };

    const { password: _pw, ...user } = found;
    userToLogin = user;
  }

  // Create JWT and Set Secure HttpOnly Cookie
  const token = await signToken({ user: userToLogin });
  (await cookies()).set("secure_auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 86400 * 7 // 1 week
  });

  return { user: userToLogin };
}

export async function registerAction(
  name: string,
  email: string,
  password: string,
): Promise<{ pendingVerification: boolean } | { error: AuthError }> {
  const e = email.trim().toLowerCase();
  const n = name.trim();
  const p = password.trim();

  if (!n)             return { error: { field: "name",     message: "Name is required" } };
  if (!e)             return { error: { field: "email",    message: "Email is required" } };
  if (!e.endsWith("@gmail.com")) return { error: { field: "email", message: "Only Google (@gmail.com) accounts are allowed to register." } };
  if (p.length < 6)   return { error: { field: "password", message: "Password must be at least 6 characters" } };
  if (e === ADMIN_EMAIL) return { error: { field: "email", message: "This email is already registered" } };

  const users = getStoredUsers();
  if (users.some(u => u.email.toLowerCase() === e)) {
    return { error: { field: "email", message: "An account with this email already exists" } };
  }

  const tokenHex = Math.random().toString(36).substring(2) + Date.now().toString(36) + Math.random().toString(36).substring(2);

  const newUser: User = {
    id:        genId(),
    name:      n,
    email:     e,
    role:      "user",
    createdAt: new Date().toISOString(),
    verified:  false,
    verifyToken: tokenHex,
  };

  // SECURE BCRYPT HASHING
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(p, salt);

  users.push({ ...newUser, password: hashedPassword });
  saveStoredUsers(users);

  // Trigger Email
  await sendVerificationEmail(e, tokenHex);

  return { pendingVerification: true };
}

export async function logoutAction() {
  (await cookies()).delete("secure_auth_token");
}

export async function verifyEmailAction(token: string): Promise<boolean> {
  const users = getStoredUsers();
  const userIndex = users.findIndex(u => u.verifyToken === token);
  
  if (userIndex === -1) return false;
  
  users[userIndex].verified = true;
  users[userIndex].verifyToken = undefined;
  
  saveStoredUsers(users);
  return true;
}
