import { NextResponse } from "next/server";

export async function GET() {
  const vaultPassword = process.env.VAULT_PASSWORD;
  return NextResponse.json({
    hasVaultPassword: !!vaultPassword,
    length: vaultPassword?.length,
    // Show first/last char to debug quotes issue without exposing the full password
    firstChar: vaultPassword?.[0],
    lastChar: vaultPassword?.[vaultPassword.length - 1],
  });
}
