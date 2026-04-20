import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function main() {
  const email = "admin@eduhub.com";
  const password = "admin";
  const fullName = "Admin User";

  console.log(`Creating admin account: ${email}...`);

  const prismaAny = prisma as any;
  
  const existingUser = await prismaAny.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Admin account already exists.");
    return;
  }

  const user = await prismaAny.user.create({
    data: {
      email,
      fullName,
      role: "ADMIN",
      passwordHash: hashPassword(password),
    },
  });

  console.log("Admin account created successfully!");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
