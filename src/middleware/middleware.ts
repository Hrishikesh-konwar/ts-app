
import jwt, { JwtPayload, TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";

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

    if (!token) {
        return res.status(401).json({ message: "Access Denied: No token provided" });
    }

    const allowedRoles = ["admin"];
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        return res.status(500).json({ message: "JWT secret not configured. Please contact admin." });
    }

    try {
        const userData = jwt.verify(token, JWT_SECRET) as TokenPayload;

        if (!allowedRoles.includes(userData.role)) {
            return res.status(403).json({ message: "Forbidden: You don't have access to this resource." });
        }

        req.user = userData;
        next();

    } catch (err: any) {
        if (err instanceof TokenExpiredError) {
            return res.status(401).json({ message: "Token expired. Please log in again." });
        } else if (err instanceof JsonWebTokenError) {
            return res.status(400).json({ message: "Invalid token." });
        } else {
            return res.status(500).json({ message: "Token verification failed." });
        }
    }
};

export const checkJsonMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const methodsRequiringJson = ["POST", "PUT", "PATCH"];

    if (methodsRequiringJson.includes(req.method)) {
        const contentType = req.headers["content-type"];

        if (!contentType || !contentType.includes("application/json")) {
            return res.status(415).json({ message: "Content-Type must be application/json. Please provide an Json payload" });
        }

        if (typeof req.body !== "object") {
            return res.status(400).json({ message: "Invalid JSON body" });
        }
    }

    next();
};
