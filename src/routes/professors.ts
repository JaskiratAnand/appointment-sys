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
        return res.status(400).json({ message: "Missing fields" });
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
            return res.status(409).json({ message: "Professor profile already exists" });
        }
        if (studentExists) {
            return res.status(404).json({ message: "Account linked to student profile" });
        }

        const hashedPassword: string = await bcrypt.hash(body.password, 10);
        const professor: User = await prisma.professor.create({
            data: {
                email: body.email,
                name: body.name,
                password: hashedPassword
            } 
        })

        const token: string =  jwt.sign(
            { 
                id: professor.id,
                email: professor.email,
                role: "professor"
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
        const professor: (User | null) = await prisma.professor.findUnique({
            where: { email: body.email }
        });
        if(!professor) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordValid: boolean = await bcrypt.compare(
            body.password, 
            professor.password
        );
        if (!passwordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token: string = jwt.sign(
            { 
                id: professor.id,
                email: professor.email, 
                role: "professor"
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
        const professors: getUser[] = await prisma.professor.findMany({
            select: {
                id: true,
                email: true,
                name: true
            }
        });
        return res.status(200).json(professors);
    } catch (err) {
        return res.status(500).json({ error: "error while fetching professors" });
    } finally {
        await prisma.$disconnect();
    }
})

export default router;