import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import formdata from 'form-data';
import { getAllLogs, getOneLog, updateLog } from '../db/log';
import verifySessionToken from '../middleware/supabaseAuth';
dotenv.config();

const app = express.Router();

app.get("/getUserLogs", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
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

app.post("/getOneLog", verifySessionToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const { logID } = req.body;
        const log = await getOneLog(logID);

        if (!log) {
            res.status(404).json({ message: "Log not found" });
            return;
        }

        res.status(200).json({ log });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

app.post("/checkleadStatus", verifySessionToken, async (req: Request , res: Response): Promise<void> => {
    try {
        const { logID } = req.body;

        const leadStatusAPI = process.env.SEARCHAUTOMATIONAPISTATUS as string;

        const formData = new formdata();

        formData.append('record_id', logID);

        const response = await fetch(leadStatusAPI,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            res.status(400).json({ message: "Failed to check lead status" });
            return;
        }

        const data = await response.json();

        const updateLead = await updateLog(logID,data.enrichment_status,data.spreadsheet_url,data.enriched_records);

        if (!updateLead) {
            res.status(400).json({ message: "Failed to update log" });
            return;
        }

        res.status(200).json({ message: `Lead status checked successfully`,log:updateLead });
        
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})