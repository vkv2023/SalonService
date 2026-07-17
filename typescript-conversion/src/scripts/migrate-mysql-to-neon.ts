import mysql from "mysql2/promise";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

interface MysqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const getMysqlConfig = (dbName: string): MysqlConfig => ({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  database: dbName,
});

async function migrateUsers() {
  console.log("Starting User migration...");
  const connection = await mysql.createConnection(
    getMysqlConfig(process.env.MYSQL_DB_USER || "salon_user_service")
  );

  try {
    const [rows]: any = await connection.execute(
      "SELECT * FROM user"
    );

    for (const row of rows) {
      try {
        await prisma.user.upsert({
          where: { email: row.email },
          update: {
            fullName: row.full_name || row.fname,
            username: row.username,
            fname: row.fname,
            lname: row.lname || null,
            phone: row.phone || null,
            role:
              row.role?.toUpperCase() || "CUSTOMER",
            updatedAt: new Date(row.updated_at),
          },
          create: {
            clerkId: row.clerk_id || null,
            fullName: row.full_name || row.fname,
            username: row.username,
            fname: row.fname,
            lname: row.lname || null,
            email: row.email,
            phone: row.phone || null,
            role:
              row.role?.toUpperCase() || "CUSTOMER",
            password: row.password || null,
            createdAt: new Date(row.created_at),
          },
        });
      } catch (err) {
        console.error(`Error migrating user ${row.id}:`, err);
      }
    }

    console.log(`✓ Migrated ${rows.length} users`);
  } finally {
    await connection.end();
  }
}

async function migrateSalons() {
  console.log("Starting Salon migration...");
  const connection = await mysql.createConnection(
    getMysqlConfig(process.env.MYSQL_DB_SALON || "salon_salon_service")
  );

  try {
    const [rows]: any = await connection.execute(
      "SELECT * FROM salon"
    );

    for (const row of rows) {
      try {
        // Find the owner by email or username from users
        const owner = await prisma.user.findFirst({
          where: {
            OR: [
              { id: row.owner_id },
              { email: row.owner_email },
            ],
          },
        });

        if (!owner) {
          console.warn(
            `Skipping salon ${row.id}: Owner not found in users table`
          );
          continue;
        }

        await prisma.salon.upsert({
          where: { id: row.id },
          update: {
            name: row.name,
            images: row.images ? JSON.parse(row.images) : null,
            address: row.address,
            phone: row.phone,
            email: row.email,
            city: row.city,
            openTime: row.open_time || "09:00",
            closeTime: row.close_time || "18:00",
            updatedAt: new Date(row.updated_at),
          },
          create: {
            id: row.id,
            name: row.name,
            images: row.images ? JSON.parse(row.images) : null,
            address: row.address,
            phone: row.phone,
            email: row.email,
            city: row.city,
            ownerId: owner.id,
            openTime: row.open_time || "09:00",
            closeTime: row.close_time || "18:00",
            createdAt: new Date(row.created_at),
          },
        });
      } catch (err) {
        console.error(`Error migrating salon ${row.id}:`, err);
      }
    }

    console.log(`✓ Migrated salons`);
  } finally {
    await connection.end();
  }
}

async function migrateCategories() {
  console.log("Starting Category migration...");
  const connection = await mysql.createConnection(
    getMysqlConfig(process.env.MYSQL_DB_CATEGORY || "salon_category_service")
  );

  try {
    const [rows]: any = await connection.execute(
      "SELECT * FROM category"
    );

    for (const row of rows) {
      try {
        await prisma.category.upsert({
          where: { id: row.id },
          update: {
            name: row.name,
            image: row.image || null,
            updatedAt: new Date(row.updated_at),
          },
          create: {
            id: row.id,
            name: row.name,
            image: row.image || null,
            salonId: row.salon_id,
            createdAt: new Date(row.created_at),
          },
        });
      } catch (err) {
        console.error(`Error migrating category ${row.id}:`, err);
      }
    }

    console.log(`✓ Migrated categories`);
  } finally {
    await connection.end();
  }
}

