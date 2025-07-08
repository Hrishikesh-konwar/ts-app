import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { login, getConfig } from "./controller";
import { validateToken } from "./middleware/tokenMiddleware";

dotenv.config();

const app : Application = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.get("/api/v1/auth/login", login);

app.get("/api/v1/auth/register", validateToken ,getConfig);

app.listen(PORT, () => {
  console.log(`erver is running on port ${PORT}`);
});
