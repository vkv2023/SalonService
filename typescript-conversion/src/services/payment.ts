import { PaymentMethod, PaymentOrderStatus } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { prisma } from "../shared/prisma.js";
import { requireAuth } from "../shared/auth.js";

export const paymentRouter = Router();

const createOrderSchema = z.object({
  bookingId: z.number().int().positive(),
  salonId: z.number().int().positive(),
  userId: z.number().int().positive(),
  totalPrice: z.number().int().nonnegative(),
  paymentMethod: z.nativeEnum(PaymentMethod)
});

paymentRouter.post("/api/payments/create", requireAuth, async (req: Request, res: Response) => {
  const parsed = createOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payment payload" });
  }

  const paymentOrder = await prisma.paymentOrder.create({
    data: {
      amount: parsed.data.totalPrice,
      paymentMethod: parsed.data.paymentMethod,
      userId: parsed.data.userId,
      bookingId: parsed.data.bookingId,
      salonId: parsed.data.salonId,
      status: PaymentOrderStatus.PENDING,
      paymentLinkId: `plink_${Date.now()}`
    }
  });

  res.json({
    payment_link_url: `https://payments.example/checkout/${paymentOrder.paymentLinkId}`,
    get_payment_link_Id: paymentOrder.paymentLinkId
  });
});

paymentRouter.get("/api/payments/order/:paymentOrderId", async (req: Request, res: Response) => {
  const paymentOrderId = Number(req.params.paymentOrderId);
  const order = await prisma.paymentOrder.findUnique({ where: { id: paymentOrderId } });
  if (!order) {
    return res.status(404).json({ message: "Payment order not found..." });
  }
  res.json(order);
});

paymentRouter.get("/api/payments/:paymentId", async (req: Request, res: Response) => {
  const paymentId = String(req.params.paymentId);
  const order = await prisma.paymentOrder.findFirst({ where: { paymentLinkId: paymentId } });
  if (!order) {
    return res.status(404).json({ message: "Payment order not found..." });
  }
  res.json(order);
});

paymentRouter.patch("/api/payments/proceed", requireAuth, async (req: Request, res: Response) => {
  const body = z.object({ paymentId: z.string(), paymentLinkId: z.string() }).safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ message: "Invalid proceed payload" });
  }

  const order = await prisma.paymentOrder.findFirst({ where: { paymentLinkId: body.data.paymentId } });
  if (!order) {
    return res.status(404).json({ message: "Payment order not found..." });
  }

  const updated = await prisma.paymentOrder.update({
    where: { id: order.id },
    data: { status: PaymentOrderStatus.SUCCESS }
  });

  res.json(updated.status === PaymentOrderStatus.SUCCESS);
});
