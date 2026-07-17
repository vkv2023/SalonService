import { Router } from "express";
import { BookingStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../shared/prisma.js";
import { requireAuth, type AuthedRequest } from "../shared/auth.js";

export const bookingRouter = Router();

const createBookingSchema = z.object({
  salonId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  startDateTime: z.coerce.date(),
  serviceIds: z.array(z.number().int().positive()).min(1)
});

bookingRouter.post("/api/bookings", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid booking payload" });
  }

  const services = await prisma.serviceOffering.findMany({
    where: { id: { in: parsed.data.serviceIds }, salonId: parsed.data.salonId }
  });

  if (services.length === 0) {
    return res.status(400).json({ message: "empty list" });
  }

  const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

  const bookingStartTime = parsed.data.startDateTime;
  const bookingEndTime = new Date(bookingStartTime.getTime() + totalDuration * 60_000);

  const booking = await prisma.booking.create({
    data: {
      salonId: parsed.data.salonId,
      customerId: parsed.data.customerId,
      bookingStatus: BookingStatus.PENDING,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      totalPrice,
      services: {
        createMany: {
          data: parsed.data.serviceIds.map((serviceId) => ({ serviceId }))
        }
      }
    },
    include: { services: true }
  });

  res.status(201).json(booking);
});

bookingRouter.get("/api/bookings/customer/:customerId", async (req, res) => {
  const customerId = Number(req.params.customerId);
  const bookings = await prisma.booking.findMany({ where: { customerId } });
  if (bookings.length === 0) {
    return res.status(404).json({ message: `Booking not found for the Customer : ${customerId}` });
  }
  res.json(bookings);
});

bookingRouter.get("/api/bookings/salon/:salonId", async (req, res) => {
  const salonId = Number(req.params.salonId);
  const bookings = await prisma.booking.findMany({ where: { salonId } });
  if (bookings.length === 0) {
    return res.status(404).json({ message: `Booking not found for the salonID${salonId}` });
  }
  res.json(bookings);
});

bookingRouter.get("/api/bookings/:bookingId", async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return res.status(404).json({ message: `Booking not found for the booking id : ${bookingId}` });
  }
  res.json(booking);
});

bookingRouter.put("/api/bookings/:bookingId", async (req, res) => {
  const bookingId = Number(req.params.bookingId);
  const bookingStatus = z.nativeEnum(BookingStatus).safeParse(req.query.bookingStatus);

  if (!bookingStatus.success) {
    return res.status(400).json({ message: "Invalid booking status" });
  }

  const existing = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!existing) {
    return res.status(404).json({ message: `Booking not found for the booking id : ${bookingId}` });
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { bookingStatus: bookingStatus.data }
  });

  res.status(202).json(updated);
});

bookingRouter.get("/api/bookings/report/:salonId", async (req, res) => {
  const salonId = Number(req.params.salonId);
  const allBookings = await prisma.booking.findMany({ where: { salonId } });

  const totalEarnings = allBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const canceled = allBookings.filter((booking) => booking.bookingStatus === BookingStatus.CANCEL);
  const totalRefund = canceled.reduce((sum, booking) => sum + booking.totalPrice, 0);

  res.json({
    salonId,
    salonName: null,
    totalEarnings,
    totalBookings: allBookings.length,
    totalCanceledBookings: canceled.length,
    totalRefund
  });
});
