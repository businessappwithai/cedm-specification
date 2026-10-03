import { getDb } from "../src/lib/db/config";
import { checkPassword, getCredential } from "./lib/credentials";

async function verifyAdmin() {
  const db = getDb();
  const admin = await db
    .selectFrom("users")
    .selectAll()
    .where("email", "=", "admin@admin.com")
    .executeTakeFirst();

  if (admin) {
    console.log("Admin user found:", admin.email);
    const isValid = await checkPassword(db, admin.id, "admin");
    console.log("Password validation:", isValid ? "SUCCESS ✓" : "FAILED ✗");

    if (!isValid) {
      const credential = await getCredential(db, admin.id);
      console.log(
        credential?.password
          ? `Password hash starts with: ${credential.password.substring(0, 20)}`
          : "No credential row in auth_accounts — Better Auth has nothing to verify against"
      );
    }
  } else {
    console.log("Admin user NOT found");
  }

  await db.destroy();
}

verifyAdmin();
