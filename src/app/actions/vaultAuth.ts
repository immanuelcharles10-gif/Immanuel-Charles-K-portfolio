"use server";

import { cookies } from "next/headers";

export async function verifyVaultPassword(password: string): Promise<boolean> {
  const correctPassword = process.env.VAULT_PASSWORD;
  
  if (!correctPassword) {
    console.error("Vault password is not configured on the server.");
    return false;
  }

  if (password === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set("vault_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return true;
  }
  
  return false;
}
