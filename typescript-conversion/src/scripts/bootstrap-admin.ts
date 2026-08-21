import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@salon.local";
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const firstName = process.env.ADMIN_FIRST_NAME ?? "System";
  const lastName = process.env.ADMIN_LAST_NAME ?? "Admin";
  const clerkId = process.env.ADMIN_CLERK_ID ?? null;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${existing.id} (${existing.email})`);
    return;
  }

  const admin = await prisma.user.create({
    data: {
      username,
      email,
      fname: firstName,
      lname: lastName,
      fullName: `${firstName} ${lastName}`,
      role: "ADMIN",
      approvalStatus: "APPROVED",
      clerkId: clerkId ?? undefined,
      phone: process.env.ADMIN_PHONE ?? null,
      password: null
    }
  });

  console.log(`Created admin user: ${admin.id} (${admin.email})`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
}
