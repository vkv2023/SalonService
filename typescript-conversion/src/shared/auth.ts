import type {
  NextFunction as ExpressNextFunction,
  Request as ExpressRequest,
  Response as ExpressResponse
} from "express";
import dotenv from "dotenv";
import { prisma } from "./prisma.js";

dotenv.config();

export type AuthUser = {
  userId: number;
  role: "CUSTOMER" | "ADMIN" | "SALON_OWNER";
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  clerkId?: string;
};

export type AuthedRequest = ExpressRequest & { authUser?: AuthUser };
type JWTPayload = Record<string, unknown>;

type JoseLikeModule = {
  createRemoteJWKSet: (url: URL) => unknown;
  jwtVerify: (
    token: string,
    jwks: unknown,
    options: { issuer: string; audience?: string }
  ) => Promise<{ payload: JWTPayload }>;
};

const VALID_ROLES = new Set<AuthUser["role"]>(["CUSTOMER", "ADMIN", "SALON_OWNER"]);

const authMode = (process.env.AUTH_MODE ?? "clerk").toLowerCase();

const clerkIssuer = process.env.CLERK_ISSUER ?? process.env.CLERK_ISSUER_URL;
const clerkAudience = process.env.CLERK_AUDIENCE;
const clerkJwksUrl =
  process.env.CLERK_JWKS_URL ??
  (clerkIssuer ? `${clerkIssuer.replace(/\/$/, "")}/.well-known/jwks.json` : undefined);

let joseModulePromise: Promise<JoseLikeModule | null> | null = null;

async function getJoseModule(): Promise<JoseLikeModule | null> {
  if (!joseModulePromise) {
    joseModulePromise = (new Function("return import('jose')")() as Promise<unknown>)
      .then((module) => module as JoseLikeModule)
      .catch(() => null);
  }
  return joseModulePromise;
}

function parseLegacyHeaders(req: AuthedRequest): AuthUser | null {
  const rawUserId = req.get("x-user-id");
  const rawRole = req.get("x-user-role");

  const userId = Number(rawUserId);
  const roleHeader = rawRole;

  if (!Number.isFinite(userId) || !roleHeader) {
    return null;
  }

  const role = roleHeader.toUpperCase() as AuthUser["role"];
  if (!VALID_ROLES.has(role)) {
    return null;
  }

  return { userId, role };
}

function extractBearerToken(authorizationHeader?: string): string {
  if (!authorizationHeader) {
    throw new Error("Missing Authorization header");
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid Authorization header format");
  }

  return token;
}

function claimAsString(payload: JWTPayload, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key] as unknown;
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return undefined;
}

export async function verifyClerkTokenFromRequest(req: ExpressRequest): Promise<{
  clerkId: string;
  email?: string;
  payload: JWTPayload;
}> {
  if (!clerkJwksUrl || !clerkIssuer) {
    throw new Error("Clerk authentication is not configured");
  }

  const jose = await getJoseModule();
  if (!jose) {
    throw new Error("JWT verifier library is unavailable. Install 'jose' to enable Clerk auth.");
  }

  const authHeader = req.get("authorization");
  const token = extractBearerToken(authHeader ?? undefined);
  const jwks = jose.createRemoteJWKSet(new URL(clerkJwksUrl));

  const verifyOptions = clerkAudience
    ? { issuer: clerkIssuer, audience: clerkAudience }
    : { issuer: clerkIssuer };

  try {
    const { payload } = await jose.jwtVerify(token, jwks, verifyOptions);
    const clerkId = payload.sub as string | undefined;

    if (!clerkId) {
      throw new Error("Invalid Clerk token payload: missing subject");
    }

    const email = claimAsString(payload, ["email", "email_address", "primary_email_address"]);

    return {
      clerkId,
      email,
      payload
    };
  } catch (error) {
    if (!clerkAudience) {
      throw error;
    }

    const fallback = await jose.jwtVerify(token, jwks, { issuer: clerkIssuer }).catch(() => null);
    if (!fallback) {
      throw error;
    }

    const clerkId = fallback.payload.sub as string | undefined;
    if (!clerkId) {
      throw new Error("Invalid Clerk token payload: missing subject");
    }

    const email = claimAsString(fallback.payload, ["email", "email_address", "primary_email_address"]);
    return {
      clerkId,
      email,
      payload: fallback.payload
    };
  }
}

export async function requireAuth(req: AuthedRequest, res: ExpressResponse, next: ExpressNextFunction) {
  try {
    // Legacy mode supports existing gateway header forwarding.
    if (authMode === "legacy" || authMode === "hybrid") {
      const legacyUser = parseLegacyHeaders(req);
      if (legacyUser) {
        req.authUser = legacyUser;
        return next();
      }

      if (authMode === "legacy") {
        return res.status(401).json({ message: "Unauthorized" });
      }
    }

    const { clerkId } = await verifyClerkTokenFromRequest(req);
    const user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
      return res.status(401).json({
        message: "User profile not linked. Complete /api/auth/signup first."
      });
    }

    req.authUser = {
      userId: user.id,
      role: user.role,
      approvalStatus: user.approvalStatus,
      clerkId: user.clerkId ?? undefined
    };

    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

export function requireRole(roles: AuthUser["role"][]) {
  return (req: AuthedRequest, res: ExpressResponse, next: ExpressNextFunction) => {
    if (!req.authUser || !roles.includes(req.authUser.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}

export function requireApprovedOwner(req: AuthedRequest, res: ExpressResponse, next: ExpressNextFunction) {
  if (!req.authUser) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.authUser.role !== "SALON_OWNER") {
    return res.status(403).json({ message: "Only salon owners can perform this action." });
  }

  if (req.authUser.approvalStatus !== "APPROVED") {
    return res.status(403).json({
      message: "Salon owner account is pending admin approval."
    });
  }

  return next();
}
