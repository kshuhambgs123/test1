import { Logs, User } from '@prisma/client';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import formdata from 'form-data';
import { updateCredits } from '../db/admin';
import { createLog, getOneLog, updateLog } from '../db/log';
import { getUser, removeCredits } from '../db/user';
import apiauth from '../middleware/apiAuth';
dotenv.config();

const app = express.Router();

function checkUrl(url: string): boolean {
    const basePattern = /^https:\/\/app\.apollo\.io\/#\/people\?/;

    const invalidPattern = /contactLabelIds\[\]=/;

    return basePattern.test(url) && !invalidPattern.test(url);
}


interface LeadStatusResponse {
    record_id: string; // Unique identifier for the record
    apollo_link: string; // Link associated with Apollo (if any)
    file_name: string; // Name of the file (if any)
    requested_leads_count: string; // Number of requested leads (stored as a string)
    enrichment_status: string; // Status of the enrichment process
    spreadsheet_url: string; // URL of the associated Google spreadsheet
    enriched_records: number; // Count of enriched records
    credits_involved: number; // Number of credits involved in the process
    phase1: string; // Phase 1 details (if any)
}

app.post("/searchleads", apiauth, async (req: Request, res: Response): Promise<void> => {
    try {
        const userID = (req as any).user.UserID;
        const user = await getUser(userID);
        console.log("User:came ");
        const { apolloLink, noOfLeads, fileName } = req.body;

        if (!apolloLink || !noOfLeads || !fileName) {
            res.status(400).json({ message: "Missing fields" });
            return;
        }

        //    const fixedFilename = removePunctuation(fileName);

        if (!checkUrl(apolloLink)) {
            res.status(400).json({ message: "Invalid URL" });
            return;
        }

        const noOfLeadsNumeric = parseInt(noOfLeads);

        if (noOfLeadsNumeric < 1000 || noOfLeadsNumeric > 50000 || noOfLeadsNumeric % 1000 !== 0
        ) {
            res.status(400).json({ message: "Invalid number of leads" });
            return;
        }


        let credits = noOfLeadsNumeric;

        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        if (user.credits < credits) {
            res.status(400).json({ message: "Insufficient credits" });
            return;
        }

        const dns = process.env.DNS as string;


        const formData = new formdata();

        formData.append('apollo_link', apolloLink);
        formData.append('file_name', fileName);
        formData.append('id', dns);
        formData.append('leads_count', noOfLeadsNumeric);

        const searchAPI = process.env.SEARCHAUTOMATIONAPI as string;

        console.log("sent data to n8n");
        const response = await fetch(searchAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            res.status(400).json({ message: "Failed to search leads" });
            return;
        }

        const data = await response.json();
        console.log("data from n8n");
        //creating log

        const newLog = await createLog(data.record_id, userID, noOfLeadsNumeric, 0, apolloLink, fileName, credits, "url");

        // Deduct credit
        const state = await removeCredits(credits, userID);
        if (!state) {
            res.status(400).json({ message: "Failed to deduct credits" });
            return;
        }

        res.status(200).json({ message: `Lead searched successfully balance: ${state.credits} and log created`, balance: state.credits, log: newLog });

        setImmediate(async () => {
            console.log("starting checking lead status for logID: ", newLog?.LogID);
            const resp = await checkLeadStatus(newLog as Logs);
            console.log("Lead status checked for logID: ", newLog?.LogID);
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

async function checkLeadStatus(log: Logs) {

    const leadStatusAPI = process.env.SEARCHAUTOMATIONAPISTATUS as string;

    const checkStatus = async (): Promise<LeadStatusResponse | null> => {
        const maxTries = 720;
        let tries = 0;
        let response: LeadStatusResponse | null = null;

        while (tries < maxTries) {
            const res = await fetch(leadStatusAPI, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ "record_id": log.LogID }),
            });

            if (res.ok) {
                response = await res.json() as LeadStatusResponse;

                if (response.enrichment_status == 'Completed' || response.enrichment_status == 'Failed' || response.enrichment_status == 'Cancelled') {
                    return response;
                }

                tries++;
                await new Promise(r => setTimeout(r, 1 * 60 * 1000));
            }

            tries++;
            await new Promise(r => setTimeout(r, 1 * 60 * 1000));
        }
        const upLead = await updateLog(log.LogID, 'Failed', '', 0);
        if (!upLead) {
            return null;
        }
        return null;
    }

    const response = await checkStatus();

    if (!response) {
        return;
    }

    if (response.enrichment_status == 'Cancelled' || response.enrichment_status == 'Failed') {
        const upLead = await updateLog(log.LogID, response.enrichment_status, response.spreadsheet_url, response.enriched_records);
        if (!upLead) {
            return;
        }
        const state = await updateCredits(upLead.userID, upLead.creditsUsed)
        if (!state) {
            return;
        }

        console.log("Lead status failed for logID: ", log.LogID);
    }

    if (response.enrichment_status == 'Completed') {
        const updateLead = await updateLog(log.LogID, response.enrichment_status, response.spreadsheet_url, response.enriched_records);

        if (!updateLead) {
            return;
        }

        console.log("Lead status completed for logID: ", log.LogID);
    }
}


app.post("/checkleadStatus", apiauth, async (req: Request, res: Response): Promise<void> => {
    try {
        const { logID } = req.body;

        if (!logID) {
            res.status(400).json({ message: "Missing fields" });
            return;
        }

        const log = await getOneLog(logID);

        if (!log) {
            res.status(404).json({ message: "Log not found" });
            return;
        }

        if (log.status === "Completed") {
            res.status(200).json({ message: "Lead has been completed", log: log });
            return;
        }

        if (log.status === "Failed") {
            res.status(200).json({ message: "Lead has failed", log: log });
            return;
        }

        if (log.status === "Cancelled") {
            res.status(200).json({ message: "Lead has been cancelled", log: log });
            return;
        }

        res.status(200).json({ message: "Lead is still in progress", log: log });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
})

export default app;