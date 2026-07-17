import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { bookingRouter } from "./services/booking.js";
import { categoryRouter } from "./services/category.js";
import { paymentRouter } from "./services/payment.js";
import { salonRouter } from "./services/salon.js";
import { serviceOfferingRouter } from "./services/serviceOffering.js";
import { userRouter } from "./services/user.js";

dotenv.config();

function ensureEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function validateAuthConfig() {
  const authMode = (process.env.AUTH_MODE ?? "clerk").toLowerCase();
  if (!["clerk", "legacy", "hybrid"].includes(authMode)) {
    throw new Error("AUTH_MODE must be one of: clerk, legacy, hybrid");
  }

  if (authMode === "legacy") {
    return;
  }

  const issuer = process.env.CLERK_ISSUER ?? process.env.CLERK_ISSUER_URL;
  if (!issuer) {
    throw new Error("Missing required environment variable: CLERK_ISSUER or CLERK_ISSUER_URL");
  }

  ensureEnv("CLERK_AUDIENCE");
}

validateAuthConfig();

const app = express();
const port = Number(process.env.PORT ?? 5001);
const serviceName = process.env.SERVICE_NAME ?? "user";

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "UP", serviceName });
});

switch (serviceName) {
  case "user":
    app.use(userRouter);
    break;
  case "salon":
    app.use(salonRouter);
    break;
  case "category":
    app.use(categoryRouter);
    break;
  case "service-offering":
    app.use(serviceOfferingRouter);
    break;
  case "booking":
    app.use(bookingRouter);
    break;
  case "payment":
    app.use(paymentRouter);
    break;
  default:
    throw new Error(`Unsupported SERVICE_NAME: ${serviceName}`);
}

app.listen(port, () => {
  console.log(`TypeScript service '${serviceName}' listening on ${port}`);
});
