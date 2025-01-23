import express, { Request, Response } from "express";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
import { PrismaClient } from '@prisma/client'
import { getUser, User, userSignIn, userSignUp } from "../types";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET? process.env.JWT_SECRET: "secret";

const router = express.Router();

// @ts-ignore
router.post("/signup", async (req, res) => {
    const prisma = new PrismaClient();

    const body: userSignUp = req.body;
    if (!body.email || !body.password || !body.name) {
        return res.status(400).json({ message: "Missing input field(s)" });
    }
    try {
        const [professorExists, studentExists] = await Promise.all([
            prisma.professor.findUnique({
                where: { email: body.email },
            }),
            prisma.student.findUnique({
                where: { email: body.email },
            }),
        ]);
        if (professorExists) {
            return res.status(409).json({ message: "Account liked to professor profile" });
        }
        if (studentExists) {
            return res.status(404).json({ message: "Student profile already exists" });
        }

        const hashedPassword: string = await bcrypt.hash(body.password, 10);
        const student: User = await prisma.student.create({
            data: {
                email: body.email,
                name: body.name,
                password: hashedPassword
            } 
        })

        const token: string =  jwt.sign(
            { 
                id: student.id,
                email: student.email,
                role: "student"
            }, 
            JWT_SECRET
        );
        return res.status(201).json({ token });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "error while signing up" })
    } finally {
        await prisma.$disconnect();
    }
});

// @ts-ignore
router.post("/signin", async (req: Request, res: Response) => {
    const prisma = new PrismaClient();

    const body: userSignIn = req.body;
    try {
        const student: (User | null) = await prisma.student.findUnique({
            where: { email: body.email }
        });
        if(!student) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordValid: boolean = await bcrypt.compare(
            body.password, 
            student.password
        );
        if (!passwordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token: string = jwt.sign(
            { 
                id: student.id,
                email: student.email, 
                role: "student"
            }, 
            JWT_SECRET
        );
        return res.json({ token });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "error while signing in" });
    } finally {
        await prisma.$disconnect();
    }
});

// @ts-ignore
router.get("/", async (req, res) => {
    const prisma = new PrismaClient();

    try {
        const students: getUser[] = await prisma.student.findMany({
            select: {
                id: true,
                email: true,
                name: true
            }
        });
        return res.status(200).json(students);
    } catch (err) {
        return res.status(500).json({ error: "error while fetching professors" });
    } finally {
        await prisma.$disconnect();
    }
})

export default router;