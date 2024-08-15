import express, { Request, Response } from 'express';
import { getAllLogs, getOneLog } from '../db/log';
import verifySessionToken from '../middleware/supabaseAuth';
import dotenv from 'dotenv';
dotenv.config();

const app = express.Router();

app.post("/getLogs", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userID = (req as any).user.id;
        const logs = await getAllLogs(userID);

        if (!logs) {
            res.status(404).json({ message: "Logs not found" });
            return;
        }

        res.status(200).json({ logs });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});