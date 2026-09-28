import { getDb } from "../src/lib/db/config";
import { randomBytes, randomUUID } from "node:crypto";
import { SESSION_COOKIE_NAME } from "../src/lib/auth/better-auth";

const db = getDb();

// Get admin user
const adminUser = await db
  .selectFrom("users")
  .selectAll()
  .where("email", "=", "admin@admin.com")
  .executeTakeFirst();

if (!adminUser) {
  console.error("Admin user not found");
  process.exit(1);
}

// Mint a session the way Better Auth stores one: a row in auth_sessions keyed
// by a random token. Signing in through the API would need the password, which
// a diagnostic script has no business knowing.
//
// The cookie is deliberately unsigned. Better Auth signs its own cookies, but
// the session is resolved by looking the token up in the database — so an
// unsigned token resolves, and a forged one would have to guess 32 random
// bytes to find a row.
const sessionToken = randomBytes(32).toString("hex");
await db
  .insertInto("auth_sessions")
  .values({
    id: randomUUID(),
    user_id: adminUser.id,
    token: sessionToken,
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
    ip_address: null,
    user_agent: "scripts/test-nl-with-auth.ts",
    created_at: new Date(),
    updated_at: new Date(),
  })
  .execute();

console.log(`✅ Created session token for: ${adminUser.email}`);

// Get hospital data source
const dataSource = await db
  .selectFrom("data_sources")
  .selectAll()
  .where("name", "=", "hospital_management_system")
  .executeTakeFirst();

if (!dataSource) {
  console.error("hospital_management_system data source not found");
  process.exit(1);
}

console.log(`✅ Found data source: ${dataSource.name}`);
console.log(`\n🔗 Testing NL Query with authentication...`);

// Test the CopilotKit endpoint with session token
const response = await fetch("http://localhost:4050/api/copilotkit", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
  },
  body: JSON.stringify({
    path: "/execute",
    input: {
      message: "How many patients are in the database?",
      dataSourceId: dataSource.id,
    },
  }),
});

const result = await response.json();

console.log("\nResponse:");
console.log(JSON.stringify(result, null, 2));

if (result.success) {
  console.log("\n✅ NL Query test successful!");
  console.log(`\nGenerated SQL:\n${result.result.sql}`);
} else {
  console.log("\n❌ NL Query test failed!");
  console.log(`Error: ${result.error}`);
}

process.exit(0);
