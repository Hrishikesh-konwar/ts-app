
import jwt, { JwtPayload } from "jsonwebtoken";

import { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

interface TokenPayload extends JwtPayload {
    username: string;
    role: string;
}

dotenv.config()
export const validateToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("x-auth-token");
    if (!token) res.status(401).send("Access Denied");

    try {
        const allowedRoles = ['admin']
        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) return res.status(500).send("JWT secret not configured, Please contact Admin");
        const userData = jwt.verify(token as string, JWT_SECRET) as unknown as TokenPayload;

        if (!allowedRoles.includes(userData.role)) {
            return res.status(403).send("Forbidden: You don't have access to this resource.");
        }

        req.user = userData;

        next();
    } catch (err) {
        return res.status(400).send("Invalid Token");
    }
}