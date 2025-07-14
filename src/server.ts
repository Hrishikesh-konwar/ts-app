import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { login, getConfig } from "./controller";
import { validateToken, checkJsonMiddleware } from "./middleware/middleware";

dotenv.config();

const app : Application = express();

const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(checkJsonMiddleware);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.post("/api/v1/auth/login", login);

app.get("/api/v1/auth/getConfig", validateToken ,getConfig);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
