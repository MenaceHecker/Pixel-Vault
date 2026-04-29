export function validateVaultKey(request: Request): boolean {
  const key = request.headers.get("X-Vault-Key");
  return key === process.env.VAULT_SECRET_KEY;
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