async function migrateServiceOfferings() {
  console.log("Starting ServiceOffering migration...");
  const connection = await mysql.createConnection(
    getMysqlConfig(
      process.env.MYSQL_DB_SERVICE_OFFERING || "salon_service_offering"
    )
  );

  try {
    const [rows]: any = await connection.execute(
      "SELECT * FROM service_offering"
    );

    for (const row of rows) {
      try {
        await prisma.serviceOffering.upsert({
          where: { id: row.id },
          update: {
            name: row.name,
            description: row.description || "",
            price: row.price,
            duration: row.duration,
            image: row.image || null,
            updatedAt: new Date(row.updated_at),
          },
          create: {
            id: row.id,
            name: row.name,
            description: row.description || "",
            price: row.price,
            duration: row.duration,
            salonId: row.salon_id,
            categoryId: row.category_id,
            image: row.image || null,
            createdAt: new Date(row.created_at),
          },
        });
      } catch (err) {
        console.error(`Error migrating service offering ${row.id}:`, err);
      }
    }

    console.log(`✓ Migrated service offerings`);
  } finally {
    await connection.end();
  }
}

async function migrateBookings() {
  console.log("Starting Booking migration...");
  const connection = await mysql.createConnection(
    getMysqlConfig(process.env.MYSQL_DB_BOOKING || "salon_booking_service")
  );

  try {
    const [rows]: any = await connection.execute(
      "SELECT * FROM booking"
    );

    for (const row of rows) {
      try {
        // Create booking
        const booking = await prisma.booking.upsert({
          where: { id: row.id },
          update: {
            bookingStatus: row.booking_status?.toUpperCase() || "PENDING",
            startTime: new Date(row.start_time),
            endTime: new Date(row.end_time),
            totalPrice: row.total_price,
            updatedAt: new Date(row.updated_at),
          },
          create: {
            id: row.id,
            salonId: row.salon_id,
            customerId: row.customer_id,
            bookingStatus: row.booking_status?.toUpperCase() || "PENDING",
            startTime: new Date(row.start_time),
            endTime: new Date(row.end_time),
            totalPrice: row.total_price,
            createdAt: new Date(row.created_at),
          },
        });

        // Migrate booking services
        const [bookingServices]: any = await connection.execute(
          "SELECT * FROM booking_service WHERE booking_id = ?",
          [row.id]
        );

        for (const service of bookingServices) {
          try {
            await prisma.bookingService.upsert({
              where: {
                bookingId_serviceId: {
                  bookingId: booking.id,
                  serviceId: service.service_id,
                },
              },
              update: {},
              create: {
                bookingId: booking.id,
                serviceId: service.service_id,
              },
            });
          } catch (err) {
            console.error(
              `Error migrating booking service for booking ${row.id}:`,
              err
            );
          }
        }
      } catch (err) {
        console.error(`Error migrating booking ${row.id}:`, err);
      }
    }

    console.log(`✓ Migrated bookings`);
  } finally {
    await connection.end();
  }
}

async function migratePayments() {
  console.log("Starting Payment migration...");
  const connection = await mysql.createConnection(
    getMysqlConfig(process.env.MYSQL_DB_PAYMENT || "salon_payment_service")
  );

  try {
    const [rows]: any = await connection.execute(
      "SELECT * FROM payment_order"
    );

    for (const row of rows) {
      try {
        await prisma.paymentOrder.upsert({
          where: { id: row.id },
          update: {
            amount: row.amount,
            status: row.status?.toUpperCase() || "PENDING",
            paymentMethod: row.payment_method?.toUpperCase() || "RAZORPAY",
            paymentLinkId: row.payment_link_id || null,
            updatedAt: new Date(row.updated_at),
          },
          create: {
            id: row.id,
            amount: row.amount,
            status: row.status?.toUpperCase() || "PENDING",
            paymentMethod: row.payment_method?.toUpperCase() || "RAZORPAY",
            paymentLinkId: row.payment_link_id || null,
            userId: row.user_id,
            bookingId: row.booking_id,
            salonId: row.salon_id,
            createdAt: new Date(row.created_at),
          },
        });
      } catch (err) {
        console.error(`Error migrating payment order ${row.id}:`, err);
      }
    }

    console.log(`✓ Migrated payment orders`);
  } finally {
    await connection.end();
  }
}

async function main() {
  console.log("🚀 Starting data migration from MySQL to Neon PostgreSQL...\n");

  try {
    await migrateUsers();
    await migrateSalons();
    await migrateCategories();
    await migrateServiceOfferings();
    await migrateBookings();
    await migratePayments();

    console.log("\n✅ Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();