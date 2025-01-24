import { Router } from "express";
import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET? process.env.JWT_SECRET: "secret";
const router = Router();

// @ts-ignore
router.use('/*', async (req, res, next) => {
    const authHeader = req.get("authorization") || "";
    const token = authHeader.split(" ")[1]; 

    if (!token) {
        return res.status(403).json({ message: "Authorization token is missing" });
    }

    try{
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        const { id, email, role } = decoded;
        if (id) {
            req.body.id = id;
            req.body.email = email
            req.body.role = role;
            next();
        } else {
            return res.status(403).json({ message: "Invalid token"})
        }
    } catch (err) {
        console.error("JWT verification failed: invalid token");
        return res.status(403).json({ message: "you are not logged in or invalid token"})
    }
});

// @ts-ignore
router.post("/timeslots", async (req, res) => {
    const prisma = new PrismaClient();

    const { id, role } = req.body;
    if (role !== "professor") {
        return res.status(403).json({ message: "Only professors can create time slots" });
    }
    
    const { startTime, endTime } = req.body;
    if (!startTime || !endTime) {
        return res.status(400).json({ message: "Empty body params {startTime, endTime}" });
    }

    try {
        const existingTimeslot = await prisma.timeSlot.findFirst({
            where: {
                AND: [
                    { professorId: id },
                    { start: new Date(startTime) },
                    { end: new Date(endTime) }
                ]
            }
        });
        if (existingTimeslot) {
            return res.status(400).json({ message: "Time slot already exists" });
        }

        const timeslot = await prisma.timeSlot.create({
            data: {
                start: new Date(startTime),
                end: new Date(endTime),
                professorId: id
            }
        })

        return res.status(201).json({ 
            message: "Time slot created",
            timeslotId: timeslot.id
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "error while creating timeslot" });
    } finally {
        await prisma.$disconnect();
    }
})

// @ts-ignore
router.get("/timeslots/:professorId", async (req, res) => {
    const prisma = new PrismaClient();

    const { professorId } = req.params;
    if (!professorId) {
        return res.status(400).json({ message: "Empty req param {professorId}" });
    }
    try {
        const timeslots = await prisma.timeSlot.findMany({
            where: {
                professorId: professorId,
                isBooked: false
            }
        });
        return res.status(200).json({
            professorId,
            timeslots
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "error fetching timeslots" });
    } finally {
        await prisma.$disconnect();
    }
});

// @ts-ignore
router.post("/appointment", async (req, res) => {
    const prisma = new PrismaClient();

    const { id, role } = req.body;
    if (role !== "student") {
        return res.status(403).json({ message: "Only students can book appointments" });
    }

    const { timeSlotId } = req.body;
    if (!timeSlotId) {
        return res.status(400).json({ message: "Empty body param {timeSlotId}'" });
    }

    try {
        const timeslot = await prisma.timeSlot.findUnique({
            where: {
                id: timeSlotId
            }
        })
        if (!timeslot) {
            return res.status(404).json({ message: "Time slot not found" });
        }
        if (timeslot.isBooked) {
            return res.status(400).json({ message: "Time slot is already booked" });
        }

        const [appointment, updateTimeSlot] = await Promise.all([
            prisma.appointment.create({
                data: {
                    timeSlotId: timeSlotId,
                    studentId: id,
                    professorId: timeslot.professorId
                }
            }),
            prisma.timeSlot.update({
                where: {
                    id: timeSlotId
                },
                data: {
                    isBooked: true
                }
            })
        ]);
        
        return res.status(201).json({ 
            message: "Appointment created",
            appointmentId: appointment.id,
            startTime: updateTimeSlot.start,
            endTime: updateTimeSlot.end
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "error while creating appointment" });
    } finally {
        await prisma.$disconnect();
    }
})

// @ts-ignore
router.get("/appointment", async (req, res) => {
    const prisma = new PrismaClient();

    const { id, role } = req.body;
    
    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                OR: [
                    { studentId: id },
                    { professorId: id }
                ]
            }
        });
        return res.status(200).json({ id: id, role, appointments});
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "error fetching appointments" });
    } finally {
        await prisma.$disconnect();
    }
});

// @ts-ignore
router.delete("/appointment/:appointmentId", async (req, res) => {
    const prisma = new PrismaClient();

    const { id, role } = req.body;
    if (role !== "professor") {
        return res.status(403).json({ message: "Only professors can cancel their appointments" });
    }

    const { appointmentId } = req.params;
    if (!appointmentId) {
        return res.status(400).json({ message: "Empty req param {appointmentId}" });
    }

    try {
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            }
        })
        if (!appointment) {
            return res.status(404).json({ message: "Invalid appointmentId" });
        }
        if (appointment.professorId !== id) {
            return res.status(403).json({ message: "You are not authorized to cancel this appointment" });
        }

        await Promise.all([
            prisma.timeSlot.update({
                where: {
                    id: appointment.timeSlotId
                },
                data: {
                    isBooked: false
                }
            }),
            prisma.appointment.update({
                where: {
                    id: appointmentId
                },
                data: {
                    status: "CANCELED"
                }
            })
        ]);
        return res.status(200).json({ message: "Appointment cancelled" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "error while cancelling appointment" });
    } finally {
        await prisma.$disconnect();
    }
})

export default router;