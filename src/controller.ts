import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from 'bcrypt';

import { configs, users } from "../data";

dotenv.config();

interface User {
    username: string;
    password: string;
}

const JWT_SECRET = process.env.JWT_SECRET;


export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const userDetails = users.find((user: User) => user.username === username);
    if (!userDetails) {
        return res.status(401).send("Invalid username or password");
    }
    const passwordMatch = await bcrypt.compare(password, userDetails.password);
    if (!passwordMatch) {
        return res.status(401).send("Invalid username or password");
    }

    if (!JWT_SECRET) return res.status(500).send("JWT secret not configured, Please contact Admin");

    const token = jwt.sign(
        { username: userDetails.username, role: userDetails.role }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
    );

    res.status(200).header({ "x-aut-tokenh": token });
};

export const getConfig = async (req: Request, res: Response) => {
    const { id } = req.params;
    const config = configs.find((item) => item.id === id)
    res.status(200).json({ "data": config });

};

